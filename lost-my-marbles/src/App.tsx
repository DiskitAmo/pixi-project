import { createElement } from "react";
import { createRoot } from "react-dom/client";
import GameWrapper from "./component/GameWrapper";

interface AppProps {
  onStart: () => void;
}

export default function App({ onStart }: AppProps) {
  return <GameWrapper onStart={onStart} />;
}

export function mountApp(onStart: () => void): void {
  const container = document.getElementById("react-root");
  if (!container) return;

  const root = createRoot(container);
  root.render(createElement(App, { onStart }));
}
