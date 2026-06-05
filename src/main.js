import { Application, Container } from "pixi.js";
import { createVideoScreen } from "./component/screens/introVideo.js";
import { createFlushScreen } from "./component/screens/flushGame.js";
import { mountApp } from "./App.tsx";
import { useFlushStore } from "./store/useRoyalFlushStore.ts";
import { SOUNDS } from "./lib/constants";

import { initDevtools } from "@pixi/devtools";

const app = new Application();
initDevtools(app);
let currentScreen;

const bgMusic = new Audio(SOUNDS.BACKGROUND_SOUNDS);
bgMusic.loop = true;
bgMusic.volume = 0.1;

function toggleMusic() {
  if (bgMusic.paused) {
    bgMusic.play();
  } else {
    bgMusic.pause();
  }
}

(async () => {
  // resizeTo: #app (not window) so PixiJS measures the logical dimensions
  // set by the inline scale script in index.html — CSS transform handles the visual scale-down.
  await app.init({
    background: "#000",
    resizeTo: document.getElementById("app"),
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    antialias: true,
  });
  document.getElementById("pixi-canvas").appendChild(app.canvas);

  mountApp(() => showVideo());
})();

function clearScreen() {
  if (currentScreen) {
    app.stage.removeChild(currentScreen);
    currentScreen.destroy({ children: true });
  }
}

async function showVideo() {
  bgMusic.play().catch(() => {});

  // createVideoScreen now returns the container SYNCHRONOUSLY via a ref,
  // then populates it async. We add it to stage before awaiting.
  const { container, ready } = createVideoScreen(app, () => flushGame());

  currentScreen = container;
  app.stage.addChild(currentScreen); // instant — shows black bg

  await ready; // wait for video to be ready to play
  useFlushStore.getState().setGamePhase("video");
}

async function flushGame() {
  clearScreen();

  // Show game bg immediately so there's no black flash while assets load
  useFlushStore.getState().setGamePhase("loading");

  const result = await createFlushScreen(app);

  if (!result) {
    console.error("createFlushScreen returned nothing");
    return;
  }

  const { container, triggerFlush, triggerAutoplay } = result;

  // Register Pixi callbacks in the store — GameWrapper picks them up reactively
  useFlushStore.getState().setPixiActions({
    triggerFlush: () => triggerFlush(),
    triggerAutoplay: () => triggerAutoplay(),
    toggleMusic,
  });

  // Signal React that the game is ready — UIOverlay will now render
  useFlushStore.getState().setGamePhase("game");

  currentScreen = container;
  app.stage.addChild(currentScreen);
}
