import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Gera AVIF/WebP e vários tamanhos automaticamente na Vercel.
    formats: ["image/avif", "image/webp"],
    // 70 = fotos da página de vendas; 80 = seção/esteira do Raphael; 75 = padrão do app.
    qualities: [70, 75, 80],
    minimumCacheTTL: 60 * 60 * 24 * 365,
    remotePatterns: [{ protocol: "https", hostname: "**" }],
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
