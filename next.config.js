/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true,
    },
    reactStrictMode: true,
    swcMinify: true,
    /*
    exportPathMap: async function (defaultPathMap, { dev, dir, outDir, distDir, buildId }) {
        return {
            "/": { page: "/" },
            "/user": { page: "/user" },
            // "/p/hello-nextjs": { page: "/post", query: { title: "hello-nextjs" } },
            // "/p/learn-nextjs": { page: "/post", query: { title: "learn-nextjs" } },
            // "/p/deploy-nextjs": { page: "/post", query: { title: "deploy-nextjs" } },
        }
    },
    */
}

module.exports = nextConfig
