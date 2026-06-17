import { Container, Graphics, Sprite, Text, Assets, TextStyle } from "pixi.js";
import { ASSETS } from "../lib/constants";

const RING_COUNT = 5;
const OUTER_SIDES = 7;
const INNER_SIDES = 7; // 6 visible sides + 1 open gap

const RING_MULTIPLIERS = [1.2, 1.5, 2.0, 4.2, 8.0];

const COLORED_SEGMENTS = [
  [0, 2, 0xf97316], // orange — top-right
  [4, 6, 0xec4899], // pink  — bottom-left
];

const OPEN_SIDE = [5, 4, 3, 2]; // open side per inner ring (innermost → second-outermost)

const ROTATION_SPEED = 0.01; // radians per frame

export async function createMarbleGameScreen(app) {
  const container = new Container();

  const { width, height } = app.screen;
  const cx = width / 2;
  const cy = height / 2;

  // Background
  const bgTexture = await Assets.load(ASSETS.BACKGROUND_IMG);
  const bgSprite = new Sprite(bgTexture);
  bgSprite.width = width;
  bgSprite.height = height;
  container.addChild(bgSprite);

  // Board — centered
  const board = new Container();
  board.x = cx;
  board.y = cy;
  container.addChild(board);

  const outerRadius = Math.min(width, height) * 0.35;

  // ── Outermost ring (7-sided, clockwise) ──────────────────────────────────
  const outerRing = new Container();
  board.addChild(outerRing);

  const outerGfx = new Graphics();
  outerRing.addChild(outerGfx);

  const outerVerts = getPolygonVertices(OUTER_SIDES, outerRadius);

  // Colored segments
  for (const [startV, endV, color] of COLORED_SEGMENTS) {
    outerGfx.moveTo(outerVerts[startV].x, outerVerts[startV].y);
    for (let i = startV + 1; i <= endV; i++) {
      outerGfx.lineTo(outerVerts[i % OUTER_SIDES].x, outerVerts[i % OUTER_SIDES].y);
    }
    outerGfx.stroke({ width: 4, color });
  }

  // White sides
  for (let i = 0; i < OUTER_SIDES; i++) {
    const isColored = COLORED_SEGMENTS.some(([s, e]) => i >= s && i < e);
    if (!isColored) {
      const a = outerVerts[i];
      const b = outerVerts[(i + 1) % OUTER_SIDES];
      outerGfx.moveTo(a.x, a.y);
      outerGfx.lineTo(b.x, b.y);
      outerGfx.stroke({ width: 2.5, color: 0xffffff, alpha: 0.85 });
    }
  }

  // Multiplier badges at midpoint of each side
  const outerMultiplier = RING_MULTIPLIERS[RING_COUNT - 1];
  for (let i = 0; i < OUTER_SIDES; i++) {
    const a = outerVerts[i];
    const b = outerVerts[(i + 1) % OUTER_SIDES];
    drawBadge(outerRing, (a.x + b.x) / 2, (a.y + b.y) / 2, `${outerMultiplier}x`);
  }

  // ── Inner rings (6-sided, one side open, alternating rotation) ───────────
  const innerRings = [];

  for (let r = RING_COUNT - 2; r >= 0; r--) {
    const radius = outerRadius * ((r + 1) / RING_COUNT);
    const ringContainer = new Container();
    board.addChild(ringContainer);

    const gfx = new Graphics();
    ringContainer.addChild(gfx);

    const verts = getPolygonVertices(INNER_SIDES, radius);
    const openSide = OPEN_SIDE[r];

    for (let i = 0; i < INNER_SIDES; i++) {
      if (i === openSide) continue;
      const a = verts[i];
      const b = verts[(i + 1) % INNER_SIDES];
      gfx.moveTo(a.x, a.y);
      gfx.lineTo(b.x, b.y);
      gfx.stroke({ width: 2.5, color: 0xffffff, alpha: 0.85 });
    }

    // ring index 3 (second-outermost inner) = anti-clockwise, then alternates
    // outermost inner ring (r=3) is anti-clockwise, r=2 clockwise, etc.
    const clockwise = (RING_COUNT - 2 - r) % 2 !== 0;
    innerRings.push({ container: ringContainer, clockwise });
  }

  // ── Ticker: rotate all rings ──────────────────────────────────────────────
  const tickerFn = () => {
    outerRing.rotation += ROTATION_SPEED; // clockwise
    for (const { container: rc, clockwise } of innerRings) {
      rc.rotation += clockwise ? ROTATION_SPEED : -ROTATION_SPEED;
    }
  };
  app.ticker.add(tickerFn);

  container.on("destroyed", () => app.ticker.remove(tickerFn));

  // ── Character sprite ──────────────────────────────────────────────────────
  const [charTex1, charTex2, charTex3, charTex4] = await Promise.all([
    Assets.load(ASSETS.CHARACTER_VARIANT_1),
    Assets.load(ASSETS.CHARACTER_VARIANT_2),
    Assets.load(ASSETS.CHARACTER_VARIANT_3),
    Assets.load(ASSETS.CHARACTER_VARIANT_4),
  ]);
  const charTextures = [charTex1, charTex2, charTex3, charTex4];

  const character = new Sprite(charTextures[0]);
  const charHeight = height * 0.96;
  const charScale = charHeight / charTextures[0].height;
  character.scale.set(charScale);
  character.anchor.set(0, 1);
  character.x = 0;
  character.y = height;
  container.addChild(character);

  // Animate character: play 3 cycles then pause 1 minute
  let destroyed = false;
  container.on("destroyed", () => { destroyed = true; });

  const REPEATS = 3;
  const FRAME_MS = 450;

  function playBurst() {
    if (destroyed) return;
    let frame = 0;
    let cycle = 0;
    const frameInterval = setInterval(() => {
      if (destroyed) { clearInterval(frameInterval); return; }
      frame++;
      if (frame >= charTextures.length) { frame = 0; cycle++; }
      character.texture = charTextures[frame];
      if (cycle >= REPEATS) {
        clearInterval(frameInterval);
        character.texture = charTextures[0];
        setTimeout(playBurst, 60000);
      }
    }, FRAME_MS);
  }

  playBurst();

  return container;
}

function getPolygonVertices(sides, radius) {
  const vertices = [];
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    vertices.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
  }
  return vertices;
}

function drawBadge(parent, x, y, label) {
  const gfx = new Graphics();
  gfx.x = x;
  gfx.y = y;
  gfx.circle(0, 0, 22);
  gfx.fill({ color: 0x0a0a1a, alpha: 0.9 });
  gfx.circle(0, 0, 22);
  gfx.stroke({ width: 1.5, color: 0x4444aa, alpha: 0.8 });
  parent.addChild(gfx);

  const text = new Text({
    text: label,
    style: new TextStyle({
      fontFamily: "ClashDisplay, sans-serif",
      fontSize: 13,
      fontWeight: "600",
      fill: 0xffffff,
      align: "center",
    }),
  });
  text.anchor.set(0.5);
  text.x = x;
  text.y = y;
  parent.addChild(text);
}
