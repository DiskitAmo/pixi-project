import BetControls from "./component/screens/bet-controls";
import RiskSelector from "./component/screens/riskSelector";
import Sidebar from "./component/screens/sidebar";
import WinFeed from "./component/screens/win-feed/WinFeed";

interface UIOverlayProps {
  onBetClick: (betAmount: number) => void;
  onAutoplayClick: () => void;
  onToggleMute: () => void;
}

export default function UIOverlay({
  onBetClick,
  onAutoplayClick,
  onToggleMute,
}: UIOverlayProps) {
  return (
    <div style={{ position: "absolute", width: "100%", height: "100%" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          pointerEvents: "auto",
        }}
      >
        <Sidebar onToggleMute={onToggleMute} />
      </div>

      <div
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          zIndex: 200,
        }}
      >
        <WinFeed />
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "2rem",
          left: "2rem",
          pointerEvents: "auto",
          zIndex: 100,
        }}
      >
        <RiskSelector />
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "2rem",
          right: "2rem",
          pointerEvents: "auto",
          zIndex: 100,
        }}
      >
        <BetControls
          onBetClick={onBetClick}
          onAutoplayClick={onAutoplayClick}
        />
      </div>
    </div>
  );
}
