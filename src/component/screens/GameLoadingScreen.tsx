import styles from "./GameLoadingScreen.module.css";
import { ASSETS } from "../../lib/constants";

export default function GameLoadingScreen() {
  return (
    <div className={styles.wrapper}>
      <img src={ASSETS.BACKGROUND_IMG} alt="" className={styles.bg} />
    </div>
  );
}
