import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^\\.\\./",
              message: "Import with @/ instead of a parent folder (./sibling is fine).",
            },
            {
              group: ["lucide-react"],
              importNamePattern: "^(?!.*Icon$)",
              message: "Import lucide icons by their …Icon names.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    // The default ignores of eslint-config-next, which this list replaces.
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Claude Code settings and agent worktrees (other checkouts of the repository), like in
    // tsconfig.json, .prettierignore and .dockerignore.
    ".claude/**",
  ]),
]);

export default eslintConfig;
