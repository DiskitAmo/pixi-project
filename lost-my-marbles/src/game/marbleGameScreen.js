import { Container, Graphics, Sprite, Text, Assets, TextStyle } from "pixi.js";
import { ASSETS, DROP_ITEM_SOURCES } from "../lib/constants";

const OUTER_SIDES = 7;
const INNER_SIDES = 7; // 6 visible + 1 open
const RING_COUNT = 5;
const RING_MULTIPLIERS = [1.2, 1.5, 2.0, 4.2, 8.0];
const COLORED_SEGMENTS = [
  [0, 2, 0xf97316],
  [4, 6, 0xec4899],
];
const OPEN_SIDE = [5, 4, 3, 2]; // per inner ring innermost→second-outermost
const ROTATION_SPEED = 0.01;

export async function createMarbleGameScreen(app) {
  // Pre-load all textures
  const [bgTexture, charTex1, charTex2, charTex3, charTex4] = await Promise.all([
    Assets.load(ASSETS.BACKGROUND_IMG),
    Assets.load(ASSETS.CHARACTER_VARIANT_1),
    Assets.load(ASSETS.CHARACTER_VARIANT_2),
    Assets.load(ASSETS.CHARACTER_VARIANT_3),
    Assets.load(ASSETS.CHARACTER_VARIANT_4),
  ]);
  const charTextures = [charTex1, charTex2, charTex3, charTex4];

  const root = new Container();
  let destroyed = false;
  root.on("destroyed", () => { destroyed = true; });

  // Refs to repositionable objects
  let bgSprite, board, outerRing, innerRings = [], character;

  function build() {
    // Clear previous content
    root.removeChildren();
    innerRings = [];

    const { width, height } = app.screen;
    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = Math.min(width, height) * 0.35;

    // ── Background ──────────────────────────────────────────────────────────
    bgSprite = new Sprite(bgTexture);
    bgSprite.width = width;
    bgSprite.height = height;
    root.addChild(bgSprite);

    // ── Board ───────────────────────────────────────────────────────────────
    board = new Container();
    board.x = cx;
    board.y = cy;
    root.addChild(board);

    // Outermost ring (7-sided, clockwise)
    outerRing = new Container();
    board.addChild(outerRing);

    const outerGfx = new Graphics();
    outerRing.addChild(outerGfx);

    const outerVerts = getPolygonVertices(OUTER_SIDES, maxRadius);

    for (const [startV, endV, color] of COLORED_SEGMENTS) {
      outerGfx.moveTo(outerVerts[startV].x, outerVerts[startV].y);
      for (let i = startV + 1; i <= endV; i++) {
        outerGfx.lineTo(outerVerts[i % OUTER_SIDES].x, outerVerts[i % OUTER_SIDES].y);
      }
      outerGfx.stroke({ width: 4, color });
    }

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

    // Badges at midpoint of each outer side
    const outerMultiplier = RING_MULTIPLIERS[RING_COUNT - 1];
    for (let i = 0; i < OUTER_SIDES; i++) {
      const a = outerVerts[i];
      const b = outerVerts[(i + 1) % OUTER_SIDES];
      drawBadge(outerRing, (a.x + b.x) / 2, (a.y + b.y) / 2, `${outerMultiplier}x`);
    }

    // Inner rings (6 visible sides + 1 open, alternating direction)
    for (let r = RING_COUNT - 2; r >= 0; r--) {
      const radius = maxRadius * ((r + 1) / RING_COUNT);
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

      const clockwise = (RING_COUNT - 2 - r) % 2 !== 0;
      innerRings.push({ container: ringContainer, clockwise });
    }

    // ── Character ───────────────────────────────────────────────────────────
    character = new Sprite(charTextures[0]);
    const charHeight = height * 0.96;
    character.scale.set(charHeight / charTextures[0].height);
    character.anchor.set(0, 1);
    character.x = 0;
    character.y = height;
    root.addChild(character);
  }

  // Initial build
  build();

  // Rebuild layout on every Pixi renderer resize
  app.renderer.on("resize", () => {
    if (!destroyed) build();
  });

  // ── Ticker: rotate rings ─────────────────────────────────────────────────
  const tickerFn = () => {
    if (outerRing) outerRing.rotation += ROTATION_SPEED;
    for (const { container: rc, clockwise } of innerRings) {
      rc.rotation += clockwise ? ROTATION_SPEED : -ROTATION_SPEED;
    }
  };
  app.ticker.add(tickerFn);
  root.on("destroyed", () => {
    app.ticker.remove(tickerFn);
    app.renderer.off("resize", build);
  });

  // ── Character animation ──────────────────────────────────────────────────
  const REPEATS = 3;
  const FRAME_MS = 450;

  function playBurst() {
    if (destroyed) return;
    let frame = 0;
    let cycle = 0;
    const frameInterval = setInterval(() => {
      if (destroyed || !character) { clearInterval(frameInterval); return; }
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

  // ── Drop marble ──────────────────────────────────────────────────────────
  let isDropping = false;

  function dropMarble() {
    if (isDropping || destroyed || !board) return;
    isDropping = true;

    // Pick a random cached drop item
    const path = DROP_ITEM_SOURCES[Math.floor(Math.random() * DROP_ITEM_SOURCES.length)];
    const texture = Assets.get(path);
    if (!texture) { isDropping = false; return; }

    const { width, height } = app.screen;
    const maxRadius = Math.min(width, height) * 0.35;

    const marble = new Sprite(texture);
    marble.anchor.set(0.5);
    marble.width = 60;
    marble.height = 60;
    marble.x = 0;
    marble.y = 0;
    board.addChild(marble);

    // Pick random target side on the outer ring
    const targetSide = Math.floor(Math.random() * OUTER_SIDES);
    const outerVerts = getPolygonVertices(OUTER_SIDES, maxRadius);
    const targetX = (outerVerts[targetSide].x + outerVerts[(targetSide + 1) % OUTER_SIDES].x) / 2;
    const targetY = (outerVerts[targetSide].y + outerVerts[(targetSide + 1) % OUTER_SIDES].y) / 2;
    const targetAngle = Math.atan2(targetY, targetX);

    const DURATION = 2800;
    const startTime = performance.now();

    const tickFn = () => {
      if (destroyed) { app.ticker.remove(tickFn); return; }

      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / DURATION, 1);
      // ease-in-out
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      const r = maxRadius * eased;
      // Spiral from top, converge toward the target side angle
      const startAngle = -Math.PI / 2;
      const totalSpin = Math.PI * 4; // 2 full rotations while moving out
      const angle = startAngle + eased * (totalSpin + (targetAngle - startAngle));

      marble.x = Math.cos(angle) * r;
      marble.y = Math.sin(angle) * r;
      marble.rotation += 0.15;

      if (t >= 1) {
        app.ticker.remove(tickFn);
        marble.x = targetX;
        marble.y = targetY;
        marble.rotation = 0;

        // Pulse then remove
        let pulse = 0;
        const pulseFn = () => {
          pulse += 0.1;
          marble.scale.set(1 + Math.sin(pulse) * 0.15);
          if (pulse > Math.PI * 3) {
            app.ticker.remove(pulseFn);
            board?.removeChild(marble);
            marble.destroy();
            isDropping = false;
          }
        };
        app.ticker.add(pulseFn);
      }
    };

    app.ticker.add(tickFn);
  }

  // Expose to React bet button
  window.__dropMarble = dropMarble;
  root.on("destroyed", () => { window.__dropMarble = null; });

  return root;
}

function getPolygonVertices(sides, radius) {
  return Array.from({ length: sides }, (_, i) => {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
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
