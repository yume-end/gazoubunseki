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
