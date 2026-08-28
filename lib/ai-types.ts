export const LOCAL_OBJECT_DETECTION_MODEL = "Xenova/yolos-tiny";
export const LOCAL_OBJECT_DETECTION_VERSION = "transformers.js/object-detection/v1";

export type InferenceBackend = "webgpu" | "wasm" | "unavailable";

export type DetectorLoadState = "idle" | "loading" | "ready" | "error";

export type RawDetection = {
  score: number;
  label: string;
  box: { xmin: number; ymin: number; xmax: number; ymax: number };
};

export type ObjectDetector = {
  load(backendPreference?: Exclude<InferenceBackend, "unavailable">): Promise<void>;
  detect(image: HTMLImageElement | ImageBitmap | ImageData): Promise<DetectedObjectResult[]>;
  dispose(): Promise<void>;
  getBackend(): InferenceBackend;
  getState(): DetectorLoadState;
  getError(): string | null;
  getStats(): {
    modelLoadTimeMs: number | null;
    firstInferenceTimeMs: number | null;
    subsequentInferenceTimeMs: number | null;
  };
};

export type DetectedObjectResult = {
  id: string;
  className: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  sourceLabel: string;
};
