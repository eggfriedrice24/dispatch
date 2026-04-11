/// <reference types="vite-plus" />
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron/simple";
import { defineConfig } from "vite-plus";

interface ElectronStartup {
  (...args: unknown[]): Promise<void>;
  exit?: () => Promise<void>;
}

let devElectronShutdownHooksInstalled = false;
let devElectronShutdownPromise: Promise<void> | null = null;
const projectRoot = dirname(fileURLToPath(import.meta.url));

function stopDevElectron(startup: ElectronStartup): Promise<void> {
  if (devElectronShutdownPromise) {
    return devElectronShutdownPromise;
  }

  devElectronShutdownPromise = Promise.resolve(startup.exit?.()).finally(() => {
    devElectronShutdownPromise = null;
  });

  return devElectronShutdownPromise;
}

function installDevElectronShutdownHooks(startup: ElectronStartup): void {
  if (devElectronShutdownHooksInstalled) {
    return;
  }

  devElectronShutdownHooksInstalled = true;

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    const forwardSignal = (): void => {
      process.removeListener(signal, forwardSignal);
      void stopDevElectron(startup).finally(() => {
        process.kill(process.pid, signal);
      });
    };

    process.once(signal, forwardSignal);
  }

  process.stdin.once("end", () => {
    void stopDevElectron(startup);
  });
}

export default defineConfig({
  fmt: {
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
    semi: true,
    singleQuote: false,
    quoteProps: "as-needed",
    trailingComma: "all",
    bracketSpacing: true,
    bracketSameLine: false,
    arrowParens: "always",
    endOfLine: "lf",
    singleAttributePerLine: true,
    sortImports: {
      groups: [
        "type-import",
        "value-builtin",
        "value-external",
        ["value-internal", "value-subpath"],
        ["value-parent", "value-sibling", "value-index"],
        "side_effect-import",
        "style",
        "unknown",
      ],
      newlinesBetween: true,
      internalPattern: ["@/*"],
      order: "asc",
      ignoreCase: true,
    },
    sortTailwindcss: {
      functions: ["clsx", "cn", "cva", "tw"],
    },
    sortPackageJson: {
      sortScripts: false,
    },
    ignorePatterns: ["dist", "dist-electron", "node_modules"],
  },
  lint: {
    plugins: ["import", "typescript", "unicorn", "vitest"],
    categories: {
      correctness: "error",
      suspicious: "warn",
      pedantic: "warn",
      perf: "warn",
      style: "warn",
    },
    env: {
      browser: true,
      node: true,
      es2024: true,
    },
    rules: {
      eqeqeq: "error",
      "no-console": "warn",
      "no-debugger": "error",
      "no-var": "error",
      "no-magic-numbers": "off",
      "prefer-const": "error",
      curly: "error",
      "func-style": "off",
      "sort-keys": "off",
      "sort-imports": "off",
      "no-ternary": "off",
      "no-nested-ternary": "off",
      "max-statements": "off",
      "max-lines": "off",
      "max-lines-per-function": "off",
      "id-length": "off",
      "no-shadow": "off",
      "unicorn/prefer-node-protocol": "error",
      "unicorn/no-null": "off",
      "unicorn/filename-case": [
        "error",
        {
          case: "kebabCase",
        },
      ],
      "unicorn/prefer-top-level-await": "off",
      "unicorn/prefer-query-selector": "warn",
      "unicorn/no-nested-ternary": "off",
      "unicorn/explicit-length-check": "off",
      "unicorn/prefer-logical-operator-over-ternary": "off",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/array-type": "off",
      "import/no-duplicates": "error",
      "import/no-nodejs-modules": "off",
      "import/no-unassigned-import": "off",
      "import/consistent-type-specifier-style": "off",
      "import/group-exports": "off",
      "import/no-named-export": "off",
      "import/no-namespace": "off",
      "import/prefer-default-export": "off",
      "import/exports-last": "off",
      "import/no-named-as-default-member": "off",
      "vitest/no-importing-vitest-globals": "off",
      "vitest/prefer-describe-function-title": "off",
      "jest/require-hook": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
    overrides: [
      {
        files: ["src/components/ui/**", "src/hooks/**", "src/lib/**"],
        rules: {
          curly: "off",
          eqeqeq: "off",
          "no-console": "off",
          "no-shadow": "off",
          "@typescript-eslint/no-unused-vars": "off",
          "@typescript-eslint/no-explicit-any": "off",
          "@typescript-eslint/consistent-type-imports": "off",
        },
      },
      {
        files: ["*.config.ts", "*.config.js"],
        rules: {
          "no-console": "off",
        },
      },
      {
        files: ["*.test.ts", "*.test.tsx", "*.spec.ts", "*.spec.tsx"],
        rules: {
          "no-console": "off",
          "@typescript-eslint/no-explicit-any": "off",
          "@typescript-eslint/no-non-null-assertion": "off",
        },
      },
    ],
    ignorePatterns: ["dist", "dist-electron", "node_modules"],
    options: {},
  },
  clearScreen: false,
  resolve: {
    alias: {
      "@": resolve(projectRoot, "src"),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        entry: "src/main/index.ts",
        onstart: async ({ startup }) => {
          installDevElectronShutdownHooks(startup);
          await startup();
        },
        vite: {
          clearScreen: false,
          build: {
            rollupOptions: {
              external: ["better-sqlite3"],
            },
          },
        },
      },
      preload: {
        input: "src/preload/index.ts",
        vite: {
          clearScreen: false,
          build: {
            rollupOptions: {
              output: {
                entryFileNames: "preload.js",
              },
            },
          },
        },
      },
    }),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  test: {
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "dist", "dist-electron"],
    passWithNoTests: true,
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
});
