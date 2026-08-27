export const LOCAL_OBJECT_DETECTION_MODEL = "Xenova/yolos-tiny";

export type InferenceBackend = "webgpu" | "wasm" | "unavailable";

export type DetectorLoadState = "idle" | "loading" | "ready" | "error";

export type RawDetection = {
  score: number;
  label: string;
  box: { xmin: number; ymin: number; xmax: number; ymax: number };
};

export type ObjectDetector = {
  load(): Promise<void>;
  detect(image: HTMLImageElement | ImageBitmap | ImageData): Promise<RawDetection[]>;
  dispose(): Promise<void>;
  getBackend(): InferenceBackend;
  getState(): DetectorLoadState;
  getError(): string | null;
};
