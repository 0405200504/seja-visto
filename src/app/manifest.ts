import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Manual Prático do Outfit (MPO)",
    short_name: "MPO",
    description:
      "A plataforma de estilo masculino de Raphael Pereira: fundamentos, combinações prontas e plano de ação.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#06080c",
    theme_color: "#06080c",
    // Ícones opacos e quadrados de propósito: cada sistema aplica o próprio
    // arredondamento. PNG com canto arredondado + transparência faz o iOS
    // preencher as pontas de branco e sobra uma moldura no ícone.
    icons: [
      {
        src: "/app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // O Android recorta o maskable no formato do launcher — este tem
        // margem extra para as letras não serem cortadas.
        src: "/app-icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
