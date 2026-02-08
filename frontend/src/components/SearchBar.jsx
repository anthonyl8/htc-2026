import { useRef, useState, useEffect } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

/**
 * Google Places Autocomplete search bar.
 * Lets users search for any location worldwide and fly the map there.
 */
export default function SearchBar({ onPlaceSelect }) {
  const inputRef = useRef(null);
  const places = useMapsLibrary("places");
  const [autocomplete, setAutocomplete] = useState(null);
  const [focused, setFocused] = useState(false);

  // Initialize Google Places Autocomplete once the library loads
  useEffect(() => {
    if (!places || !inputRef.current) return;

    const ac = new places.Autocomplete(inputRef.current, {
      fields: ["geometry", "name", "formatted_address"],
    });

    setAutocomplete(ac);

    return () => {
      if (window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(ac);
      }
    };
  }, [places]);

  // Listen for place selection
  useEffect(() => {
    if (!autocomplete) return;

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        onPlaceSelect({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          name: place.name,
          address: place.formatted_address,
          viewport: place.geometry.viewport,
        });
      }
    });

    return () => {
      if (window.google?.maps?.event) {
        window.google.maps.event.removeListener(listener);
      }
    };
  }, [autocomplete, onPlaceSelect]);

  return (
    <div
      style={{
        ...styles.container,
        ...(focused ? styles.containerFocused : {}),
      }}
    >
      <span style={styles.icon}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        ref={inputRef}
        type="text"
        placeholder="Search any location..."
        style={styles.input}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

const styles = {
  container: {
    position: "absolute",
    top: "16px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(26,26,46,0.92)",
    padding: "10px 18px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(16px)",
    zIndex: 200,
    width: "min(420px, 50vw)",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
  },
  containerFocused: {
    border: "1px solid rgba(74,222,128,0.4)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.4), 0 0 0 2px rgba(74,222,128,0.15)",
  },
  icon: {
    color: "#888",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
  },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#e5e5e5",
    fontSize: "0.92rem",
    fontFamily: "inherit",
    letterSpacing: "0.2px",
  },
};
