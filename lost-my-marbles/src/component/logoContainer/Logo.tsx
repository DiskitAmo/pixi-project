import styles from "./Logo.module.css";
import { ASSETS } from "../../lib/constants";

interface LogoProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function Logo({ className, style }: LogoProps) {
  return (
    <img
      src={ASSETS.LOGO_SVG}
      alt="Game Logo"
      className={`${styles.logo}${className ? ` ${className}` : ""}`}
      style={style}
    />
  );
}
