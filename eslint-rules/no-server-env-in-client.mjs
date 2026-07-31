/**
 * Regra: em arquivo "use client", proíbe ler process.env de variável que não
 * tenha o prefixo NEXT_PUBLIC_.
 *
 * Por que existe: no Next.js, só as variáveis NEXT_PUBLIC_ são substituídas
 * em tempo de build para o navegador. Ler process.env.MEU_SEGREDO num
 * componente cliente não "vaza" o valor (vem undefined), mas é o começo do
 * erro clássico: alguém vê undefined, renomeia a variável para
 * NEXT_PUBLIC_MEU_SEGREDO "pra funcionar", e aí o segredo vai para o bundle
 * de verdade. Esta regra corta o caminho antes disso.
 *
 * Acesso dinâmico (process.env[nome]) também é bloqueado: não há como
 * verificar o prefixo estaticamente.
 */

const PREFIXO_PUBLICO = "NEXT_PUBLIC_";

/** O arquivo declara "use client" no topo? */
function ehComponenteCliente(programNode) {
  for (const node of programNode.body) {
    if (
      node.type === "ExpressionStatement" &&
      node.expression?.type === "Literal" &&
      typeof node.expression.value === "string"
    ) {
      if (node.expression.value === "use client") return true;
      // Outra diretiva ("use strict"): segue olhando.
      continue;
    }
    // Primeira instrução que não é diretiva: acabou o prólogo.
    return false;
  }
  return false;
}

/** É a expressão `process.env`? */
function ehProcessEnv(node) {
  return (
    node?.type === "MemberExpression" &&
    !node.computed &&
    node.object?.type === "Identifier" &&
    node.object.name === "process" &&
    node.property?.type === "Identifier" &&
    node.property.name === "env"
  );
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Proíbe process.env de variável não pública em componentes 'use client'.",
    },
    schema: [],
    messages: {
      naoPublica:
        "'{{nome}}' não tem o prefixo NEXT_PUBLIC_ e este arquivo é 'use client'. " +
        "No navegador o valor vem undefined; e transformar em NEXT_PUBLIC_ embutiria o segredo no bundle. " +
        "Leia esta variável no servidor (Server Component, Server Action ou route handler) e passe só o resultado como prop.",
      dinamico:
        "Acesso dinâmico a process.env em arquivo 'use client'. " +
        "Não é possível verificar o prefixo NEXT_PUBLIC_ estaticamente — use o nome literal da variável.",
    },
  },

  create(context) {
    let ehCliente = false;

    return {
      Program(node) {
        ehCliente = ehComponenteCliente(node);
      },

      MemberExpression(node) {
        if (!ehCliente) return;
        if (!ehProcessEnv(node.object)) return;

        // process.env[algumaCoisa]
        if (node.computed) {
          if (node.property.type === "Literal" && typeof node.property.value === "string") {
            if (!node.property.value.startsWith(PREFIXO_PUBLICO)) {
              context.report({
                node,
                messageId: "naoPublica",
                data: { nome: node.property.value },
              });
            }
            return;
          }
          context.report({ node, messageId: "dinamico" });
          return;
        }

        // process.env.NOME
        const nome = node.property.name;
        if (typeof nome === "string" && !nome.startsWith(PREFIXO_PUBLICO)) {
          context.report({ node, messageId: "naoPublica", data: { nome } });
        }
      },
    };
  },
};
