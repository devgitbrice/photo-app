import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
      allowedOrigins: [
        "localhost:3000",
        // 👇 J'ai copié l'URL depuis ton message d'erreur
        "organic-broccoli-97r5jr9prxg7fpv66-3000.app.github.dev",
      ],
    },
  },
};

export default nextConfig;