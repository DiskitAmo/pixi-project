import { Application, Assets } from "pixi.js";
import { createLoaderScreen } from "./component/screens/loaderScreen.js";
import { createMenuScreen } from "./component/screens/step2.js";
import { createVideoScreen } from "./component/screens/introVideo.js";
import { createFlushScreen } from "./component/screens/flushGame.js";
import { mountUIOverlay, unmountUIOverlay } from "./mountOverlay.ts";

import { initDevtools } from "@pixi/devtools";

const app = new Application();
initDevtools(app);
let currentScreen;

// BG MUSIC
const bgMusic = new Audio("/sounds/casino-royale.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.1;

// TOGGLE FUNCTION
function toggleMusic() {
  if (bgMusic.paused) {
    bgMusic.play();
  } else {
    bgMusic.pause();
  }
}

(async () => {
  await app.init({ background: "#000", resizeTo: window });
  document.body.appendChild(app.canvas);

  // autoplay
  document.addEventListener(
    "click",
    () => {
      bgMusic.play().catch(() => {});
    },
    { once: true },
  );

  showLoader();
})();

function clearScreen() {
  if (currentScreen) {
    app.stage.removeChild(currentScreen);
    currentScreen.destroy({ children: true });
  }
}

function showLoader() {
  clearScreen();

  currentScreen = createLoaderScreen(app, () => {
    showMenu();
  });

  app.stage.addChild(currentScreen);
}

function showMenu() {
  clearScreen();

  currentScreen = createMenuScreen(app, () => {
    showVideo();
  });

  app.stage.addChild(currentScreen);
}

async function showVideo() {
  clearScreen();

  //  PRELOAD next screen assets in background
  const preload = Assets.load([
    "/assets/loading-screen/background-img.webp",
    "/assets/flush/toilet-seat.png",
    "/assets/flush/water.png",
    "/assets/logo/logo.png",
  ]);

  currentScreen = await createVideoScreen(app, async () => {
    // wait for preload
    await preload;

    // <FlushGame />;
    // mountFlushGame();
    flushGame();
  });

  app.stage.addChild(currentScreen);
}

async function flushGame() {
  clearScreen();
  unmountUIOverlay();

  const result = await createFlushScreen(app);

  if (!result) {
    console.error("createFlushScreen returned nothing");
    return;
  }

  const { container, triggerFlush } = result;

  mountUIOverlay(
    () => triggerFlush(),
    () => {},
    toggleMusic,
  );

  currentScreen = container;
  app.stage.addChild(currentScreen);
}
