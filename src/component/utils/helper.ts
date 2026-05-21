import type { Application, Sprite } from "pixi.js";

export function resizeBackground(app: Application, bg: Sprite | undefined) {
  if (!bg) return;
  if (!bg.texture || !bg.texture?.source) return;
  const cw = app.screen.width;
  const ch = app.screen.height;
  const imgRatio = bg?.texture?.width / bg?.texture?.height;
  const screenRatio = cw / ch;

  let renderW, renderH, renderX, renderY;

  if (screenRatio > imgRatio) {
    renderW = cw;
    renderH = cw / imgRatio;
    renderX = 0;
    renderY = (ch - renderH) / 2;
  } else {
    renderH = ch;
    renderW = ch * imgRatio;
    renderY = 0;
    renderX = (cw - renderW) / 2;
  }
  bg.width = renderW;
  bg.height = renderH;
  bg.x = renderX;
  bg.y = renderY;
}
