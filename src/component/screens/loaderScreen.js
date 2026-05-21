import { Container, Sprite, Graphics, Text, TextStyle, Assets } from "pixi.js";

async function preloadAssets() {
  await Assets.load([
    "/assets/loading-screen/bg.png",
    "/assets/logo/logo1.svg",
  ]);
}

preloadAssets();

export function createLoaderScreen(app, onComplete) {
  const container = new Container();

  // Background
  const bg = Sprite.from("/assets/loading-screen/bg.png");
  container.addChild(bg);

  // Logo
  const logo = Sprite.from("/assets/logo/logo1.svg");

  logo.anchor.set(0.5);
  logo.scale.set(0.4);

  container.addChild(logo);

  // Loading text
  const style = new TextStyle({
    fill: "gray",
    fontSize: 22,
  });
  const loadingText = new Text("LOADING", style);
  loadingText.anchor.set(0.5);
  container.addChild(loadingText);

  // Progress bar bg
  const barBg = new Graphics();
  container.addChild(barBg);

  // Progress fill
  const barFill = new Graphics();
  container.addChild(barFill);

  let progress = 0;

  // RESIZE FUNCTION
  function resize() {
    const sw = app.screen.width;
    const sh = app.screen.height;

    // Background cover resize
    const texW = bg.texture.width;
    const texH = bg.texture.height;

    if (texW && texH) {
      const scale = Math.max(sw / texW, sh / texH);

      bg.width = texW * scale;
      bg.height = texH * scale;

      bg.x = (sw - bg.width) / 2;
      bg.y = (sh - bg.height) / 2;
    }

    // Logo
    logo.x = sw / 2;
    logo.y = sh / 2 - 100;

    const logoScale = Math.min(sw / 1920, sh / 1080);
    logo.scale.set(Math.max(0.25, logoScale * 0.4));

    // Loading text
    loadingText.x = sw / 2;
    loadingText.y = sh / 2;

    // Progress bar bg
    const barWidth = Math.min(300, sw * 0.7);

    barBg.clear();
    barBg.beginFill(0x000000);
    barBg.drawRoundedRect(0, 0, barWidth, 20, 10);
    barBg.endFill();

    barBg.x = sw / 2 - barWidth / 2;
    barBg.y = sh / 2 + 50;

    // Progress fill
    barFill.clear();
    barFill.beginFill(0xffffff);
    barFill.drawRoundedRect(0, 0, (barWidth - 10) * progress, 12, 6);
    barFill.endFill();

    barFill.x = barBg.x + 5;
    barFill.y = barBg.y + 4;
  }

  // initial resize
  resize();

  // resize listener
  app.renderer.on("resize", resize);

  //loading animation
  const tickerFn = () => {
    progress += 0.01;

    resize();

    if (progress >= 1) {
      app.ticker.remove(tickerFn);

      // cleanup resize listener
      app.renderer.off("resize", resize);

      onComplete();
    }
  };

  app.ticker.add(tickerFn);

  return container;
}
