import { Container, Sprite, Graphics, Text, TextStyle, Assets } from "pixi.js";

await Assets.load([
  "/assets/loading-screen/bg.png",
  "/assets/logo/logo1.svg",
  "/assets/loading-screen/card1.png",
  "/assets/loading-screen/card2.png",
  "/assets/loading-screen/card3.png",
  "/assets/intro.mp4",
]);

export function createMenuScreen(app, onStart) {
  const container = new Container();

  // Background
  const bg = Sprite.from("/assets/loading-screen/bg.png");
  container.addChild(bg);

  // Logo
  const logo = Sprite.from("/assets/logo/logo1.svg");
  logo.anchor.set(0.5);
  container.addChild(logo);

  // Button
  const btn = new Graphics();
  btn.eventMode = "static";
  btn.cursor = "pointer";
  container.addChild(btn);

  // Button Text
  const style = new TextStyle({
    fill: "#000",
    fontSize: 22,
    fontWeight: "bold",
  });
  const text = new Text("START GAME", style);
  text.anchor.set(0.5);

  btn.addChild(text);
  // Hover Animation
  const baseScale = 1;
  const hoverScale = 1.08;

  let targetScale = baseScale;
  const lerpSpeed = 0.2;

  btn.on("pointerover", () => {
    targetScale = hoverScale;
  });
  btn.on("pointerout", () => {
    targetScale = baseScale;
  });
  btn.on("pointerdown", () => {
    targetScale = 0.95;
  });
  btn.on("pointerup", () => {
    targetScale = hoverScale;
  });
  btn.on("pointerupoutside", () => {
    targetScale = baseScale;
  });

  btn.on("pointertap", onStart);

  const hoverTick = () => {
    if (!btn || btn.destroyed || !btn.scale) {
      app.ticker.remove(hoverTick);
      return;
    }

    const s = btn.scale.x + (targetScale - btn.scale.x) * lerpSpeed;

    btn.scale.set(s);
  };

  app.ticker.add(hoverTick);

  btn.once("destroyed", () => {
    app.ticker.remove(hoverTick);
  });

  // RESIZE FUNCTION
  function resize() {
    const sw = app.screen.width;
    const sh = app.screen.height;

    // Responsive background
    const texW = bg.texture.width;
    const texH = bg.texture.height;

    if (texW && texH) {
      const scale = Math.max(sw / texW, sh / texH);

      bg.width = texW * scale;
      bg.height = texH * scale;

      bg.x = (sw - bg.width) / 2;
      bg.y = (sh - bg.height) / 2;
    }

    // Responsive logo
    logo.x = sw / 2;
    logo.y = sh / 2 - 120;

    const logoScale = Math.min(sw / 1920, sh / 1080);
    logo.scale.set(Math.max(0.25, logoScale * 0.4));

    // Responsive button
    const btnWidth = Math.min(220, sw * 0.5);
    const btnHeight = 70;

    btn.clear();

    btn.beginFill(0x00ff00);
    btn.drawRoundedRect(0, 0, btnWidth, btnHeight, 20);
    btn.endFill();

    // center pivot
    btn.pivot.set(btnWidth / 2, btnHeight / 2);
    btn.x = sw / 2;
    btn.y = sh / 2 + 10;

    // Button text
    text.x = btnWidth / 2;
    text.y = btnHeight / 2;

    style.fontSize = Math.max(16, sw * 0.018);
  }

  // Initial resize
  resize();

  // Resize listener
  app.renderer.on("resize", resize);

  // Cleanup
  container.once("destroyed", () => {
    app.renderer.off("resize", resize);
    app.ticker.remove(hoverTick);
  });

  return container;
}
