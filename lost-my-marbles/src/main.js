import { Application } from "pixi.js";
import { mountApp } from "./App.tsx";
import { createVideoScreen } from "./component/introVideo.js";
import { createMarbleGameScreen } from "./game/marbleGameScreen.js";
import { initDevtools } from "@pixi/devtools";
import { SOUNDS } from "./lib/constants";

const app = new Application();
initDevtools(app);

let currentScreen = null;
let triggerGamePhase = null;

// ── Background music (same pattern as royal-flush) ────────────────────────────
const bgMusic = new Audio(SOUNDS.BACKGROUND_MUSIC);
bgMusic.loop = true;
bgMusic.volume = 0.1;

export function toggleMusic() {
  if (bgMusic.paused) {
    bgMusic.play();
  } else {
    bgMusic.pause();
  }
}

(async () => {
  await app.init({
    background: "#000",
    resizeTo: document.getElementById("app"),
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    antialias: true,
  });
  document.getElementById("pixi-canvas").appendChild(app.canvas);
  window.__pixiApp = app;
  window.__toggleMusic = toggleMusic;

  mountApp(
    () => showVideo(),
    (fn) => { triggerGamePhase = fn; },
  );
})();

function clearScreen() {
  if (currentScreen) {
    app.stage.removeChild(currentScreen);
    currentScreen.destroy({ children: true });
    currentScreen = null;
  }
}

async function showVideo() {
  // Start bg music when video begins (browser requires user interaction first)
  bgMusic.play().catch(() => {});

  const { container, ready } = createVideoScreen(app, () => showGame());

  currentScreen = container;
  app.stage.addChild(currentScreen);

  await ready;
}

async function showGame() {
  clearScreen();

  const screen = await createMarbleGameScreen(app);
  currentScreen = screen;
  app.stage.addChild(currentScreen);

  triggerGamePhase?.();
}
