import { useState, useRef, useCallback, useEffect } from "react";
import { generateVision } from "../services/api";

/**
 * "Future Vision" Generator — Gemini AI split-screen.
 * Left: Current satellite view. Right: AI-generated green future.
 * Draggable divider for comparison.
 */
export default function FutureVision({ isOpen, onClose, viewport, treeCount }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  // Generate vision when opened
  useEffect(() => {
    if (!isOpen || !viewport) return;
    if (result) return; // Don't re-generate if already have result

    setLoading(true);
    setError(null);
    generateVision(viewport.lat, viewport.lng, viewport.zoom, treeCount)
      .then((data) => {
        setResult(data);
      })
      .catch((err) => {
        setError(err.message || "Vision generation failed");
      })
      .finally(() => setLoading(false));
  }, [isOpen, viewport, treeCount, result]);

  const handleRegenerate = useCallback(() => {
    if (!viewport) return;
    setResult(null);
    setLoading(true);
    setError(null);
    generateVision(viewport.lat, viewport.lng, viewport.zoom, treeCount)
      .then((data) => setResult(data))
      .catch((err) => setError(err.message || "Vision generation failed"))
      .finally(() => setLoading(false));
  }, [viewport, treeCount]);

  const handleClose = useCallback(() => {
    setResult(null);
    setError(null);
    setSliderPos(50);
    onClose();
  }, [onClose]);

  // Slider drag handling
  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      setSliderPos(Math.max(5, Math.min(95, x)));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.title}>📸 Future Vision — AI Green Transformation</span>
          <div style={styles.headerActions}>
            {result && (
              <button onClick={handleRegenerate} style={styles.regenBtn}>
                🔄 Regenerate
              </button>
            )}
            <button onClick={handleClose} style={styles.closeBtn}>
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={styles.contentArea}>
          {loading && (
            <div style={styles.loadingContainer}>
              <div style={styles.spinner} />
              <span style={styles.loadingText}>
                Gemini is imagining your green future...
              </span>
              <span style={styles.loadingSubtext}>
                This may take 10–30 seconds
              </span>
            </div>
          )}

          {error && !loading && (
            <div style={styles.errorContainer}>
              <span style={styles.errorIcon}>⚠️</span>
              <span style={styles.errorText}>{error}</span>
              <button onClick={handleRegenerate} style={styles.retryBtn}>
                Try Again
              </button>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Split-screen comparison */}
              {result.after_image ? (
                <div
                  ref={containerRef}
                  style={styles.comparisonContainer}
                >
                  {/* After image (full width, clipped) */}
                  <div style={styles.afterLayer}>
                    <img
                      src={`data:image/png;base64,${result.after_image}`}
                      alt="AI Vision"
                      style={styles.compImage}
                      draggable={false}
                    />
                    <div style={styles.imageLabel}>AFTER — AI Green Vision</div>
                  </div>

                  {/* Before image (clipped by slider) */}
                  <div
                    style={{
                      ...styles.beforeLayer,
                      clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
                    }}
                  >
                    <img
                      src={`data:image/png;base64,${result.before_image}`}
                      alt="Current"
                      style={styles.compImage}
                      draggable={false}
                    />
                    <div style={styles.imageLabel}>BEFORE — Current View</div>
                  </div>

                  {/* Divider handle */}
                  <div
                    style={{
                      ...styles.divider,
                      left: `${sliderPos}%`,
                    }}
                    onMouseDown={handleMouseDown}
                  >
                    <div style={styles.dividerHandle}>⟺</div>
                  </div>
                </div>
              ) : (
                /* No after image — show before with text overlay */
                <div style={styles.singleImageContainer}>
                  <img
                    src={`data:image/png;base64,${result.before_image}`}
                    alt="Satellite View"
                    style={styles.compImage}
                  />
                  <div style={styles.noImageOverlay}>
                    Image generation unavailable — see analysis below
                  </div>
                </div>
              )}

              {/* Analysis text */}
              {result.analysis && (
                <div style={styles.analysisSection}>
                  <span style={styles.analysisTitle}>🧠 AI Analysis</span>
                  <div style={styles.analysisText}>
                    {result.analysis}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerInfo}>
            {treeCount > 0 ? `${treeCount} trees planned` : "No trees planted yet"}
          </span>
          <button onClick={handleClose} style={styles.doneBtn}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2500,
    backdropFilter: "blur(4px)",
  },
  panel: {
    background: "linear-gradient(135deg, #1a2e24 0%, #1a3028 100%)",
    borderRadius: "16px",
    width: "min(95vw, 1000px)",
    maxHeight: "90vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    border: "1px solid rgba(74,222,128,0.3)",
    boxShadow: "0 25px 60px rgba(74,222,128,0.2), 0 0 40px rgba(74,222,128,0.1)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(26,26,46,0.95)",
  },
  title: {
    color: "#4ade80",
    fontSize: "0.95rem",
    fontWeight: 700,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  regenBtn: {
    padding: "6px 12px",
    background: "rgba(74,222,128,0.15)",
    color: "#4ade80",
    border: "1px solid rgba(74,222,128,0.3)",
    borderRadius: "8px",
    fontSize: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
    outline: "none",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#888",
    fontSize: "1.4rem",
    cursor: "pointer",
    lineHeight: 1,
    outline: "none",
  },
  contentArea: {
    flex: 1,
    overflow: "auto",
    minHeight: "300px",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 20px",
    gap: "16px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid rgba(74,222,128,0.2)",
    borderTopColor: "#4ade80",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    color: "#ccc",
    fontSize: "1rem",
    fontWeight: 600,
  },
  loadingSubtext: {
    color: "#666",
    fontSize: "0.8rem",
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    gap: "12px",
  },
  errorIcon: { fontSize: "2rem" },
  errorText: { color: "#ef4444", fontSize: "0.9rem", textAlign: "center" },
  retryBtn: {
    padding: "8px 20px",
    background: "rgba(239,68,68,0.15)",
    color: "#ef4444",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: "8px",
    fontSize: "0.82rem",
    fontWeight: 600,
    cursor: "pointer",
    outline: "none",
  },
  comparisonContainer: {
    position: "relative",
    width: "100%",
    height: "450px",
    overflow: "hidden",
    cursor: "col-resize",
    userSelect: "none",
  },
  afterLayer: {
    position: "absolute",
    inset: 0,
  },
  beforeLayer: {
    position: "absolute",
    inset: 0,
    zIndex: 2,
  },
  compImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    pointerEvents: "none",
  },
  imageLabel: {
    position: "absolute",
    bottom: "12px",
    left: "12px",
    background: "rgba(0,0,0,0.7)",
    color: "#fff",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "0.72rem",
    fontWeight: 600,
    letterSpacing: "0.3px",
  },
  divider: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "4px",
    background: "#fff",
    zIndex: 5,
    transform: "translateX(-50%)",
    cursor: "col-resize",
    boxShadow: "0 0 10px rgba(0,0,0,0.5)",
  },
  dividerHandle: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#fff",
    color: "#333",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: 700,
    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
  },
  singleImageContainer: {
    position: "relative",
    width: "100%",
    height: "400px",
    overflow: "hidden",
  },
  noImageOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "rgba(0,0,0,0.7)",
    color: "#fbbf24",
    padding: "10px 20px",
    borderRadius: "8px",
    fontSize: "0.85rem",
    fontWeight: 600,
    textAlign: "center",
  },
  analysisSection: {
    padding: "16px 20px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },
  analysisTitle: {
    display: "block",
    color: "#4ade80",
    fontSize: "0.85rem",
    fontWeight: 700,
    marginBottom: "8px",
  },
  analysisText: {
    color: "#ccc",
    fontSize: "0.82rem",
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
    maxHeight: "200px",
    overflowY: "auto",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(26,26,46,0.95)",
  },
  footerInfo: {
    color: "#888",
    fontSize: "0.78rem",
  },
  doneBtn: {
    padding: "8px 20px",
    background: "rgba(74,222,128,0.9)",
    color: "#000",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.82rem",
    fontWeight: 700,
    cursor: "pointer",
    outline: "none",
  },
};
