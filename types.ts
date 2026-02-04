
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface QADifference {
  id: string;
  category: 'Data' | 'Layout' | 'Typography';
  description: string;
  coords: BoundingBox;
}

export interface QAResult {
  accuracyScore: number;
  summary: string;
  differences: QADifference[];
}

export interface ClipRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type FileType = 'master' | 'production';
