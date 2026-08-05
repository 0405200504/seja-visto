import { redirect } from "next/navigation";

/**
 * /definir-senha sem token nenhum. Acontece quando o cliente de e-mail
 * corta o link no meio da linha — em vez de um 404 seco, manda a pessoa
 * para o lugar onde ela consegue um link inteiro.
 */
export default function DefinirSenhaSemToken() {
  redirect("/recuperar-senha");
}
