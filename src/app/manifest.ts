import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Plano Pronto de Estilo",
    short_name: "Plano de Estilo",
    description:
      "A plataforma de estilo masculino de Raphael Pereira: fundamentos, combinações prontas e plano de ação.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#06080c",
    theme_color: "#06080c",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
