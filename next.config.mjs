import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
    outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
    reactStrictMode: true,
    poweredByHeader: false,
    compress: true,
    experimental: {
        optimizeCss: false,
    },
};
export default nextConfig;
