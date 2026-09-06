/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.ufs.sh",
        pathname: "/f/**",
      },
      {
        protocol: "https",
        hostname: "*.utfs.io",
        pathname: "/f/**",
      },
    ],
  },
};

export default nextConfig;
