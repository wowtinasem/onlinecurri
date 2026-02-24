
export interface MinorCategory {
  id: string;
  title: string;
}

export interface MiddleCategory {
  id: string;
  title: string;
  minors: MinorCategory[];
}

export interface MajorCategory {
  id: string;
  title: string;
  middles: MiddleCategory[];
}

export interface Course {
  id: string;
  title: string;
  platform: string;
  instructor: string;
  curriculum: MajorCategory[];
  description?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export enum AddMethod {
  MANUAL = 'MANUAL',
  SMART_SCAN = 'SMART_SCAN'
}
