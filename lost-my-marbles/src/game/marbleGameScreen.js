import { Container, Graphics, Sprite, Text, Assets, TextStyle } from "pixi.js";
import { ASSETS, DROP_ITEM_SOURCES, SOUNDS } from "../lib/constants";
import { useMarbleStore } from "../store/useMarbleStore";

const OUTER_SIDES = 7;
const INNER_SIDES = 7; // 6 visible + 1 open
const RING_COUNT = 5;
const RING_MULTIPLIERS = [1.2, 1.5, 2.0, 4.2, 8.0];
// Starting multiplier per outer-ring side — one value from the pool per side
const OUTER_SIDE_MULTIPLIERS = [20, 8, 2.5, 0.5, 1.8, 4.2, 10];
// Pool that all badges cycle through continuously (matches reference game values)
const MULTIPLIER_POOL = [
  0.3, 0.5, 1.2, 1.5, 1.8, 2, 2.5, 3.5, 4.2, 5.5, 8, 10, 15, 20,
];
// How fast each badge steps to the next pool value (fast slot-machine effect)
const BADGE_CYCLE_MS = 300;
const COLORED_SEGMENTS = [
  [0, 2, 0xf97316],
  [4, 6, 0xec4899],
];
const OPEN_SIDE = [5, 4, 3, 2]; // per inner ring innermost→second-outermost
const ROTATION_SPEED = 0.009;
const INNER_ROTATION_SPEED = 0.016;

// Risk tier → colour (matched to royal-flush COLORS: low=#E128FF, medium=#48C8FF, high=#FFED28)
function getRiskColor(m) {
  if (m >= 5) return 0xffed28; // high   — yellow/gold  (≥5x)
  if (m >= 1.5) return 0x48c8ff; // medium — cyan/sky     (1.5x–5x)
  return 0xe128ff; // low    — magenta/pink (<1.5x)
}

// Linear-interpolate between two hex colours
function lerpColor(c1, c2, t) {
  const r = Math.round(
    ((c1 >> 16) & 0xff) + (((c2 >> 16) & 0xff) - ((c1 >> 16) & 0xff)) * t,
  );
  const g = Math.round(
    ((c1 >> 8) & 0xff) + (((c2 >> 8) & 0xff) - ((c1 >> 8) & 0xff)) * t,
  );
  const b = Math.round((c1 & 0xff) + ((c2 & 0xff) - (c1 & 0xff)) * t);
  return (r << 16) | (g << 8) | b;
}

