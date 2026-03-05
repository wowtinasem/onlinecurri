
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
  materialUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  approved: boolean;
  createdAt: number;
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
