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
  commentCounts: Map<string, number>,
  annotationPaths: Set<string>,
  viewedFiles: Set<string>,
): TriageGroup {
  const attention: TriageFile[] = [];
  const changed: TriageFile[] = [];
  const lowRisk: TriageFile[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    const filePath = getDiffFilePath(file);
    const hasComments = (commentCounts.get(filePath) ?? 0) > 0;
    const hasAnnotations = annotationPaths.has(filePath);
    const isViewed = viewedFiles.has(filePath);

    const entry: TriageFile = {
      file,
      fileIndex: i,
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
