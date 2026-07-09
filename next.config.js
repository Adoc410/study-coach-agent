/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@langchain/langgraph"],
  },
};

module.exports = nextConfig;