export async function createMarbleGameScreen(app) {
  const [bgTexture, charTex1, charTex2, charTex3, charTex4] = await Promise.all(
    [
      Assets.load(ASSETS.BACKGROUND_IMG),
      Assets.load(ASSETS.CHARACTER_VARIANT_1),
      Assets.load(ASSETS.CHARACTER_VARIANT_2),
      Assets.load(ASSETS.CHARACTER_VARIANT_3),
      Assets.load(ASSETS.CHARACTER_VARIANT_4),
    ],
  );
  const charTextures = [charTex1, charTex2, charTex3, charTex4];

  const root = new Container();
  let destroyed = false;
  root.on("destroyed", () => {
    destroyed = true;
  });

  let bgSprite,
    board,
    outerRing,
    innerRings = [],
    character;
  // Badge refs keyed by outer-ring side index
  let outerBadges = [];

  function build() {
    root.removeChildren();
    innerRings = [];
    outerBadges = [];

    const { width, height } = app.screen;
    const isMobile = width < 768;
    // On mobile the bottom controls panel is ~200px tall — centre the board above it
    const MOBILE_CONTROLS_HEIGHT = 240;
    const gameAreaHeight = isMobile ? height - MOBILE_CONTROLS_HEIGHT : height;
    const cx = width / 2;
    const cy = isMobile ? gameAreaHeight / 2 - 20 : height / 2;
    // Keep rings fully inside the narrower game area dimension, with a small margin for badges
    const maxRadius = Math.min(width, gameAreaHeight) * (isMobile ? 0.3 : 0.35);

    // ── Background ──────────────────────────────────────────────────────────
    bgSprite = new Sprite(bgTexture);
    bgSprite.width = width;
    bgSprite.height = height;
    root.addChild(bgSprite);

    // ── Character (behind rings) ─────────────────────────────────────────────
    character = new Sprite(charTextures[0]);
    const charHeight = height * (isMobile ? 0.55 : 0.96);
    character.scale.set(charHeight / charTextures[0].height);
    character.anchor.set(0, 1);
    character.x = 0;
    character.y = height;
    root.addChild(character);

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
        outerGfx.lineTo(
          outerVerts[i % OUTER_SIDES].x,
          outerVerts[i % OUTER_SIDES].y,
        );
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
        outerGfx.stroke({ width: 5, color: 0xffffff, alpha: 0.85 });
      }
    }

    // Badges at midpoint of each outer side — per-side multiplier + risk colour
    for (let i = 0; i < OUTER_SIDES; i++) {
      const a = outerVerts[i];
      const b = outerVerts[(i + 1) % OUTER_SIDES];
      const bx = (a.x + b.x) / 2;
      const by = (a.y + b.y) / 2;
      const mult = OUTER_SIDE_MULTIPLIERS[i];
      const riskColor = getRiskColor(mult);
      const badge = drawBadge(outerRing, bx, by, `${mult}x`, riskColor);
      // phaseOffset staggers each badge's pulse so they don't all blink in sync
      outerBadges.push({
        gfx: badge.gfx,
        text: badge.text,
        x: bx,
        y: by,
        riskColor,
        currentMultiplier: mult,
        phaseOffset: (i / OUTER_SIDES) * Math.PI * 2,
      });
    }

    // Inner rings — store openSide and radius for gap navigation
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
        gfx.stroke({ width: 4, color: 0xffffff, alpha: 0.85 });
      }

      const clockwise = (RING_COUNT - 2 - r) % 2 !== 0;
      innerRings.push({
        container: ringContainer,
        clockwise,
        openSide,
        radius,
      });
    }
  }

  build();

  app.renderer.on("resize", () => {
    if (!destroyed) build();
  });

  // ── Ticker: rotate rings ─────────────────────────────────────────────────
  const tickerFn = () => {
    if (outerRing) {
      outerRing.rotation -= ROTATION_SPEED;
      // Counter-rotate each badge text so it stays upright as the ring spins
      for (const badge of outerBadges) {
        badge.text.rotation = -outerRing.rotation;
      }
    }
    for (const { container: rc, clockwise } of innerRings) {
      rc.rotation += clockwise ? -INNER_ROTATION_SPEED : INNER_ROTATION_SPEED;
    }
  };
  app.ticker.add(tickerFn);

  // ── Ticker: continuous risk-colour pulse on all badges ───────────────────
  let badgeTime = 0;
  const badgeTickFn = () => {
    badgeTime += 0.025;
    for (const badge of outerBadges) {
      // Smooth sine pulse in [0, 1] — each badge offset so they ripple independently
      const pulse = (Math.sin(badgeTime + badge.phaseOffset) + 1) / 2;

      // Border: blend from dim base colour to full risk colour
      const borderAlpha = 0.35 + pulse * 0.65;
      const borderWidth = 1.5 + pulse * 2;
      badge.gfx.clear();
      badge.gfx.circle(0, 0, 22);
      badge.gfx.fill({ color: 0x0a0a1a, alpha: 0.9 });
      badge.gfx.circle(0, 0, 22);
      badge.gfx.stroke({
        width: borderWidth,
        color: badge.riskColor,
        alpha: borderAlpha,
      });

      // Text: interpolate from white → risk colour and back
      badge.text.style.fill = lerpColor(
        0xffffff,
        badge.riskColor,
        pulse * 0.75,
      );
    }
  };
  app.ticker.add(badgeTickFn);

  // ── Badge value cycling ──────────────────────────────────────────────────
  // Each badge owns a pool index that advances every BADGE_CYCLE_MS.
  // Badges start at different offsets so they never all show the same value.
  // No animation on change — instant swap, exactly like the reference game.
  const cycleIntervals = [];

  function startCycling() {
    // Clear any previous intervals (called again after resize rebuild)
    cycleIntervals.forEach(clearInterval);
    cycleIntervals.length = 0;

    outerBadges.forEach((badge, i) => {
      // Stagger starting index so badges show different values from the start
      badge.poolIndex = Math.floor((MULTIPLIER_POOL.length / OUTER_SIDES) * i);

      const id = setInterval(
        () => {
          if (destroyed) {
            clearInterval(id);
            return;
          }
          // Advance to next pool value (wrap around)
          badge.poolIndex = (badge.poolIndex + 1) % MULTIPLIER_POOL.length;
          const next = MULTIPLIER_POOL[badge.poolIndex];
          badge.currentMultiplier = next;
          badge.riskColor = getRiskColor(next);
          badge.text.text = `${next}x`;
        },
        BADGE_CYCLE_MS + i * 40,
      ); // slight stagger so they don't tick in sync

      cycleIntervals.push(id);
    });
  }

  startCycling();

  root.on("destroyed", () => {
    app.ticker.remove(tickerFn);
    app.ticker.remove(badgeTickFn);
    cycleIntervals.forEach(clearInterval);
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
      if (destroyed || !character) {
        clearInterval(frameInterval);
        return;
      }
      frame++;
      if (frame >= charTextures.length) {
        frame = 0;
        cycle++;
      }
      character.texture = charTextures[frame];
      if (cycle >= REPEATS) {
        clearInterval(frameInterval);
        character.texture = charTextures[0];
        setTimeout(playBurst, 60000);
      }
    }, FRAME_MS);
  }

  playBurst();

  // ── Badge highlight: purple/pink ripple rings when marble touches outer ring ──
  function highlightBadge(sideIndex) {
    const badge = outerBadges[sideIndex];
    if (!badge || !outerRing) return;

    // Staggered expanding ripple rings (purple → pink → purple)
    function spawnRipple(delay, color, strokeWidth, speed) {
      setTimeout(() => {
        if (destroyed || !outerRing) return;
        const ripple = new Graphics();
        outerRing.addChild(ripple);
        let t = 0;
        const fn = () => {
          t += speed;
          const r = 22 + t * 60;
          const alpha = Math.max(0, 1 - t);
          ripple.clear();
          ripple.circle(badge.x, badge.y, r);
          ripple.stroke({ width: strokeWidth, color, alpha });
          if (t >= 1) {
            app.ticker.remove(fn);
            if (outerRing.children.includes(ripple))
              outerRing.removeChild(ripple);
            ripple.destroy();
          }
        };
        app.ticker.add(fn);
      }, delay);
    }

    spawnRipple(0, 0xaa22ff, 3.5, 0.038);
    spawnRipple(160, 0xff44cc, 2.5, 0.04);
    spawnRipple(320, 0xaa22ff, 2.0, 0.036);

    // Flash badge border purple + pulse text
    let flashT = 0;
    const flashFn = () => {
      flashT += 0.07;
      const envelope = Math.max(0, Math.sin(flashT * Math.PI * 0.7));

      badge.gfx.clear();
      badge.gfx.circle(0, 0, 22);
      badge.gfx.fill({ color: 0x0d0020, alpha: 0.95 });
      badge.gfx.circle(0, 0, 22);
      badge.gfx.stroke({
        width: 2.5,
        color: 0xcc44ff,
        alpha: Math.min(1, envelope * 1.4),
      });

      badge.text.scale.set(1 + envelope * 0.4);

      if (flashT > Math.PI * 1.5) {
        app.ticker.remove(flashFn);
        badge.text.scale.set(1);
        badge.gfx.clear();
        badge.gfx.circle(0, 0, 22);
        badge.gfx.fill({ color: 0x0a0a1a, alpha: 0.9 });
        badge.gfx.circle(0, 0, 22);
        badge.gfx.stroke({ width: 1.5, color: 0x4444aa, alpha: 0.8 });
      }
    };
    app.ticker.add(flashFn);
  }

  // ── Drop marble — physics simulation ────────────────────────────────────
  // The marble bounces off every solid ring side (6 per inner ring + all 7
  // outer-ring sides). The one open side (gap) of each inner ring lets the
  // marble pass through into the next corridor. When the marble hits any side
  // of the outermost ring it stops and highlights the badge at that side.
  let isDropping = false;

  function dropMarble() {
    // if (isDropping || destroyed || !board) return;
    // isDropping = true;
    if (destroyed || !board) return;
    console.log("drop started");

    const path =
      DROP_ITEM_SOURCES[Math.floor(Math.random() * DROP_ITEM_SOURCES.length)];
    const texture = Assets.get(path);
    // if (!texture) {
    //   isDropping = false;
    //   return;
    // }

    const { width, height } = app.screen;
    const isMobile = width < 768;
    const MOBILE_CONTROLS_HEIGHT = 240;
    const gameAreaHeight = isMobile ? height - MOBILE_CONTROLS_HEIGHT : height;
    const maxRadius = Math.min(width, gameAreaHeight) * (isMobile ? 0.3 : 0.35);

    const marble = new Sprite(texture);
    marble.anchor.set(0.5);
    marble.width = 22;
    marble.height = 22;
    marble.x = 0;
    marble.y = 0;
    board.addChild(marble);

    // ── Physics state ────────────────────────────────────────────────────
    // const SPEED   = maxRadius / 300;
    // const BOUNCE  = 0.82;
    // const GRAVITY = SPEED * 0.006;  // px / ms²

    // Drop from just inside the top of the innermost ring with a random lateral push
    const innerR = maxRadius / RING_COUNT;
    const dir = Math.random() < 0.5 ? 1 : -1;
    // let px = 0, py = -(innerR * 0.75);
    // let vx = dir * SPEED * (0.3 + Math.random() * 0.4);
    // let vy = SPEED * 0.2; // small initial downward nudge

    // const marblePhysics = {
    //   x: 0,
    //   y: -(innerR * 0.6),

    //   vx: (Math.random() - 0.5) * 3,
    //   vy: 0,

    //   radius: 11,
    // };

    const SUB_STEPS = 6;

    // Marble starts at rest — gravity pulls it down naturally.
    // A tiny random horizontal nudge stops it falling dead-centre into a corner.
    const nudge = (Math.random() < 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.3);

    const marblePhysics = {
      x: 0,
      y: 0,
      vx: nudge,
      vy: 0,
      radius: 11,
    };

    const GRAVITY = 0.18; // pulls marble downward each sub-step
    const BOUNCE = 1;     // perfectly elastic — wall reverses velocity at exact same speed
    const AIR_DRAG = 1;   // no drag — energy is fully preserved between bounces

    let done = false;

    const wallHitAudio = new Audio(SOUNDS.WALL_HIT_SFX);
    wallHitAudio.volume = 0.25;
    let lastWallHitTime = 0;
    // Safety: force-exit after 18 s in case gaps never align
    // const safetyTimer = setTimeout(() => {
    //   if (done || destroyed) return;
    //   done = true;
    //   const side = Math.floor(Math.random() * OUTER_SIDES);
    //   const ov = polyVerts(OUTER_SIDES, maxRadius, outerRing.rotation);
    //   marble.x = (ov[side].x + ov[(side + 1) % OUTER_SIDES].x) / 2;
    //   marble.y = (ov[side].y + ov[(side + 1) % OUTER_SIDES].y) / 2;
    //   highlightBadge(side);
    //   finishMarble();
    // }, 18000);

    function finishMarble(sideIndex) {
      const badge = outerBadges[sideIndex];
      let t = 0;

      const flyFn = () => {
        t += 0.07;
        if (t > 1) t = 1;

        // Recompute badge center every frame — outerRing keeps rotating during flight
        const rot = outerRing.rotation;
        const targetX = badge.x * Math.cos(rot) - badge.y * Math.sin(rot);
        const targetY = badge.x * Math.sin(rot) + badge.y * Math.cos(rot);

        // Exponential approach: marble chases the badge, naturally decelerates
        marble.x += (targetX - marble.x) * 0.18;
        marble.y += (targetY - marble.y) * 0.18;

        // Shrink to ~10% — stays visible inside badge circle
        marble.scale.set(Math.max(0.1, 1 - t * 0.9));

        if (t >= 1) {
          app.ticker.remove(flyFn);

          // Snap to exact badge center
          marble.x = targetX;
          marble.y = targetY;

          // Ripple fires while marble sits inside the badge
          highlightBadge(sideIndex);

          // Show win feed pill in the React UI
          const { betAmount, setLastWin } = useMarbleStore.getState();
          const multiplier = badge.currentMultiplier;
          setLastWin({
            id: `${Date.now()}`,
            multiplier,
            winAmount: parseFloat((multiplier * betAmount).toFixed(2)),
          });

          // Remove marble after ripple finishes (~1.2 s)
          setTimeout(() => {
            if (destroyed) return;
            if (board?.children.includes(marble)) board.removeChild(marble);
            marble.destroy();
          }, 1200);
        }
      };
      app.ticker.add(flyFn);
    }

    // ── Physics ticker ───────────────────────────────────────────────────
    // const SUB_STEPS = 6;

    // const stepPhysics = (subDt) => {
    //   if (done) return true;

    //   vy += GRAVITY * subDt; // gravity pulls marble downward every sub-step

    //   const ex = px + vx * subDt;
    //   const ey = py + vy * subDt;

    //   let solidT = Infinity,
    //     solidNx = 0,
    //     solidNy = 1;
    //   let hasSolid = false,
    //     isOuterHit = false,
    //     outerHitSide = -1;

    //   // ── Inner ring walls ───────────────────────────────────────────
    //   // Closed sides bounce the marble. Gap side (openSide) is one-directional:
    //   // lets the marble EXIT outward (inside→outside) but blocks re-entry.
    //   const distFromCenter = Math.sqrt(px * px + py * py);
    //   for (const ring of innerRings) {
    //     const verts = polyVerts(
    //       INNER_SIDES,
    //       ring.radius,
    //       ring.container.rotation,
    //     );
    //     const isInsideThisRing = distFromCenter < ring.radius;
    //     for (let s = 0; s < INNER_SIDES; s++) {
    //       if (s === ring.openSide && isInsideThisRing) continue; // gap — marble exits outward
    //       // gap from outside = solid wall (blocks re-entry into inner ring)
    //       const a = verts[s],
    //         b = verts[(s + 1) % INNER_SIDES];
    //       const t = segIntersect(px, py, ex, ey, a.x, a.y, b.x, b.y);
    //       if (t > 0 && t < solidT) {
    //         solidT = t;
    //         hasSolid = true;
    //         isOuterHit = false;
    //         const n = wallNormal(a, b, vx, vy);
    //         solidNx = n.nx;
    //         solidNy = n.ny;
    //       }
    //     }
    //   }

    //   // ── Outer ring — hitting any side ends the round ────────────────
    //   const outerV = polyVerts(OUTER_SIDES, maxRadius, outerRing.rotation);
    //   for (let s = 0; s < OUTER_SIDES; s++) {
    //     const a = outerV[s],
    //       b = outerV[(s + 1) % OUTER_SIDES];
    //     const t = segIntersect(px, py, ex, ey, a.x, a.y, b.x, b.y);
    //     if (t > 0 && t < solidT) {
    //       solidT = t;
    //       hasSolid = true;
    //       isOuterHit = true;
    //       outerHitSide = s;
    //       const n = wallNormal(a, b, vx, vy);
    //       solidNx = n.nx;
    //       solidNy = n.ny;
    //     }
    //   }

    //   // ── Resolve ────────────────────────────────────────────────────
    //   if (hasSolid) {
    //     const hx = px + (ex - px) * solidT;
    //     const hy = py + (ey - py) * solidT;

    //     if (isOuterHit) {
    //       done = true;
    //       app.ticker.remove(tickFn);
    //       marble.x = hx;
    //       marble.y = hy;
    //       marble.rotation = 0;
    //       highlightBadge(outerHitSide);
    //       finishMarble();
    //       return true;
    //     }

    //     // Reflect velocity off wall, push 1.5 px off surface to avoid re-sticking
    //     const dot2 = 2 * (vx * solidNx + vy * solidNy);
    //     vx = (vx - dot2 * solidNx) * BOUNCE;
    //     vy = (vy - dot2 * solidNy) * BOUNCE;
    //     px = hx + solidNx * 1.5;
    //     py = hy + solidNy * 1.5;
    //     return false;
    //   }

    //   px = ex;
    //   py = ey;
    //   return false;
    // };

    // const tickFn = () => {
    //   if (destroyed || done) {
    //     app.ticker.remove(tickFn);
    //     return;
    //   }

    //   const now = performance.now();
    //   const dt = Math.min(now - lastTime, 20);
    //   lastTime = now;

    //   const subDt = dt / SUB_STEPS;
    //   for (let s = 0; s < SUB_STEPS; s++) {
    //     if (stepPhysics(subDt)) return; // round ended mid-frame
    //   }

    //   marble.x = px;
    //   marble.y = py;
    //   marble.rotation += 0.1;
    // };

    const tickFn = () => {
      if (destroyed || done) {
        app.ticker.remove(tickFn);
        return;
      }

      const dt = app.ticker.deltaMS / 16.666;
      const subDt = dt / SUB_STEPS;

      for (let step = 0; step < SUB_STEPS; step++) {
        if (done) break;

        // Gravity + drag each sub-step
        marblePhysics.vy += GRAVITY * subDt;
        marblePhysics.vx *= AIR_DRAG;
        marblePhysics.vy *= AIR_DRAG;

        marblePhysics.x += marblePhysics.vx * subDt;
        marblePhysics.y += marblePhysics.vy * subDt;

        // Inner ring walls — reflect velocity off wall normal (Nature of Code style)
        for (const ring of innerRings) {
          const segments = getRingSegments(ring);

          for (const seg of segments) {
            const closest = closestPointOnSegment(
              marblePhysics.x,
              marblePhysics.y,
              seg.a.x,
              seg.a.y,
              seg.b.x,
              seg.b.y,
            );

            const dx = marblePhysics.x - closest.x;
            const dy = marblePhysics.y - closest.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 0.0001 || dist >= marblePhysics.radius) continue;

            const nx = dx / dist;
            const ny = dy / dist;

            // Push marble clear of the wall
            marblePhysics.x += nx * (marblePhysics.radius - dist);
            marblePhysics.y += ny * (marblePhysics.radius - dist);

            // Reflect velocity off wall normal: v = v - 2(v·n)n
            const dot = marblePhysics.vx * nx + marblePhysics.vy * ny;
            if (dot < 0) {
              marblePhysics.vx -= 2 * dot * nx;
              marblePhysics.vy -= 2 * dot * ny;
              const now = performance.now();
              if (now - lastWallHitTime > 80) {
                lastWallHitTime = now;
                wallHitAudio.currentTime = 0;
                wallHitAudio.play().catch(() => {});
              }
            }
          }
        }

        // Outer ring — hitting any side ends the round
        const outerSegments = getOuterSegments(maxRadius, outerRing.rotation);

        for (const seg of outerSegments) {
          const closest = closestPointOnSegment(
            marblePhysics.x,
            marblePhysics.y,
            seg.a.x,
            seg.a.y,
            seg.b.x,
            seg.b.y,
          );

          const dx = marblePhysics.x - closest.x;
          const dy = marblePhysics.y - closest.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist >= marblePhysics.radius) continue;

          done = true;
          marble.x = marblePhysics.x;
          marble.y = marblePhysics.y;
          finishMarble(seg.sideIndex);
          app.ticker.remove(tickFn);
          return;
        }
      }

      marble.x = marblePhysics.x;
      marble.y = marblePhysics.y;
      marble.rotation += marblePhysics.vx * 0.03;
    };
    // const tickFn = () => {
    //   if (destroyed || done) {
    //     app.ticker.remove(tickFn);
    //     return;
    //   }

    //   const dt = app.ticker.deltaMS / 16.666;
    //   const subDt = dt / SUB_STEPS;

    //   for (let step = 0; step < SUB_STEPS; step++) {
    //     if (done) break;

    //     marblePhysics.vy += GRAVITY * subDt;
    //     marblePhysics.vx *= AIR_DRAG;
    //     marblePhysics.vy *= AIR_DRAG;
    //     marblePhysics.x += marblePhysics.vx * subDt;
    //     marblePhysics.y += marblePhysics.vy * subDt;

    //     // INNER RINGS
    //     for (const ring of innerRings) {
    //       const segments = getRingSegments(ring);
    //       for (const seg of segments) {
    //         const closest = closestPointOnSegment(
    //           marblePhysics.x,
    //           marblePhysics.y,
    //           seg.a.x,
    //           seg.a.y,
    //           seg.b.x,
    //           seg.b.y,
    //         );
    //         const dx = marblePhysics.x - closest.x;
    //         const dy = marblePhysics.y - closest.y;
    //         const dist = Math.sqrt(dx * dx + dy * dy);
    //         if (dist >= marblePhysics.radius) continue;

    //         const overlap = marblePhysics.radius - dist;
    //         const nx = dx / (dist || 0.0001);
    //         const ny = dy / (dist || 0.0001);

    //         // Always push the marble out of the wall geometrically
    //         marblePhysics.x += nx * overlap;
    //         marblePhysics.y += ny * overlap;

    //         // Only flip velocity if actually moving INTO this wall.
    //         // This is the key fix — without it, a corner segment re-flips
    //         // velocity that's already separating and kills the bounce.
    //         const dot = marblePhysics.vx * nx + marblePhysics.vy * ny;
    //         if (dot < 0) {
    //           const reflected = reflectVelocity(
    //             marblePhysics.vx,
    //             marblePhysics.vy,
    //             nx,
    //             ny,
    //             BOUNCE,
    //           );
    //           marblePhysics.vx = reflected.vx;
    //           marblePhysics.vy = reflected.vy;
    //         }
    //       }
    //     }

    //     // OUTER RING
    //     const outerSegments = getOuterSegments(maxRadius, outerRing.rotation);
    //     for (const seg of outerSegments) {
    //       const closest = closestPointOnSegment(
    //         marblePhysics.x,
    //         marblePhysics.y,
    //         seg.a.x,
    //         seg.a.y,
    //         seg.b.x,
    //         seg.b.y,
    //       );
    //       const dx = marblePhysics.x - closest.x;
    //       const dy = marblePhysics.y - closest.y;
    //       const dist = Math.sqrt(dx * dx + dy * dy);
    //       if (dist >= marblePhysics.radius) continue;

    //       done = true;
    //       highlightBadge(seg.sideIndex);
    //       marble.x = marblePhysics.x;
    //       marble.y = marblePhysics.y;
    //       finishMarble();
    //       app.ticker.remove(tickFn);
    //       return;
    //     }
    //   }

    //   marble.x = marblePhysics.x;
    //   marble.y = marblePhysics.y;
    //   marble.rotation += marblePhysics.vx * 0.03;
    // };

    app.ticker.add(tickFn);
  }

  window.__dropMarble = dropMarble;
  root.on("destroyed", () => {
    window.__dropMarble = null;
  });

  return root;
}

