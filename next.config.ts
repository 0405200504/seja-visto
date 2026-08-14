import type { NextConfig } from "next";

/** Host do Supabase, extraído da URL do projeto. */
const supabaseHostname = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;
  } catch {
    // Sem a variável (ex.: lint em CI), aceita qualquer subdomínio do Supabase.
    return "*.supabase.co";
  }
})();

/**
 * Cabeçalhos de segurança aplicados a todas as respostas.
 * A CSP ficou de fora de propósito: feita às pressas ela quebra o Next.js em
 * produção. Configure depois, testando em staging.
 */
const SECURITY_HEADERS = [
  // Força HTTPS por 2 anos, inclusive nos subdomínios.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Impede que o site seja embutido em iframe (clickjacking no /admin).
  { key: "X-Frame-Options", value: "DENY" },
  // Impede o navegador de "adivinhar" o tipo do arquivo.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Não vaza a URL completa para domínios externos.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Câmera liberada: o envio de fit usa a câmera no celular.
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  // Permite abrir o dev server pelo IP da rede local (testar no celular de
  // verdade). Só afeta desenvolvimento — em produção o Next ignora.
  allowedDevOrigins: ["192.168.1.126"],
  images: {
    // Gera AVIF/WebP e vários tamanhos automaticamente na Vercel.
    formats: ["image/avif", "image/webp"],
    // 70 = fotos da página de vendas; 80 = seção/esteira do Raphael; 75 = padrão do app.
    qualities: [70, 75, 80],
    minimumCacheTTL: 60 * 60 * 24 * 365,
    // Só o Storage do Supabase. Com hostname "**", o /_next/image virava um
    // proxy aberto: qualquer um podia reprocessar imagem de qualquer domínio
    // gastando a cota e a banda da Vercel.
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/**",
      },
    ],
  },
  async redirects() {
    return [
      // Rotas antigas do admin → nova arquitetura (301 para não quebrar favoritos)
      { source: "/admin/looks", destination: "/admin/conteudo/looks", permanent: true },
      { source: "/admin/looks/novo", destination: "/admin/conteudo/looks/novo", permanent: true },
      { source: "/admin/looks/:id", destination: "/admin/conteudo/looks/:id", permanent: true },
      { source: "/admin/pecas", destination: "/admin/conteudo/pecas", permanent: true },
      { source: "/admin/pecas/novo", destination: "/admin/conteudo/pecas/novo", permanent: true },
      { source: "/admin/pecas/:id", destination: "/admin/conteudo/pecas/:id", permanent: true },
      { source: "/admin/modulos", destination: "/admin/conteudo/metodo", permanent: true },
      { source: "/admin/modulos/:id", destination: "/admin/conteudo/metodo/:id", permanent: true },
      { source: "/admin/vendas", destination: "/admin/receita/transacoes", permanent: true },
      { source: "/admin/fits", destination: "/admin/comunidade", permanent: true },
      { source: "/admin/links", destination: "/admin/crescimento/links", permanent: true },
      // Bug antigo: "Refs" apontando para /refs (404) — manda para a página certa
      { source: "/refs", destination: "/combinacoes", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        // Área do aluno e admin nunca devem ficar em cache compartilhado.
        source: "/:prefix(admin|perfil|fit-check|acesso-expirado)/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
        ],
      },
      {
        // Fotos versionadas do produto: cache imutável de 1 ano no CDN/navegador.
        source: "/:prefix(estilos|mais-procurados)/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
