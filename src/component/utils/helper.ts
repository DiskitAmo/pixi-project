import { Graphics } from "pixi.js";
import type { Application, Container, Sprite } from "pixi.js";
import { FLUSHING_ITEM_SOURCES } from "../../lib/constants";
import type { RiskLevel } from "../../store/useRoyalFlushStore";

export function resizeBackground(app: Application, bg: Sprite | undefined) {
  if (!bg) return;
  if (!bg.texture || !bg.texture?.source) return;
  const cw = app.screen.width;
  const ch = app.screen.height;
  const imgRatio = bg?.texture?.width / bg?.texture?.height;
  const screenRatio = cw / ch;

  let renderW, renderH, renderX, renderY;

  if (screenRatio > imgRatio) {
    renderW = cw;
    renderH = cw / imgRatio;
    renderX = 0;
    renderY = (ch - renderH) / 2;
  } else {
    renderH = ch;
    renderW = ch * imgRatio;
    renderY = 0;
    renderX = (cw - renderW) / 2;
  }
  bg.width = renderW;
  bg.height = renderH;
  bg.x = renderX;
  bg.y = renderY;
}

export function getRandomFlushObject(): string {
  const randomIndex = Math.floor(Math.random() * FLUSHING_ITEM_SOURCES.length);
  return FLUSHING_ITEM_SOURCES[randomIndex];
}

export function getParticleColor(multiplier: number): number {
  if (multiplier < 3) return 0xa855f7;
  if (multiplier < 25) return 0x3b82f6;
  return 0xeab308;
}

export function createSprinkleEffect(
  app: Application,
  container: Container,
  x: number,
  y: number,
  color = 0x3b82f6,
): void {
  const particles: (Graphics & { vx: number; vy: number })[] = [];

  for (let i = 0; i < 20; i++) {
    const particle = new Graphics() as Graphics & { vx: number; vy: number };

    particle.beginFill(color);
    particle.drawCircle(0, 0, Math.random() * 4 + 2);
    particle.endFill();

    particle.x = x;
    particle.y = y;
    particle.vx = (Math.random() - 0.5) * 12;
    particle.vy = (Math.random() - 0.5) * 12;
    particle.alpha = 1;
    particle.zIndex = 1009;

    container.addChild(particle);
    particles.push(particle);
  }

  const tickerFn = () => {
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.03;
      p.scale.x *= 0.98;
      p.scale.y *= 0.98;
    });

    if (particles[0]?.alpha <= 0) {
      particles.forEach((p) => {
        container.removeChild(p);
        p.destroy();
      });
      app.ticker.remove(tickerFn);
    }
  };

  app.ticker.add(tickerFn);
}

export function generateOutcome(currentRisk: RiskLevel): number {
  const r = Math.random();

  if (currentRisk === "low") {
    // Low Risk: max 50x
    if (r < 0.89) return parseFloat((Math.random() * 2.5).toFixed(2));           // 0–2.5x   (no animation)
    if (r < 0.97) return parseFloat((Math.random() * (7 - 3.5) + 3.5).toFixed(2)); // 3.5–7x  (pee)
    return parseFloat((Math.random() * (50 - 10) + 10).toFixed(2));              // 10–50x   (poo)
  } else if (currentRisk === "high") {
    // High Risk: max 250x (higher variance)
    if (r < 0.93)  return parseFloat((Math.random() * 5).toFixed(2));                    // 0–5x    (no animation)
    if (r < 0.97)  return parseFloat((Math.random() * (12.5 - 7.5) + 7.5).toFixed(2));  // 7.5–12.5x (pee)
    if (r < 0.99)  return parseFloat((Math.random() * (35 - 20) + 20).toFixed(2));       // 20–35x  (poo)
    if (r < 0.998) return parseFloat((Math.random() * (80 - 50) + 50).toFixed(2));       // 50–80x  (phone)
    return parseFloat((Math.random() * (250 - 125) + 125).toFixed(2));                   // 125–250x (plunger)
  } else {
    // Medium Risk: max 100x (balanced)
    if (r < 0.87)  return parseFloat((Math.random() * 3).toFixed(2));                  // 0–3x    (no animation)
    if (r < 0.96)  return parseFloat((Math.random() * (7 - 5) + 5).toFixed(2));        // 5–7x    (pee)
    if (r < 0.99)  return parseFloat((Math.random() * (20 - 10) + 10).toFixed(2));     // 10–20x  (poo)
    if (r < 0.999) return parseFloat((Math.random() * (50 - 30) + 30).toFixed(2));     // 30–50x  (phone)
    return parseFloat((Math.random() * (100 - 70) + 70).toFixed(2));                   // 70–100x (plunger)
  }
}