function getPolygonVertices(sides, radius) {
  return Array.from({ length: sides }, (_, i) => {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
}

// Polygon vertices with an extra rotation applied (used by physics)
function polyVerts(sides, radius, rotation) {
  return Array.from({ length: sides }, (_, i) => {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2 + rotation;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
}

// 2-D segment intersection: returns t ∈ (0,1] along p1→p2 where it crosses p3→p4, or -1
function segIntersect(p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y) {
  const d1x = p2x - p1x,
    d1y = p2y - p1y;
  const d2x = p4x - p3x,
    d2y = p4y - p3y;
  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 1e-9) return -1; // parallel
  const t = ((p3x - p1x) * d2y - (p3y - p1y) * d2x) / denom;
  const u = ((p3x - p1x) * d1y - (p3y - p1y) * d1x) / denom;
  return t > 0 && t <= 1 && u >= 0 && u <= 1 ? t : -1;
}

// Outward wall normal for segment a→b, oriented to oppose incoming velocity
function wallNormal(a, b, vx, vy) {
  const wx = b.x - a.x,
    wy = b.y - a.y;
  const len = Math.sqrt(wx * wx + wy * wy) || 1;
  let nx = -wy / len,
    ny = wx / len;
  if (vx * nx + vy * ny > 0) {
    nx = -nx;
    ny = -ny;
  } // flip if wrong side
  return { nx, ny };
}

// Returns { gfx, text } so callers can animate the badge later
function drawBadge(parent, x, y, label, riskColor = 0x4444aa) {
  const gfx = new Graphics();
  gfx.x = x;
  gfx.y = y;
  gfx.circle(0, 0, 22);
  gfx.fill({ color: 0x0a0a1a, alpha: 0.9 });
  gfx.circle(0, 0, 22);
  gfx.stroke({ width: 1.5, color: riskColor, alpha: 0.6 });
  parent.addChild(gfx);

  const text = new Text({
    text: label,
    style: new TextStyle({
      fontFamily: "ClashDisplay, sans-serif",
      fontSize: 13,
      fontWeight: "600",
      fill: riskColor,
      align: "center",
    }),
  });
  text.anchor.set(0.5);
  text.x = x;
  text.y = y;
  parent.addChild(text);

  return { gfx, text };
}

function closestPointOnSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;

  const apx = px - ax;
  const apy = py - ay;

  const abLenSq = abx * abx + aby * aby;

  let t = (apx * abx + apy * aby) / abLenSq;

  t = Math.max(0, Math.min(1, t));

  return {
    x: ax + abx * t,
    y: ay + aby * t,
  };
}

function reflectVelocity(vx, vy, nx, ny, bounce) {
  const dot = vx * nx + vy * ny;
  return {
    vx: (vx - 2 * dot * nx) * bounce,
    vy: (vy - 2 * dot * ny) * bounce,
  };
}

function getRingSegments(ring) {
  const verts = polyVerts(INNER_SIDES, ring.radius, ring.container.rotation);

  const segments = [];

  for (let i = 0; i < INNER_SIDES; i++) {
    if (i === ring.openSide) continue;

    segments.push({
      a: verts[i],
      b: verts[(i + 1) % INNER_SIDES],
    });
  }

  return segments;
}

function getOuterSegments(radius, rotation) {
  const verts = polyVerts(OUTER_SIDES, radius, rotation);

  const segments = [];

  for (let i = 0; i < OUTER_SIDES; i++) {
    segments.push({
      a: verts[i],
      b: verts[(i + 1) % OUTER_SIDES],
      sideIndex: i,
    });
  }

  return segments;
}
