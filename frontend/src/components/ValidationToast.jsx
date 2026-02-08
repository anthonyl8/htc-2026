import { useEffect } from "react";

/**
 * Validation toast notification.
 * Shows warnings when user tries to place interventions in invalid locations.
 */
export default function ValidationToast({ message, type = "warning", onClose }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const isError = type === "error";
  const isWarning = type === "warning";
  const isInfo = type === "info";

  return (
    <div
      style={{
        ...styles.toast,
        ...(isError ? styles.toastError : {}),
        ...(isWarning ? styles.toastWarning : {}),
        ...(isInfo ? styles.toastInfo : {}),
      }}
    >
      <span style={styles.icon}>
        {isError ? "⚠️" : isWarning ? "⚡" : "ℹ️"}
      </span>
      <span style={styles.message}>{message}</span>
      <button onClick={onClose} style={styles.closeBtn}>
        ✕
      </button>
    </div>
  );
}

const styles = {
  toast: {
    position: "fixed",
    top: "80px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 20px",
    borderRadius: "12px",
    border: "1px solid",
    backdropFilter: "blur(12px)",
    zIndex: 2000,
    maxWidth: "500px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    animation: "slideDown 0.3s ease-out",
  },
  toastError: {
    background: "rgba(40,20,20,0.95)",
    borderColor: "rgba(239,68,68,0.5)",
    color: "#fca5a5",
  },
  toastWarning: {
    background: "rgba(40,35,20,0.95)",
    borderColor: "rgba(251,191,36,0.5)",
    color: "#fde047",
  },
  toastInfo: {
    background: "rgba(20,35,40,0.95)",
    borderColor: "rgba(96,165,250,0.5)",
    color: "#93c5fd",
  },
  icon: {
    fontSize: "1.2rem",
    flexShrink: 0,
  },
  message: {
    flex: 1,
    fontSize: "0.85rem",
    fontWeight: 500,
    lineHeight: 1.4,
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "inherit",
    fontSize: "1rem",
    cursor: "pointer",
    opacity: 0.7,
    padding: "0 4px",
    outline: "none",
  },
};
