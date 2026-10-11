export type MediaItem = {
  id: string;
  type: "image" | "video";
  url: string;
  path: string;
  caption: string;
  width: number;
  height: number;
  featured: boolean;
  createdAt: number;
};

export type Post = {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  coverUrl: string | null;
  coverPath: string | null;
  published: boolean;
  createdAt: number;
  updatedAt: number;
};
