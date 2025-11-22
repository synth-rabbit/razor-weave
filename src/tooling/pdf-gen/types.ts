export type PageType = 'cover' | 'toc' | 'part' | 'chapter-opener' | 'content' | 'sheet';

export interface PageState {
  currentPage: number;
  currentChapter: string;
  yPosition: number;
  pageType: PageType;
  columnWidth: number;
}

export interface PDFConfig {
  pageWidth: number;      // 612 points (8.5")
  pageHeight: number;     // 792 points (11")
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  liveArea: {
    width: number;
    height: number;
  };
}

export interface ChapterContent {
  number: number;
  title: string;
  slug: string;
  sections: SectionContent[];
}

export interface SectionContent {
  level: 2 | 3 | 4;
  title: string;
  id: string;
  content: ContentBlock[];
}

export interface ContentBlock {
  type: 'paragraph' | 'example' | 'gm' | 'table' | 'list' | 'hr';
  content: string | TableData | ListData;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface ListData {
  ordered: boolean;
  items: string[];
}

export interface TOCEntry {
  level: number;
  title: string;
  pageNumber: number;
}
