import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "画像フォレンジックAI",
  description: "画像を解析し、要素抽出・Web照合・AI比較を行うMVP"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
