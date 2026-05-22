import { Container, Sprite, Assets } from "pixi.js";

export async function createVideoScreen(app, onVideoEnd) {
  const container = new Container();

  //  Pixi v8 correct way to load video + preload logo in parallel
  const [texture] = await Promise.all([
    Assets.load({
      src: "/assets/intro.mp4",
      loadParser: "loadVideo",
      data: {
        muted: true,
        playsinline: true,
        autoPlay: false,
        loop: false,
      },
    }),
    Assets.load("/assets/logo/logo1.svg"),
  ]);

  if (!texture) {
    console.error(
      "Video texture failed to load — check /assets/intro.mp4 exists",
    );
    return container;
  }

  const videoSprite = new Sprite(texture);
  container.addChild(videoSprite);

  //  Get the raw <video> element from texture source
  const video = texture.source.resource;

  function resizeVideo() {
    // if (
    //   !video ||
    //   !videoSprite ||
    //   !videoSprite.texture ||
    //   !videoSprite.texture.baseTexture ||
    //   !video.videoWidth ||
    //   !video.videoHeight
    // ) {
    //   return;
    // }

    const screenW = app.screen.width;
    const screenH = app.screen.height;
    const videoW = video.videoWidth || 1920;
    const videoH = video.videoHeight || 1080;
    const videoRatio = videoW / videoH;
    const screenRatio = screenW / screenH;
    let width, height;
    if (screenRatio > videoRatio) {
      width = screenW;
      height = screenW / videoRatio;
    } else {
      height = screenH;
      width = screenH * videoRatio;
    }
    videoSprite.width = width;
    videoSprite.height = height;
    videoSprite.x = (screenW - width) / 2;
    videoSprite.y = (screenH - height) / 2;
  }

  resizeVideo();

  // Logo
  const logo = Sprite.from("/assets/logo/logo1.svg");
  logo.anchor.set(0.5);
  logo.scale.set(0.6);
  logo.x = app.screen.width / 2;
  logo.y = app.screen.height / 2 - 80;
  container.addChild(logo);

  // video.addEventListener("loadeddata", () => {
  //   resizeVideo();
  // });

  window.addEventListener("resize", () => {
    // resizeVideo();
    // if (logo) {
    //   logo.x = app.screen.width / 2;
    //   logo.y = app.screen.height / 2;
    // }
  });

  //  Play both together
  video.play().catch((err) => console.warn("Autoplay blocked:", err));
  // music.play().catch((err) => console.warn("Music autoplay blocked:", err));

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

  return container;
}
