import { LOCAL_OBJECT_DETECTION_MODEL, type DetectedObjectResult } from "@/lib/ai-types";

export type ModelEvaluationClass = {
  concept: string;
  modelClass: string | null;
  supported: boolean;
  note: string;
};

export type ModelEvaluationSummary = {
  model: string;
  evaluatedAt: string;
  imagesTested: number;
  classes: ModelEvaluationClass[];
  notes: string[];
};

const COCO_MAPPING: ModelEvaluationClass[] = [
  { concept: "person", modelClass: "person", supported: true, note: "人体構造・手指の確認に有用" },
  { concept: "tv", modelClass: "tv", supported: true, note: "画面枠・反射の確認に有用" },
  { concept: "laptop", modelClass: "laptop", supported: true, note: "画面や筐体の検証に有用" },
  { concept: "chair", modelClass: "chair", supported: true, note: "家具の脚や影の確認に有用" },
  { concept: "couch", modelClass: "couch", supported: true, note: "ソファの形状確認に有用" },
  { concept: "bed", modelClass: "bed", supported: true, note: "寝具の形状確認に有用" },
  { concept: "dining table", modelClass: "dining table", supported: true, note: "机のパース確認に有用" },
  { concept: "cell phone", modelClass: "cell phone", supported: true, note: "端末の輪郭確認に有用" },
  { concept: "book", modelClass: "book", supported: true, note: "矩形・文字の確認に有用" },
  { concept: "bottle", modelClass: "bottle", supported: true, note: "反射・透明物体の確認に有用" },
  { concept: "cup", modelClass: "cup", supported: true, note: "反射や影の確認に有用" },
  { concept: "plant", modelClass: "potted plant", supported: true, note: "自然物の繰り返し確認に有用" },
  { concept: "clock", modelClass: "clock", supported: true, note: "文字盤や針の整合性確認に有用" },
  { concept: "air conditioner", modelClass: null, supported: false, note: "YOLOS-tiny / COCO では直接検出できません" },
  { concept: "mirror", modelClass: null, supported: false, note: "COCO に mirror 専用クラスはありません" }
];

export function buildYolosEvaluationSummary(imagesTested = 0): ModelEvaluationSummary {
  return {
    model: LOCAL_OBJECT_DETECTION_MODEL,
    evaluatedAt: new Date().toISOString(),
    imagesTested,
    classes: COCO_MAPPING,
    notes: [
      "これは YOLOS-tiny の物体検出能力に関する実用評価の土台です。",
      "air conditioner は YOLOS-tiny で直接検出できません。",
      "mirror は専用クラスがないため、反射物としての間接評価になります。"
    ]
  };
}

export function summarizeDetections(detections: DetectedObjectResult[]) {
  return detections.map((detection) => ({
    className: detection.className,
    confidence: detection.confidence,
    boundingBox: detection.boundingBox
  }));
}
