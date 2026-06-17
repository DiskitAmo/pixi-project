import { Application } from "pixi.js";
import { mountApp } from "./App.tsx";
import { createVideoScreen } from "./component/introVideo.js";
import { createMarbleGameScreen } from "./game/marbleGameScreen.js";
import { initDevtools } from "@pixi/devtools";

const app = new Application();
initDevtools(app);

let currentScreen = null;
let triggerGamePhase = null; // registered by GameWrapper via onRegisterGameStart

(async () => {
  await app.init({
    background: "#000",
    resizeTo: document.getElementById("app"),
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    antialias: true,
  });
  document.getElementById("pixi-canvas").appendChild(app.canvas);

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

  // Transition React overlay to game UI
  triggerGamePhase?.();
}
