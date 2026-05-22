import styles from "./Logo.module.css";

interface LogoProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function Logo({ className, style }: LogoProps) {
  return (
    <img
      src="/assets/logo/logo1.svg"
      alt="Game Logo"
      className={`${styles.logo}${className ? ` ${className}` : ""}`}
      style={style}
    />
  );
}
