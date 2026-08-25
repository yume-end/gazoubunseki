import { NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set(["localhost", "127.0.0.1", "images.unsplash.com"]);

function isPrivateHostname(hostname: string) {
  return hostname.endsWith(".local") || hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("10.") || hostname.startsWith("192.168.") || hostname.startsWith("172.16.") || hostname.startsWith("172.17.") || hostname.startsWith("172.18.") || hostname.startsWith("172.19.") || hostname.startsWith("172.2");
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("URLは http / https のみ対応しています。");
    if (isPrivateHostname(parsed.hostname) && !ALLOWED_HOSTS.has(parsed.hostname)) throw new Error("ローカルネットワーク宛のURLは取得できません。");
    const res = await fetch(parsed.toString(), { redirect: "follow" });
    if (!res.ok) throw new Error("画像の取得に失敗しました。");
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) throw new Error("URL先が画像ではありません。");
    const buf = await res.arrayBuffer();
    if (buf.byteLength > 10 * 1024 * 1024) throw new Error("画像サイズが大きすぎます。");
    const dataUrl = `data:${contentType};base64,${Buffer.from(buf).toString("base64")}`;
    return NextResponse.json({ dataUrl, mimeType: contentType, name: parsed.pathname.split("/").pop() || "image" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "画像URLの取得に失敗しました。" }, { status: 400 });
  }
}
