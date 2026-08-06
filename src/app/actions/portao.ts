"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthState } from "@/app/actions/auth";
import {
  COOKIE_PORTAO,
  VENDAS_SENHA,
  assinaturaDoPortao,
  assinaturasIguais,
  vendasAbertas,
} from "@/lib/lancamento";

/** Confere a senha do pré-lançamento e libera a página de vendas. */
export async function abrirPortao(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  // Se a data de abertura já chegou enquanto a pessoa olhava a tela,
  // não faz sentido pedir senha nenhuma.
  if (vendasAbertas()) redirect("/");

  const digitada = String(formData.get("senha") ?? "").trim();
  if (!digitada) return { error: "Digite a senha de acesso." };

  const [tentativa, esperada] = await Promise.all([
    assinaturaDoPortao(digitada),
    assinaturaDoPortao(VENDAS_SENHA),
  ]);

  if (!assinaturasIguais(tentativa, esperada)) {
    return { error: "Senha incorreta. Confira a mensagem que você recebeu." };
  }

  const jar = await cookies();
  jar.set(COOKIE_PORTAO, esperada, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // 30 dias: cobre com folga o período fechado e o dia da abertura, para
    // ninguém ter que digitar a senha de novo no meio do lançamento.
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/");
}
