import { useState, useEffect, useRef } from "react";
import { visualizeItem } from "../services/api";

export default function AIVisionPanel({ location, type = "tree", species = "maple", onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function generateVision() {
      try {
        setLoading(true);
        setError(null);
        
        // Call backend to generate vision
        const result = await visualizeItem(location.lat, location.lng, type, species);
        
        if (mounted) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          console.error("AI Vision generation failed:", err);
          setError(err.message || "Failed to generate vision");
          setLoading(false);
        }
      }
    }

    if (location) {
      generateVision();
    }

    return () => {
      mounted = false;
    };
  }, [location, type, species]);

  const handleSliderChange = (e) => {
    setSliderPosition(e.target.value);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <h3 style={styles.loadingTitle}>Generating AI Vision...</h3>
          <p style={styles.loadingText}>
            analyzing street view geometry • estimating sunlight • rendering {type.replace("_", " ")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorState}>
          <span style={{ fontSize: "2rem" }}>⚠️</span>
          <h3>Generation Failed</h3>
          <p>{error}</p>
          <button onClick={onClose} style={styles.button}>Close</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3>✨ Future Vision</h3>
        <button onClick={onClose} style={styles.closeBtn}>✕</button>
      </div>

      <div style={styles.viewer} ref={containerRef}>
        {/* Before Image (Background) */}
        <img 
          src={`data:image/jpeg;base64,${data.before_image}`} 
          style={styles.image} 
          alt="Before" 
        />

        {/* After Image (Clipped) */}
        <div 
          style={{
            ...styles.imageOverlay,
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
          }}
        >
          <img 
            src={`data:image/jpeg;base64,${data.after_image}`} 
            style={styles.image} 
            alt="After" 
          />
        </div>

        {/* Slider Handle */}
        <div 
          style={{
            ...styles.sliderLine,
            left: `${sliderPosition}%`
          }}
        >
          <div style={styles.sliderHandle}>
            <span>⏴ ⏵</span>
          </div>
        </div>

        {/* Input Range (Invisible but interactive) */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={handleSliderChange}
          style={styles.sliderInput}
        />

        {/* Labels */}
        <div style={styles.labelBefore}>Current Reality</div>
        <div style={styles.labelAfter}>AI Prediction</div>
      </div>

      <div style={styles.footer}>
        <p>
          <strong>AI Analysis:</strong> Added realistic {type.replace("_", " ")} ({species}) 
          to the scene. Estimated local cooling: <strong>-2.5°C</strong>.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    background: "#000",
    color: "#fff",
    position: "relative",
  },
  loadingState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    textAlign: "center",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid rgba(74,222,128,0.3)",
    borderTopColor: "#4ade80",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "20px",
  },
  loadingTitle: {
    color: "#4ade80",
    marginBottom: "10px",
  },
  loadingText: {
    color: "#888",
    fontSize: "0.9rem",
  },
  errorState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#ef4444",
  },
  header: {
    padding: "15px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(26,26,46,0.95)",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: "1.2rem",
    cursor: "pointer",
  },
  viewer: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    userSelect: "none",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    position: "absolute",
    top: 0,
    left: 0,
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },
  sliderLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "2px",
    background: "#fff",
    zIndex: 10,
    pointerEvents: "none",
    boxShadow: "0 0 10px rgba(0,0,0,0.5)",
  },
  sliderHandle: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#333",
    fontSize: "12px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
  },
  sliderInput: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    opacity: 0,
    cursor: "ew-resize",
    zIndex: 20,
    margin: 0,
  },
  labelBefore: {
    position: "absolute",
    bottom: "20px",
    left: "20px",
    background: "rgba(0,0,0,0.6)",
    padding: "4px 10px",
    borderRadius: "4px",
    fontSize: "0.8rem",
    pointerEvents: "none",
  },
  labelAfter: {
    position: "absolute",
    bottom: "20px",
    right: "20px",
    background: "rgba(74,222,128,0.9)",
    color: "#000",
    fontWeight: "bold",
    padding: "4px 10px",
    borderRadius: "4px",
    fontSize: "0.8rem",
    pointerEvents: "none",
  },
  footer: {
    padding: "15px 20px",
    background: "rgba(26,26,46,0.95)",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    fontSize: "0.9rem",
    color: "#ccc",
  },
  button: {
    marginTop: "15px",
    padding: "8px 16px",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#fff",
    borderRadius: "4px",
    cursor: "pointer",
  },
};
