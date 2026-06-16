import {
  CloseIcon,
  EnableSoundIcon,
  InfiniteIcon,
  Info,
  LeftArrow,
  Menu,
  MinsIcon,
  MusicIcon,
  PlayIcon,
  PlusIcon,
  RightArrow,
  SettingsIcon,
  SoundIcon,
} from "./Icons";
import type { IconType } from "./types";

const iconMap = {
  menu: {
    icon: Menu,
    viewBox: "0 0 22 22",
    width: 22,
    height: 22,
  },
  info: {
    icon: Info,
    viewBox: "0 0 9 16",
    width: 9,
    height: 16,
  },
  leftArrow: {
    icon: LeftArrow,
    viewBox: "0 0 20 20",
    width: 20,
    height: 20,
  },
  rightArrow: {
    icon: RightArrow,
    viewBox: "0 0 20 20",
    width: 20,
    height: 20,
  },
  playIcon: {
    icon: PlayIcon,
    viewBox: "0 0 14 11",
    width: 14,
    height: 11,
  },
  plusIcon: {
    icon: PlusIcon,
    viewBox: "0 0 20 20",
    width: 20,
    height: 20,
  },

  minsIcon: {
    icon: MinsIcon,
    viewBox: "0 0 20 3",
    width: 20,
    height: 3,
  },
  closeIcon: {
    icon: CloseIcon,
    viewBox: "0 0 11 11",
    width: 11,
    height: 11,
  },
  infiniteIcon: {
    icon: InfiniteIcon,
    viewBox: "0 0 24 24",
    width: 24,
    height: 24,
  },
  soundIcon: {
    icon: SoundIcon,
    viewBox: "0 0 24 22",
    width: 24,
    height: 22,
  },
  enableSoundIcon: {
    icon: EnableSoundIcon,
    viewBox: "0 0 24 22",
    width: 24,
    height: 22,
  },

  musicIcon: {
    icon: MusicIcon,
    viewBox: "0 0 32 32",
    width: 32,
    height: 32,
  },
  settingsIcon: {
    icon: SettingsIcon,
    viewBox: "0 0 32 32",
    width: 32,
    height: 32,
  },
};

interface SVGIconProps {
  name: IconType;
  customClass?: string;
  style?: React.CSSProperties;
}

const SVGIcon = ({ name, customClass, style }: SVGIconProps) => {
  const iconData = iconMap[name];
  if (!iconData) {
    return null;
  }
  const { icon, viewBox, width, height } = iconData;

  return (
    <svg
      viewBox={viewBox}
      className={customClass}
      style={style}
      width={width}
      height={height}
    >
      {icon}
    </svg>
  );
};

export default SVGIcon;
