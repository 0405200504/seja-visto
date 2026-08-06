import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  COOKIE_PORTAO,
  assinaturaDoPortao,
  assinaturasIguais,
  vendasAbertas,
} from "@/lib/lancamento";

const PUBLIC_PATHS = [
  "/login",
  "/cadastro",
  "/recuperar-senha",
  "/nova-senha",
  // Tela de senha do pré-lançamento e o robots.txt: os dois têm que
  // responder para quem não tem sessão nenhuma — inclusive para o robô do
  // Google, que senão levaria um redirecionamento para o login.
  "/portao",
  "/robots.txt",
  // Link de criar senha do e-mail: quem chega aqui, por definição, ainda
  // não tem sessão. Sem esta linha o middleware devolveria a pessoa para
  // o login e a tela de senha nunca apareceria.
  "/definir-senha",
  "/auth",
  "/api",
  // Documentos legais precisam ser lidos ANTES da compra, sem login.
  "/termos",
  "/privacidade",
  "/reembolso",
];

export async function updateSession(request: NextRequest) {
  // Sem as variáveis do Supabase, avisa claramente em vez de estourar um 500 opaco.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return new NextResponse(
      "Configuração ausente: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY nas variáveis de ambiente (Vercel → Settings → Environment Variables) e faça o redeploy.",
      { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } }
    );
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  // A raiz "/" é a página de vendas — pública para visitantes e alunos.
  const isPublic =
    pathname === "/" || PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Portão de pré-lançamento: até a data de abertura, a página de vendas só
  // aparece para quem digitou a senha. Aluno logado passa direto — se tem
  // sessão, já comprou. Depois da data, este bloco inteiro é ignorado.
  if (pathname === "/" && !user && !vendasAbertas()) {
    const cookie = request.cookies.get(COOKIE_PORTAO)?.value ?? "";
    const esperada = await assinaturaDoPortao();

    if (!assinaturasIguais(cookie, esperada)) {
      const url = request.nextUrl.clone();
      url.pathname = "/portao";
      url.search = "";
      const redirecionamento = NextResponse.redirect(url);
      // Mesmo no desvio, avisa o buscador para não guardar nada disto.
      redirecionamento.headers.set("x-robots-tag", "noindex, nofollow");
      return redirecionamento;
    }
  }

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/cadastro")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
