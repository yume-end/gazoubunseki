import { env, pipeline } from "@huggingface/transformers";
import { LOCAL_OBJECT_DETECTION_MODEL, type InferenceBackend, type ObjectDetector, type RawDetection, type DetectorLoadState, type DetectedObjectResult } from "@/lib/ai-types";

let detectorPromise: Promise<ObjectDetector> | null = null;

function detectBackendPreference(): Exclude<InferenceBackend, "unavailable"> | "unavailable" {
  if (typeof navigator === "undefined") return "unavailable";
  const webgpuAvailable = Boolean((navigator as Navigator & { gpu?: unknown }).gpu);
  if (webgpuAvailable) return "webgpu";
  if (typeof WebAssembly !== "undefined") return "wasm";
  return "unavailable";
}

function normalizeDetections(items: RawDetection[], imageWidth: number, imageHeight: number): DetectedObjectResult[] {
  return items
    .map((item, index) => {
      const xmin = Math.max(0, Math.min(imageWidth, item.box.xmin));
      const ymin = Math.max(0, Math.min(imageHeight, item.box.ymin));
      const xmax = Math.max(xmin, Math.min(imageWidth, item.box.xmax));
      const ymax = Math.max(ymin, Math.min(imageHeight, item.box.ymax));
      return {
        id: `obj-${String(index + 1).padStart(3, "0")}`,
        className: item.label,
        confidence: item.score,
        boundingBox: {
          x: imageWidth > 0 ? xmin / imageWidth : 0,
          y: imageHeight > 0 ? ymin / imageHeight : 0,
          width: imageWidth > 0 ? (xmax - xmin) / imageWidth : 0,
          height: imageHeight > 0 ? (ymax - ymin) / imageHeight : 0
        },
        sourceLabel: item.label
      };
    })
    .filter((item) => item.boundingBox.width > 0.01 && item.boundingBox.height > 0.01);
}

class TransformersObjectDetector implements ObjectDetector {
  private state: DetectorLoadState = "idle";
  private backend: InferenceBackend = "unavailable";
  private error: string | null = null;
  private detector: Awaited<ReturnType<typeof pipeline>> | null = null;
  private modelLoadTimeMs: number | null = null;
  private firstInferenceTimeMs: number | null = null;
  private subsequentInferenceTimeMs: number | null = null;
  private didFirstInference = false;

  private async loadWithBackend(backend: Exclude<InferenceBackend, "unavailable">) {
    const startedAt = performance.now();
    env.allowRemoteModels = true;
    env.useBrowserCache = true;
    this.detector = await pipeline("object-detection", LOCAL_OBJECT_DETECTION_MODEL, { device: backend === "webgpu" ? "webgpu" : "wasm" });
    this.modelLoadTimeMs = performance.now() - startedAt;
    this.backend = backend;
    this.state = "ready";
  }

  async load(backendPreference?: Exclude<InferenceBackend, "unavailable">) {
    if (this.detector || this.state === "loading") return;
    this.state = "loading";
    this.error = null;
    const preferred = backendPreference ?? detectBackendPreference();
    if (preferred === "unavailable") {
      this.state = "error";
      this.error = "このブラウザではAI推論を実行できません。";
      throw new Error(this.error);
    }
    try {
      await this.loadWithBackend(preferred);
    } catch (err) {
      if (preferred === "webgpu") {
        const fallbackAttempt = await this.tryFallbackToWasm(err);
        if (fallbackAttempt) return;
      }
      this.state = "error";
      this.error = err instanceof Error ? err.message : "モデルの読み込みに失敗しました。";
      this.detector = null;
      this.backend = preferred;
      throw new Error(this.error);
    }
  }

  private async tryFallbackToWasm(originalError: unknown) {
    try {
      this.backend = "webgpu";
      this.detector = null;
      await this.loadWithBackend("wasm");
      this.error = null;
      return true;
    } catch (fallbackError) {
      this.state = "error";
      this.error = fallbackError instanceof Error ? fallbackError.message : String(originalError ?? "WASM fallback failed");
      this.detector = null;
      this.backend = "unavailable";
      throw new Error(this.error);
    }
  }

  async detect(image: HTMLImageElement | ImageBitmap | ImageData) {
    if (!this.detector) {
      await this.load();
    }
    if (!this.detector) throw new Error(this.error ?? "モデルが読み込まれていません。");

    const startedAt = performance.now();
    try {
      const result = await this.detector(image, { threshold: 0.2 });
      const detections = Array.isArray(result) ? result : [];
      const width = "width" in image ? image.width : 1;
      const height = "height" in image ? image.height : 1;
      const normalized = normalizeDetections(detections as RawDetection[], width, height);
      const duration = performance.now() - startedAt;
      if (!this.didFirstInference) {
        this.firstInferenceTimeMs = duration;
        this.didFirstInference = true;
      } else {
        this.subsequentInferenceTimeMs = this.subsequentInferenceTimeMs == null ? duration : (this.subsequentInferenceTimeMs + duration) / 2;
      }
      return normalized;
    } catch (err) {
      if (this.backend === "webgpu") {
        await this.discardAndFallbackToWasm();
        if (!this.detector) throw err instanceof Error ? err : new Error("WebGPU inference failed.");
        const retryStartedAt = performance.now();
        const result = await this.detector(image, { threshold: 0.2 });
        const detections = Array.isArray(result) ? result : [];
        const width = "width" in image ? image.width : 1;
        const height = "height" in image ? image.height : 1;
        const normalized = normalizeDetections(detections as RawDetection[], width, height);
        const duration = performance.now() - retryStartedAt;
        if (!this.didFirstInference) {
          this.firstInferenceTimeMs = duration;
          this.didFirstInference = true;
        } else {
          this.subsequentInferenceTimeMs = this.subsequentInferenceTimeMs == null ? duration : (this.subsequentInferenceTimeMs + duration) / 2;
        }
        return normalized;
      }
      throw err;
    }
  }

  private async discardAndFallbackToWasm() {
    this.state = "loading";
    this.error = null;
    this.detector = null;
    try {
      await this.loadWithBackend("wasm");
    } catch (err) {
      this.state = "error";
      this.error = err instanceof Error ? err.message : "WASM fallback failed.";
      this.backend = "unavailable";
      throw err;
    }
  }

  async dispose() {
    this.detector = null;
    this.state = "idle";
  }

  getBackend() {
    return this.backend;
  }

  getState() {
    return this.state;
  }

  getError() {
    return this.error;
  }

  getStats() {
    return {
      modelLoadTimeMs: this.modelLoadTimeMs,
      firstInferenceTimeMs: this.firstInferenceTimeMs,
      subsequentInferenceTimeMs: this.subsequentInferenceTimeMs
    };
  }
}

export async function getObjectDetector() {
  if (!detectorPromise) {
    detectorPromise = Promise.resolve(new TransformersObjectDetector());
  }
  return detectorPromise;
}

export function getBackendAvailability() {
  return {
    webgpu: typeof navigator !== "undefined" && Boolean((navigator as Navigator & { gpu?: unknown }).gpu),
    wasm: typeof WebAssembly !== "undefined"
  };
}
