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
    fontSize: 40,
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

  function update(multiplierValue) {
    const color = getMultiplierColor(multiplierValue);

    text.text = `${multiplierValue.toFixed(2)}x`;

    text.style.fill = color;

    bg.clear();

    // border
    bg.lineStyle(4, color, 1);

    // fill
    bg.beginFill(0x1f2937, 0.75);
    bg.drawCircle(0, 0, 110);
    bg.endFill();
  }

  // initial
  update(1);

  return {
    container,
    update,
    text,
    bg,
  };
}
