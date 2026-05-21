import { useEffect, useRef } from "react";
import { Application } from "pixi.js";

import { createFlushScreen } from "./flushGame";

import BetControls from "../screens/bet-controls/index";
import RiskSelector from "../screens/RiskSelector";

export default function FlushGame() {
  const pixiRef = useRef(null);

  useEffect(() => {
    const app = new Application({
      resizeTo: window,
      backgroundAlpha: 0,
    });

    pixiRef.current.appendChild(app.view);

    let screen;

    (async () => {
      screen = await createFlushScreen(app);
      app.stage.addChild(screen);
    })();

    return () => {
      app.destroy(true, true);
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* PIXI CANVAS */}
      <div ref={pixiRef} className="w-full h-full" />

      {/* REACT UI OVERLAY */}
      <div className="absolute inset-0 pointer-events-none">
        {/* LEFT */}
        <div className="absolute bottom-8 left-8 pointer-events-auto">
          <RiskSelector />
        </div>

        {/* RIGHT */}
        <div className="absolute bottom-8 right-8 pointer-events-auto">
          <BetControls />
        </div>
      </div>
    </div>
  );
}
