export type ActiveStudioTool =
  | 'select'
  | 'hand'
  // Edit Tools
  | 'text'
  | 'text-replace'
  | 'image'
  // Annotate Tools
  | 'highlight'
  | 'draw'
  | 'underline'
  | 'strikeout'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'comment'
  | 'stamp'
  // Forms & Sign
  | 'signature'
  | 'checkbox'
  // Security
  | 'watermark'
  | 'redaction'
  // Organize
  | 'merge'
  | 'split'
  | 'rotate-page';

export type SidebarTab =
  | 'pages'
  | 'edit'
  | 'annotate'
  | 'organize'
  | 'forms'
  | 'security'
  | 'convert';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export interface TextAnnotation {
  id: string;
  type: 'text';
  pageIndex: number;
  x: number; // in PDF points (72 DPI)
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontFamily: 'Helvetica' | 'Times' | 'Courier';
  color: string;
  isBold: boolean;
  isItalic: boolean;
  align: 'left' | 'center' | 'right';
  opacity: number;
  backgroundColor?: string;
}

export interface TextReplaceAnnotation {
  id: string;
  type: 'text-replace';
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  originalText?: string;
  replacementText: string;
  fontSize: number;
  fontFamily: 'Helvetica' | 'Times' | 'Courier';
  color: string;
  maskColor: string; // usually #FFFFFF or #000000
}

export interface DrawAnnotation {
  id: string;
  type: 'draw';
  pageIndex: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  opacity: number;
}

export interface HighlightAnnotation {
  id: string;
  type: 'highlight';
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string; // e.g. #fef08a, #d8b4fe, #a5f3fc, #fbcfe8
  opacity: number;
}

export interface ShapeAnnotation {
  id: string;
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'line' | 'arrow';
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  strokeWidth: number;
  fillColor?: string;
  opacity: number;
}

export interface CommentAnnotation {
  id: string;
  type: 'comment';
  pageIndex: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  author: string;
  text: string;
  createdAt: string;
  color: string;
}

export interface StampAnnotation {
  id: string;
  type: 'stamp';
  pageIndex: number;
  stampType: 'APPROVED' | 'VERIFIED' | 'CONFIDENTIAL' | 'DRAFT' | 'STUDENT_ID';
  x: number;
  y: number;
  width?: number;
  height?: number;
  scale: number;
  customText?: string;
}

export interface SignatureAnnotation {
  id: string;
  type: 'signature';
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
  opacity: number;
}

export interface ImageAnnotation {
  id: string;
  type: 'image';
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
  opacity: number;
}

export interface RedactionAnnotation {
  id: string;
  type: 'redaction';
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string; // #000000 or #ffffff
}

export type AnyAnnotation =
  | TextAnnotation
  | TextReplaceAnnotation
  | DrawAnnotation
  | HighlightAnnotation
  | ShapeAnnotation
  | CommentAnnotation
  | StampAnnotation
  | SignatureAnnotation
  | ImageAnnotation
  | RedactionAnnotation;

export interface PageMeta {
  pageIndex: number;
  pageNumber: number;
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
}

export interface SearchMatch {
  pageIndex: number;
  matchIndex: number;
  text: string;
}

export interface WatermarkSettings {
  enabled: boolean;
  text: string;
  opacity: number;
  color: 'emerald' | 'amber' | 'slate';
  rotation: number;
  includeStudentHeader: boolean;
}
