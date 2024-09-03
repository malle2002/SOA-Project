/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeFonts: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "**",
      },
    ],
  },
};

export default nextConfig;
