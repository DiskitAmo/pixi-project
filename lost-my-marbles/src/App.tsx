import { createElement } from "react";
import { createRoot } from "react-dom/client";
import GameWrapper from "./component/GameWrapper";

interface AppProps {
  onStart: () => void;
  onRegisterGameStart: (fn: () => void) => void;
}

export default function App({ onStart, onRegisterGameStart }: AppProps) {
  return <GameWrapper onStart={onStart} onRegisterGameStart={onRegisterGameStart} />;
}

export function mountApp(
  onStart: () => void,
  onRegisterGameStart: (fn: () => void) => void,
): void {
  const container = document.getElementById("react-root");
  if (!container) return;

  const root = createRoot(container);
  root.render(createElement(App, { onStart, onRegisterGameStart }));
}
