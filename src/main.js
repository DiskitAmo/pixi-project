import { Application, Assets } from "pixi.js";
import { createVideoScreen } from "./component/screens/introVideo.js";
import { createFlushScreen } from "./component/screens/flushGame.js";
import { mountApp } from "./App.tsx";
import { useFlushStore } from "./store/useRoyalFlushStore.ts";

import { initDevtools } from "@pixi/devtools";

const app = new Application();
initDevtools(app);
let currentScreen;

const bgMusic = new Audio("/sounds/casino-royale.mp3");
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
  await app.init({ background: "#000", resizeTo: window });
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
  // Start BG music only when the user explicitly clicks START GAME
  bgMusic.play().catch(() => {});

  const preload = Assets.load([
    "/assets/loading-screen/background-img.webp",
    "/assets/flush/toilet-seat.png",
    "/assets/flush/water.png",
    "/assets/logo/logo.png",
  ]);

  currentScreen = await createVideoScreen(app, async () => {
    await preload;
    flushGame();
  });

  app.stage.addChild(currentScreen);
}

async function flushGame() {
  clearScreen();

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
