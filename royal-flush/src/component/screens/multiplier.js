import { Container, Graphics, Text } from "pixi.js";

const COLORS = {
  low: "#a855f7",
  medium: "#3b82f6",
  high: "#eab308",
};

function getMultiplierColor(val) {
  if (val < 3) return COLORS.low;

  if (val < 25) return COLORS.medium;

  return COLORS.high;
}

export function createMultiplierUI(centerX, centerY) {
  const container = new Container();

  // BG Circle
  const bg = new Graphics();
  container.addChild(bg);

  // Text
  const text = new Text("1.00x", {
    fontFamily: "Arial",
    fontSize: 32,
    fontWeight: "900",
    fill: COLORS.medium,

    dropShadow: true,
    dropShadowColor: "#000000",
    dropShadowBlur: 6,
    dropShadowAngle: Math.PI / 4,
    dropShadowDistance: 4,
  });

  text.anchor.set(0.5);
  container.addChild(text);

  container.x = centerX;
  container.y = centerY;
  container.zIndex = 96; // above flushable objects (default 0), below overlays (95-100)

  // Tracks current size so update/showReady always redraw at the right radius
  let radius = 110;
  let isReadyState = true;
  let lastMultiplier = 1;

  function update(multiplierValue) {
    isReadyState = false;
    lastMultiplier = multiplierValue;

    const color = getMultiplierColor(multiplierValue);
    text.text = `${multiplierValue.toFixed(2)}x`;
    text.style.fill = color;

    bg.clear();
    bg.lineStyle(4, color, 1);
    bg.beginFill(0x1f2937, 0.75);
    bg.drawCircle(0, 0, radius);
    bg.endFill();
  }

  function showReady() {
    isReadyState = true;
    text.text = "READY";
    text.style.fill = "#6b7280";

    bg.clear();
    bg.lineStyle(4, 0x6b7280, 1);
    bg.beginFill(0x1f2937, 0.6);
    bg.drawCircle(0, 0, radius);
    bg.endFill();
  }

  function resize(isMobile) {
    radius = isMobile ? 65 : 110;
    text.style.fontSize = isMobile ? 20 : 32;
    // Redraw at new size keeping current visual state
    if (isReadyState) {
      showReady();
    } else {
      update(lastMultiplier);
    }
  }

  // Initial state — wait for first bet before spinning
  showReady();

  return {
    container,
    update,
    showReady,
    resize,
    text,
    bg,
  };
}
