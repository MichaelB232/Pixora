export type StudioModuleId =
  | "home"
  | "editor"
  | "restoration"
  | "creative"
  | "vision"
  | "scanner"
  | "analysis"
  | "history"
  | "export"
  | "pipeline";

export interface ImageMetadata {
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  format: string;
  megapixels: string;
  fileSizeBytes?: number;
}

export interface ImageStatistics {
  mean: { r: number; g: number; b: number; l: number };
  stdDev: { r: number; g: number; b: number; l: number };
  min: { r: number; g: number; b: number; l: number };
  max: { r: number; g: number; b: number; l: number };
  median: { r: number; g: number; b: number; l: number };
}

export interface HistogramData {
  r: number[];
  g: number[];
  b: number[];
  luminance: number[];
  maxCount: number;
}

export interface HistoryStepItem {
  id: string;
  stepIndex: number;
  label: string;
  module: StudioModuleId;
  algorithm: string;
  parameters: Record<string, any>;
  timestamp: string;
  thumbnailUrl?: string;
  imageData?: ImageData;
}

export interface PipelineStage {
  id: string;
  module: StudioModuleId;
  algorithm: string;
  label: string;
  parameters: Record<string, any>;
  enabled: boolean;
}
