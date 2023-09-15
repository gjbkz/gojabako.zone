export interface Commit {
  commit: string;
  abbr: string;
  aDate: string;
}

export interface Page {
  url: string;
  filePath: string;
  title: string;
  publishedAt: string;
  updatedAt: string;
  commits: number;
}