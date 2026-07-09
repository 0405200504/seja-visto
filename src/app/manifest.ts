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
    icons: [
      {
        src: "/logo-mpo-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo-mpo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
