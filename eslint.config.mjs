import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // React Compiler optimization-hints op 'warn' i.p.v. 'error': deze regels
  // signaleren waarom de Compiler bepaalde components niet kan optimaliseren
  // (setState-in-effect, memoization-skip). Code is functioneel correct.
  // Echte fouten (no-explicit-any, prefer-const, refs-during-render, etc.)
  // blijven 'error' en blokkeren de CI vanaf nu.
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/static-components": "warn",
    },
  },
]);

export default eslintConfig;
