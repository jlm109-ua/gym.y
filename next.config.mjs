/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración mínima para evitar el error spawn EINVAL
  experimental: {
    workerThreads: false,
  },
  // Sin polling para evitar recompilaciones continuas
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
