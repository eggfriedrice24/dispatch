import {
  AI_TRIAGE_SELECTION_DEFINITIONS,
  type AiTriagePayload,
  type AiTriageSelectionId,
} from "@/shared/ai-triage";

import { getDiffFilePath, type DiffFile } from "./diff-parser";

/**
 * Triage classifier — groups files into attention / changed / low-risk.
 *
 * - Attention: files with comments, CI annotations, or unresolved threads
 * - Changed: files modified with no special markers
 * - Low risk: viewed files, test files, config files, lockfiles, auto-generated
 */

export interface TriageGroup {
  attention: TriageFile[];
  changed: TriageFile[];
  lowRisk: TriageFile[];
}

export interface TriageFile {
  file: DiffFile;
  fileIndex: number;
  annotation?: string;
}

export type TriageSectionTone = "attention" | "changed" | "lowRisk";

export interface TriageSection {
  id: string;
  label: string;
  tone: TriageSectionTone;
  description?: string;
  files: TriageFile[];
}

export interface TriageSignals {
  commentCounts: Map<string, number>;
  annotationPaths: Set<string>;
  viewedFiles: Set<string>;
}

function resolveSignals(
  signalsOrCommentCounts: TriageSignals | Map<string, number>,
  annotationPaths: Set<string> | undefined,
  viewedFiles: Set<string> | undefined,
): TriageSignals {
  if (signalsOrCommentCounts instanceof Map) {
    return {
      commentCounts: signalsOrCommentCounts,
      annotationPaths: annotationPaths ?? new Set<string>(),
      viewedFiles: viewedFiles ?? new Set<string>(),
    };
  }

  return signalsOrCommentCounts;
}

const LOW_RISK_PATTERNS = [
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /__tests__\//,
  /\.snap$/,
  /\.lock$/,
  /lock\.json$/,
  /\.config\.[jt]s$/,
  /\.d\.ts$/,
  /\.generated\./,
  /\.min\.[jt]s$/,
  /package-lock\.json$/,
  /bun\.lockb$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
];

function isLowRisk(filePath: string): boolean {
  return LOW_RISK_PATTERNS.some((pattern) => pattern.test(filePath));
}

export function classifyFiles(
  files: DiffFile[],
  ...signalsArgs:
    | [signals: TriageSignals]
    | [commentCounts: Map<string, number>, annotationPaths: Set<string>, viewedFiles: Set<string>]
): TriageGroup {
  const [signalsOrCommentCounts, annotationPaths, viewedFiles] = signalsArgs;
  const signals = resolveSignals(signalsOrCommentCounts, annotationPaths, viewedFiles);
  const attention: TriageFile[] = [];
  const changed: TriageFile[] = [];
  const lowRisk: TriageFile[] = [];

  for (const [fileIndex, file] of files.entries()) {
    const filePath = getDiffFilePath(file);
    const hasComments = (signals.commentCounts.get(filePath) ?? 0) > 0;
    const hasAnnotations = signals.annotationPaths.has(filePath);
    const isViewed = signals.viewedFiles.has(filePath);

    const entry: TriageFile = {
      file,
      fileIndex,
      annotation: generateAnnotation(file, filePath),
    };

    if (hasComments || hasAnnotations) {
      // Files with comments or CI annotations need attention
      attention.push(entry);
    } else if (isViewed || isLowRisk(filePath)) {
      lowRisk.push(entry);
    } else {
      changed.push(entry);
    }
  }

  return { attention, changed, lowRisk };
}

export function getFallbackBucketForFile(
  filePath: string,
  ...signalsArgs:
    | [signals: TriageSignals]
    | [commentCounts: Map<string, number>, annotationPaths: Set<string>, viewedFiles: Set<string>]
): TriageSectionTone {
  const [signalsOrCommentCounts, annotationPaths, viewedFiles] = signalsArgs;
  const signals = resolveSignals(signalsOrCommentCounts, annotationPaths, viewedFiles);
  const hasComments = (signals.commentCounts.get(filePath) ?? 0) > 0;
  const hasAnnotations = signals.annotationPaths.has(filePath);
  const isViewed = signals.viewedFiles.has(filePath);

  if (hasComments || hasAnnotations) {
    return "attention";
  }
  if (isViewed || isLowRisk(filePath)) {
    return "lowRisk";
  }
  return "changed";
}

export function buildHeuristicTriageSections(groups: TriageGroup): TriageSection[] {
  const sections: TriageSection[] = [
    {
      id: "attention",
      label: "Needs attention",
      tone: "attention",
      files: groups.attention,
    },
    {
      id: "changed",
      label: "Changed",
      tone: "changed",
      files: groups.changed,
    },
    {
      id: "low-risk",
      label: "Low risk",
      tone: "lowRisk",
      files: groups.lowRisk,
    },
  ];

  return sections.filter((section) => section.files.length > 0);
}

export function buildAiTriageSections(
  groups: TriageGroup,
  payload: AiTriagePayload,
): TriageSection[] {
  const attentionSection =
    groups.attention.length > 0
      ? [
          {
            id: "attention",
            label: "Needs attention",
            description: "Comments, CI findings, or hotspots that likely deserve first review.",
            tone: "attention" as const,
            files: groups.attention,
          },
        ]
      : [];
  const changedEntryByPath = new Map(
    groups.changed.map((entry) => [getDiffFilePath(entry.file), entry]),
  );
  const assignedPaths = new Set<string>();
  const groupedFilesBySectionId = new Map<AiTriageSelectionId, TriageFile[]>();

  for (const section of payload.sections) {
    const currentFiles = groupedFilesBySectionId.get(section.sectionId) ?? [];
    for (const path of section.paths) {
      const entry = assignedPaths.has(path) ? null : changedEntryByPath.get(path);
      if (entry) {
        assignedPaths.add(path);
        currentFiles.push(entry);
      }
    }
    groupedFilesBySectionId.set(section.sectionId, currentFiles);
  }

  const changedSections = AI_TRIAGE_SELECTION_DEFINITIONS.flatMap((definition) => {
    const files = groupedFilesBySectionId.get(definition.id) ?? [];
    if (definition.id === "other-changes") {
      files.push(
        ...groups.changed.filter((entry) => !assignedPaths.has(getDiffFilePath(entry.file))),
      );
    }

    if (files.length === 0) {
      return [];
    }

    return [
      {
        id: definition.id,
        label: definition.label,
        description: definition.description,
        tone: definition.tone,
        files,
      },
    ];
  });
  const lowRiskSection =
    groups.lowRisk.length > 0
      ? [
          {
            id: "low-risk",
            label: "Low risk",
            description: "Viewed, generated, or support files that usually need lighter scrutiny.",
            tone: "lowRisk" as const,
            files: groups.lowRisk,
          },
        ]
      : [];

  return [...attentionSection, ...changedSections, ...lowRiskSection];
}

function generateAnnotation(file: DiffFile, filePath: string): string {
  const fileName = filePath.split("/").pop() ?? filePath;
  const ext = fileName.split(".").pop() ?? "";

  // Generate a contextual annotation based on file characteristics
  if (file.status === "added") {
    return `New file — ${ext} module`;
  }
  if (file.status === "deleted") {
    return "Removed";
  }
  if (file.status === "renamed") {
    return "Renamed";
  }

  const totalChanges = file.additions + file.deletions;
  if (totalChanges > 100) {
    return "Major changes";
  }
  if (totalChanges > 30) {
    return "Significant edits";
  }

  return "";
}
