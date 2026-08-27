const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;

export function validateUploadedImage(file: File) {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error("対応形式は JPG, JPEG, PNG, WebP です。");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("ファイルサイズは 10MB 以下にしてください。");
  }
}

export async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("画像の読み込みに失敗しました。"));
    reader.readAsDataURL(file);
  });
}

export async function loadImageFromDataUrl(dataUrl: string) {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像のデコードに失敗しました。"));
    img.src = dataUrl;
  });
}

export function isLikelyImageUrl(url: string) {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export async function fetchUrlAsDataUrl(url: string) {
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) throw new Error("この画像URLはブラウザから取得できません。画像ファイルを直接アップロードしてください。");
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) throw new Error("この画像URLはブラウザから取得できません。画像ファイルを直接アップロードしてください。");
  const blob = await response.blob();
  if (!ALLOWED_MIME.has(blob.type)) throw new Error("対応形式は JPG, JPEG, PNG, WebP です。");
  if (blob.size > MAX_BYTES) throw new Error("ファイルサイズは 10MB 以下にしてください。");
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("画像URLの読み込みに失敗しました。"));
    reader.readAsDataURL(blob);
  });
}
