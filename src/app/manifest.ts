import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const baseUrl =
    process.env.AUTH_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  return {
    background_color: "#f7f8f6",
    description:
      "A private Google Drive file manager that stores files in your own Drive.",
    display: "standalone",
    icons: [
      {
        purpose: "any",
        sizes: "64x64",
        src: "/filer-icon.svg",
        type: "image/svg+xml",
      },
    ],
    id: baseUrl,
    name: "Filer",
    short_name: "Filer",
    start_url: "/dashboard",
    theme_color: "#256f73",
  };
}
