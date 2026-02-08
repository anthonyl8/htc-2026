import { useEffect, useRef, useMemo } from "react";

/**
 * Street View panel that opens when user clicks a location.
 * Uses native Google Maps Street View Service.
 * Memoized to prevent unnecessary re-renders when trees update.
 */
export default function StreetViewPanel({
  isOpen,
  onClose,
  location,
  trees,
  activeDataLayer,
  layerData,
}) {
  const containerRef = useRef(null);
  const panoramaRef = useRef(null);
  const locationKeyRef = useRef(null);

  // Early returns AFTER hooks (rules of hooks)
  const locationKey = location ? `${location.lat.toFixed(6)},${location.lng.toFixed(6)}` : null;

  // Get nearby trees (within 50m) - memoized to prevent recalc on every render
  const nearbyTrees = useMemo(() => {
    if (!location || !trees) return [];
    try {
      return trees.filter((tree) => {
        if (!tree) return false;
        const treeLat = tree.position?.[1] ?? tree.lat ?? 0;
        const treeLon = tree.position?.[0] ?? tree.lon ?? 0;
        const dist = getDistance(location.lat, location.lng, treeLat, treeLon);
        return dist < 0.0005; // ~50m radius
      });
    } catch (err) {
      console.error("Error calculating nearby trees:", err);
      return [];
    }
  }, [trees, location]);

  // Get active layer info for this location - memoized
  const layerInfo = useMemo(() => {
    if (!location) return null;
    try {
      return getLayerInfoForLocation(location, activeDataLayer, layerData);
    } catch (err) {
      console.error("Error getting layer info:", err);
      return null;
    }
  }, [location, activeDataLayer, layerData]);

  // Initialize Street View ONLY when location changes
  useEffect(() => {
    if (!isOpen || !containerRef.current || !locationKey || !location) {
      // Clear panorama when closed
      if (!isOpen && panoramaRef.current) {
        try {
          panoramaRef.current.setVisible(false);
        } catch (err) {
          console.warn("Error hiding panorama:", err);
        }
      }
      return;
    }
    
    // Skip if same location
    if (locationKeyRef.current === locationKey && panoramaRef.current) {
      // Same location, but make sure panorama is visible
      try {
        panoramaRef.current.setVisible(true);
      } catch (err) {
        console.warn("Error showing existing panorama:", err);
        // If error, clear ref so we re-initialize
        panoramaRef.current = null;
        locationKeyRef.current = null;
      }
      return;
    }
    
    console.log("Initializing Street View at:", locationKey);
    locationKeyRef.current = locationKey;

    // Wait for Google Maps API to load
    if (typeof google === 'undefined' || !google.maps) {
      console.warn("Google Maps API not loaded yet");
      return;
    }

    try {
      const sv = new google.maps.StreetViewService();
      const position = { lat: location.lat, lng: location.lng };

      sv.getPanorama(
        {
          location: position,
          radius: 50,
          source: google.maps.StreetViewSource.OUTDOOR,
        },
        (data, status) => {
          if (status === "OK" && data && data.location) {
            try {
              // Always recreate panorama for new location
              if (panoramaRef.current) {
                try {
                  panoramaRef.current.setVisible(false);
                } catch (err) {
                  console.warn("Error cleaning up old panorama:", err);
                }
              }
              
              if (containerRef.current) {
                panoramaRef.current = new google.maps.StreetViewPanorama(
                  containerRef.current,
                  {
                    position: data.location.latLng,
                    pov: {
                      heading: 0,
                      pitch: 0,
                    },
                    zoom: 1,
                    addressControl: false,
                    linksControl: true,
                    panControl: true,
                    enableCloseButton: false,
                    fullscreenControl: false,
                  }
                );
                console.log("Street View initialized successfully");
              }
            } catch (err) {
              console.error("Error creating Street View panorama:", err);
              panoramaRef.current = null;
              locationKeyRef.current = null;
            }
          } else {
            console.warn("Street View not available at this location:", status);
            panoramaRef.current = null;
            locationKeyRef.current = null;
          }
        }
      );
    } catch (err) {
      console.error("Error initializing Street View:", err);
      panoramaRef.current = null;
      locationKeyRef.current = null;
    }
  }, [isOpen, locationKey, location]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (panoramaRef.current) {
        try {
          panoramaRef.current.setVisible(false);
          panoramaRef.current = null;
        } catch (err) {
          console.warn("Error during cleanup:", err);
        }
      }
      locationKeyRef.current = null;
    };
  }, []);

  // Guard: early return AFTER all hooks
  if (!isOpen || !location) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.title}>🌍 Street View</span>
          <button onClick={onClose} style={styles.closeBtn}>
            ✕
          </button>
        </div>

        {/* Street View Container */}
        <div style={styles.streetViewContainer}>
          <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

          {/* Data Layer Indicator Overlay */}
          {layerInfo && (
            <div
              style={{
                ...styles.layerOverlay,
                background: `linear-gradient(180deg, ${layerInfo.color}33 0%, ${layerInfo.color}11 50%, transparent 100%)`,
              }}
            >
              <div
                style={{
                  ...styles.layerBanner,
                  background: layerInfo.color,
                }}
              >
                {layerInfo.icon} {layerInfo.label}
              </div>
              {layerInfo.details && (
                <div style={styles.layerDetails}>{layerInfo.details}</div>
              )}
            </div>
          )}

          {/* Tree Counter Badge */}
          {nearbyTrees.length > 0 && (
            <div style={styles.treeBadge}>
              🌳 {nearbyTrees.length} tree{nearbyTrees.length > 1 ? "s" : ""}{" "}
              nearby
            </div>
          )}

          {/* Navigation hint */}
          <div style={styles.navHint}>
            Use arrow keys or drag to look around • Click arrows to move
          </div>
        </div>

        {/* Footer info */}
        <div style={styles.footer}>
          <span style={styles.coords}>
            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </span>
          <button onClick={onClose} style={styles.exitBtn}>
            Exit Street View
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function getDistance(lat1, lon1, lat2, lon2) {
  return Math.sqrt((lat2 - lat1) ** 2 + (lon2 - lon1) ** 2);
}

