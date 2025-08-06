/// <reference types="vite/client" />

interface ContentAPI {
  getImgList: (folderName: string) => Promise<string[]>;
  setIgnoreMouseEvent: (ignore: boolean) => void;
}

declare global {
  interface Window {
    ContentAPI: ContentAPI; // 声明全局变量
    api: unknown;
  }
}
export {};
