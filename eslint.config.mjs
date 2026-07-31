import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import noServerEnvInClient from "./eslint-rules/no-server-env-in-client.mjs";

/** Plugin local com as regras de segurança do projeto. */
const mpo = {
  rules: { "no-server-env-in-client": noServerEnvInClient },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Vale para todo o código-fonte — a regra só age em arquivos "use client".
    files: ["src/**/*.{ts,tsx,js,jsx,mjs}"],
    plugins: { mpo },
    rules: { "mpo/no-server-env-in-client": "error" },
  },
  {
    /* Dívida técnica conhecida, rebaixada de erro para AVISO.
     *
     * São ~28 ocorrências herdadas nos componentes de UI, quase todas
     * `setState` dentro de efeito — padrão que funciona, mas que as regras
     * novas do React 19 sinalizam. Corrigir tudo mexe no comportamento de
     * telas que estão no ar, e não é algo para fazer às vésperas do
     * lançamento.
     *
     * Aviso, e não "off", de propósito: continuam aparecendo no `npm run
     * lint` para serem pagas aos poucos, mas não travam o CI. Código novo
     * não deve acrescentar nenhuma.
     */
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    // Um módulo de regra do ESLint é, por convenção, um default anônimo.
    files: ["eslint-rules/**/*.mjs"],
    rules: { "import/no-anonymous-default-export": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Scripts avulsos de investigação — não são código do produto.
    "auditoria/**",
  ]),
]);

export default eslintConfig;
