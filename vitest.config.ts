import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      /* `server-only` lança exceção fora de um Server Component, e o vitest
       * não é um. A trava continua valendo no build de verdade — aqui ela é
       * trocada por um módulo vazio só para os testes conseguirem importar
       * os arquivos de servidor. */
      "server-only": resolve(__dirname, "src/test/server-only-stub.ts"),
    },
  },
});
