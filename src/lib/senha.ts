/**
 * Política de senha do projeto, em um lugar só.
 *
 * Precisa ser no mínimo tão exigente quanto a política configurada no
 * Supabase (8 caracteres, pelo menos uma letra e um número). Se for mais
 * frouxa, o usuário digita uma senha que o formulário aceita e o servidor
 * recusa com uma mensagem genérica — foi assim que a tela de nova senha
 * chegou a prometer "mínimo de 6 caracteres" que nunca funcionaram.
 */

export const REGRA_SENHA = "Mínimo de 8 caracteres, com pelo menos uma letra e um número.";

/** Devolve a mensagem de erro, ou `null` quando a senha serve. */
export function validarSenha(senha: string): string | null {
  if (senha.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (!/[a-zA-Z]/.test(senha) || !/[0-9]/.test(senha)) {
    return "Use pelo menos uma letra e um número na senha.";
  }
  const fracas = ["12345678", "senha123", "password", "123456789", "qwerty123"];
  if (fracas.includes(senha.toLowerCase())) {
    return "Essa senha é fácil demais de adivinhar. Escolha outra.";
  }
  return null;
}
