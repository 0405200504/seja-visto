import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Gera AVIF/WebP e vários tamanhos automaticamente na Vercel.
    formats: ["image/avif", "image/webp"],
    // 55 = fotos da página de vendas (cards pequenos); 75 = padrão do app.
    qualities: [55, 75],
    minimumCacheTTL: 60 * 60 * 24 * 365,
    remotePatterns: [{ protocol: "https", hostname: "**" }],
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
