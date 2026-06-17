import { Container, Sprite, Assets, Graphics } from "pixi.js";
import { ASSETS } from "../lib/constants";

export function createVideoScreen(app, onVideoEnd) {
  const container = new Container();

  // Immediate black bg — visible the instant caller adds container to stage
  const bg = new Graphics();
  bg.rect(0, 0, app.screen.width, app.screen.height).fill(0x000000);
  container.addChild(bg);

  const ready = (async () => {
    const [texture] = await Promise.all([
      Assets.load({
        src: ASSETS.INTRO_VIDEO,
        loadParser: "loadVideo",
        data: { muted: true, playsinline: true, autoPlay: false, loop: false },
      }),
      Assets.load(ASSETS.LOGO_SVG),
    ]);

    if (!texture) {
      console.error("Video texture failed to load");
      return;
    }

    container.removeChild(bg);
    bg.destroy();

    const videoSprite = new Sprite(texture);
    container.addChild(videoSprite);

    const video = texture.source.resource;

    function resizeVideo() {
      const screenW = app.screen.width;
      const screenH = app.screen.height;
      const videoW = video.videoWidth || 1920;
      const videoH = video.videoHeight || 1080;
      const ratio = videoW / videoH;
      const screenRatio = screenW / screenH;
      let width, height;
      if (screenRatio > ratio) {
        width = screenW;
        height = screenW / ratio;
      } else {
        height = screenH;
        width = screenH * ratio;
      }
      videoSprite.width = width;
      videoSprite.height = height;
      videoSprite.x = (screenW - width) / 2;
      videoSprite.y = (screenH - height) / 2;
    }

    resizeVideo();

    const logo = new Sprite(Assets.get(ASSETS.LOGO_SVG));
    logo.anchor.set(0.5);
    logo.scale.set(0.4);
    logo.x = app.screen.width / 2;
    logo.y = app.screen.height / 2 - 250;
    container.addChild(logo);

    video.play().catch((err) => console.warn("Autoplay blocked:", err));

    video.onended = () => {
      container.alpha = 1;
      app.ticker.add(function fade() {
        container.alpha -= 0.05;
        if (container.alpha <= 0) {
          app.ticker.remove(fade);
          if (typeof onVideoEnd === "function") onVideoEnd();
        }
      });
    };
  })();

  return { container, ready };
}
