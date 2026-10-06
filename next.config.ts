import type { NextConfig } from "next";

// GitHub Pages では https://<user>.github.io/todo-app/ のようにサブパスで配信されるため、
// ビルド時に PAGES_BASE_PATH=/todo-app を渡すとそのパスで動くように書き出します。
// ローカル開発（npm run dev）では空のままでかまいません。
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export", // `next build` で out/ に静的ファイルを書き出す
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
