import { contextBridge, ipcRenderer } from "electron";

import { EventNameEnum } from "../const";

contextBridge.exposeInMainWorld("ContentAPI", {
  getImgList: (animFolder: string) =>
    ipcRenderer.invoke(EventNameEnum.GetPathList, animFolder),
  setIgnoreMouseEvent: (ignore: boolean) => {
    ipcRenderer.send(EventNameEnum.IgnoreMouseEvent, ignore, {
      forward: ignore,
    });
  },
});