function getLayerInfoForLocation(location, activeLayer, layerData) {
  if (!activeLayer || !layerData) return null;

  const { lat, lng } = location;

  if (activeLayer === "hotspots" && layerData.hotspots) {
    const nearby = layerData.hotspots.find((h) => {
      const dist = getDistance(lat, lng, h.lat, h.lon);
      return dist < 0.001; // ~100m
    });
    if (nearby) {
      return {
        icon: "⚠️",
        label: `RED ZONE: ${nearby.temperature_c}°C`,
        details: `${nearby.description || "Extreme heat area"}`,
        color: "#ef4444",
      };
    }
  }

  if (activeLayer === "suggestions" && layerData.suggestions) {
    const nearby = layerData.suggestions.find((s) => {
      const dist = getDistance(lat, lng, s.lat, s.lon);
      return dist < 0.001;
    });
    if (nearby) {
      return {
        icon: "💡",
        label: `Suggested Planting Location`,
        details: `${nearby.reason || ""} (−${nearby.cooling_potential}°C)`,
        color: "#10b981",
      };
    }
  }

  if (activeLayer === "vulnerability" && layerData.vulnerability) {
    const nearby = layerData.vulnerability.find((v) => {
      const dist = getDistance(lat, lng, v.lat, v.lon);
      return dist < 0.003;
    });
    if (nearby) {
      const level =
        nearby.vulnerability_score >= 0.7
          ? "High"
          : nearby.vulnerability_score >= 0.4
          ? "Medium"
          : "Low";
      return {
        icon: "🛡️",
        label: `${nearby.label || "Vulnerable Area"} (${level})`,
        details: nearby.factors || "",
        color: "#a78bfa",
      };
    }
  }

  return null;
}

// ─── Styles ──────────────────────────────────────────────────

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    backdropFilter: "blur(4px)",
  },
  panel: {
    background: "#1a1a2e",
    borderRadius: "16px",
    width: "min(95vw, 1100px)",
    height: "min(90vh, 700px)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(26,26,46,0.95)",
  },
  title: {
    color: "#4ade80",
    fontSize: "1rem",
    fontWeight: 700,
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#888",
    fontSize: "1.4rem",
    cursor: "pointer",
    lineHeight: 1,
  },
  streetViewContainer: {
    position: "relative",
    flex: 1,
    background: "#000",
  },
  layerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    zIndex: 10,
  },
  layerBanner: {
    position: "absolute",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "10px 24px",
    borderRadius: "8px",
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.9rem",
    boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
    letterSpacing: "0.3px",
  },
  layerDetails: {
    position: "absolute",
    top: "65px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(26,26,46,0.92)",
    padding: "8px 16px",
    borderRadius: "8px",
    color: "#ddd",
    fontSize: "0.8rem",
    maxWidth: "400px",
    textAlign: "center",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  treeBadge: {
    position: "absolute",
    bottom: "80px",
    left: "20px",
    background: "rgba(16,185,129,0.92)",
    color: "#fff",
    padding: "8px 14px",
    borderRadius: "8px",
    fontSize: "0.82rem",
    fontWeight: 600,
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
    zIndex: 20,
  },
  navHint: {
    position: "absolute",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(0,0,0,0.75)",
    color: "#aaa",
    padding: "6px 14px",
    borderRadius: "6px",
    fontSize: "0.72rem",
    pointerEvents: "none",
    zIndex: 20,
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(26,26,46,0.95)",
  },
  coords: {
    color: "#888",
    fontSize: "0.75rem",
    fontFamily: "monospace",
  },
  exitBtn: {
    padding: "8px 18px",
    background: "rgba(239,68,68,0.9)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.82rem",
    fontWeight: 600,
    cursor: "pointer",
  },
};
