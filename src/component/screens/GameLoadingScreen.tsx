import styles from "./GameLoadingScreen.module.css";

export default function GameLoadingScreen() {
  return (
    <div className={styles.wrapper}>
      <img
        src="/assets/loading-screen/background-img.webp"
        alt=""
        className={styles.bg}
      />
    </div>
  );
}
