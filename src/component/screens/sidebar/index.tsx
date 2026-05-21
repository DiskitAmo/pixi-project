// SidebarUI.jsx
import { useState } from "react";
import styles from "./styles.module.css";
import {
  Menu,
  X,
  Info,
  Volume2,
  Music2,
  Settings,
  VolumeOff,
} from "lucide-react";

interface SidebarProps {
  onToggleMute: () => void;
}

export default function SidebarUI({ onToggleMute }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [isMusicOn, setIsMusicOn] = useState(true);

  function handleMusicToggle() {
    onToggleMute();
    setIsMusicOn((prev) => !prev);
  }

  return (
    <div
      className={`${styles.sidebarWrapper} ${infoOpen ? styles.active : ""}`}
    >
      {/* Floating Buttons */}
      {!open && (
        <div className={styles.floatingButtons}>
          <button className={styles.circleButton} onClick={() => setOpen(true)}>
            <Menu size={30} />
          </button>

          <button
            className={styles.circleButton}
            onClick={() => setInfoOpen(true)}
          >
            <Info size={28} />
          </button>
        </div>
      )}

      {/* Sidebar */}
      <div className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <div className={styles.closeContainer}>
          <button
            className={styles.circleButton}
            onClick={() => setOpen(false)}
          >
            <X size={28} />
          </button>
        </div>

        {/* Menu Items */}
        <div className={styles.menuItems}>
          <SidebarItem
            icon={isMusicOn ? <Volume2 size={34} /> : <VolumeOff size={34} />}
            label="Soundfx"
            onclick={handleMusicToggle}
          />
          <SidebarItem icon={<Music2 size={34} />} label="Music" />
          <SidebarItem icon={<Settings size={34} />} label="Settings" />
        </div>
      </div>

      {/* Dark Overlay when modal opens */}
      {infoOpen && (
        <div className={styles.overlay} onClick={() => setInfoOpen(false)} />
      )}
      {/* INFO MODAL */}
      {infoOpen && (
        <div className={styles.modalWrapper}>
          <div className={styles.modal}>
            {/* Close */}
            <button
              className={styles.modalClose}
              onClick={() => setInfoOpen(false)}
            >
              <X size={26} />
            </button>

            {/* Title */}
            <h2 className={styles.modalTitle}>ROYAL FLUSH</h2>

            {/* Section */}
            <h3 className={styles.sectionTitle}>How to play</h3>

            <p className={styles.modalText}>
              Lorem ipsum dolor sit amet consectetur. Nulla convallis sed quam
              quibusdam consectetur element vitae. Velit in placerat auctor sit
              placerat. Neque aliqu bibendum ultrices sed viverra nec. Nam. Amet
              sodales lectus mi dis lectus velit. Metus nulla lorem aliquet ac
              vestibulum ultrices nulla lectus proin. Egestas pellentesque
              fermentum sagittis purus nulla orci lectus dignissim gravida.
              Dictumst nulla magna lacus ac elit purus mi adipiscing. Vitae
              habitasse vitae arcu et. Non gravida tristique ornare pharetra sit
              eget consequat.
            </p>

            <p className={styles.modalText}>
              Enim mollis commodo magna est dellend quis enim bandit. Placerat
              at sed ultrices auctor ultrices mi quis. Commodo faucibus placerat
              turpis ligula. Integer quis vel amet tellus venenatis semper
              purus. Tellus ullamcorper pellentesque at lacus a volutpat tempus
              tellus auctor sit cursus diam.
            </p>

            {/* Section */}
            <h3 className={styles.sectionTitle}>Payouts</h3>

            <p className={styles.modalText}>
              Placerat eu fermentum donec a duple aliquam ord diam scelerisque.
              Integer neque cursus arcu aliquam non proin molis. Tortor nibh sit
              sed facilisis a bibendum. Venenatis vero et lectus ac tincidunt
              nullam. Porttitor at mi porttitor auctor aliquet. Nisi dui senatus
              ultrices neque libero dictum. Purus sed auctor scelerisque orci.
              Armet consequat elit suspendisse aliquam in neque lectus nunc.
              Cras nisl proin cras amet ululitant. Model iaculis
            </p>
            <p className={styles.modalText}>
              Euismod facilisi leo facilisi dictum sit. Sapien tempus facilisi
              aliquet duis at sed posuere sit pellentesque. Voulpat arcu vitae
              nulla adipiscing. Viverra quis tellus ullamcorper purus pretibus
              et magnis. Feugiat bibendum aliydet velit a met neque. Neque
              pellentesque turpis donec tristique quis eupo ultrices aliquet
              odio. Tristunt malesuada neque pretium anmibula ornare venenatis
              rutrum sit. Bibendum iuris cursus lorem.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  onclick,
}: {
  icon: React.ReactNode;
  label: string;
  onclick?: () => void;
}) {
  return (
    <button className={styles.menuItem} onClick={onclick}>
      <div>{icon}</div>
      <span>{label}</span>
    </button>
  );
}
