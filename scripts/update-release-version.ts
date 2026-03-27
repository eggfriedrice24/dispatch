import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface MutablePackageJson {
  version?: string;
  [key: string]: unknown;
}

export function updateReleaseVersion(
  version: string,
  options: { rootDir?: string } = {},
): { changed: boolean } {
  const rootDir = resolve(options.rootDir ?? process.cwd());
  const filePath = resolve(rootDir, "package.json");
  const packageJson = JSON.parse(readFileSync(filePath, "utf8")) as MutablePackageJson;

  if (packageJson.version === version) {
    return { changed: false };
  }

  packageJson.version = version;
  writeFileSync(filePath, `${JSON.stringify(packageJson, null, 2)}\n`);
  return { changed: true };
}

function parseArgs(argv: ReadonlyArray<string>): {
  version: string;
  rootDir: string | undefined;
  writeGithubOutput: boolean;
} {
  let version: string | undefined = undefined;
  let rootDir: string | undefined = undefined;
  let writeGithubOutput = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === undefined) {
      // Skip undefined entries
    } else if (argument === "--github-output") {
      writeGithubOutput = true;
    } else if (argument === "--root") {
      rootDir = argv[index + 1];
      if (!rootDir) {
        throw new Error("Missing value for --root.");
      }
      index += 1;
    } else if (argument.startsWith("--")) {
      throw new Error(`Unknown argument: ${argument}`);
    } else {
      if (version !== undefined) {
        throw new Error("Only one release version can be provided.");
      }
      version = argument;
    }
  }

  if (!version) {
    throw new Error(
      "Usage: bun scripts/update-release-version.ts <version> [--root <path>] [--github-output]",
    );
  }

  return { version, rootDir, writeGithubOutput };
}

const isMain =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const { version, rootDir, writeGithubOutput } = parseArgs(process.argv.slice(2));
  const { changed } = updateReleaseVersion(version, rootDir === undefined ? {} : { rootDir });

  if (!changed) {
    process.stdout.write("package.json version already matches release version.\n");
  }

  if (writeGithubOutput) {
    const githubOutputPath = process.env.GITHUB_OUTPUT;
    if (!githubOutputPath) {
      throw new Error("GITHUB_OUTPUT is required when --github-output is set.");
    }
    appendFileSync(githubOutputPath, `changed=${changed}\n`);
  }
}
