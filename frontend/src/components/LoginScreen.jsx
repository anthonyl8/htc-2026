import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function LoginScreen({ onSuccess, onSkip }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        onSuccess?.();
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
        });
        if (err) throw err;
        // With email confirmation disabled, a successful sign-up
        // is also a successful sign-in.
        onSuccess?.();
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <span style={styles.logo}>🌿</span>
        <h1 style={styles.title}>ReLeaf</h1>
        <p style={styles.subtitle}>Sign in to save your proposals</p>

        {onSkip && (
          <button type="button" onClick={onSkip} style={styles.skipBtn}>
            Continue without saving →
          </button>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          {error && <div style={styles.error}>{error}</div>}
          <button type="submit" disabled={loading} style={styles.submit}>
            {loading ? "..." : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === "signin" ? "signup" : "signin"));
            setError(null);
          }}
          style={styles.switch}
        >
          {mode === "signin" ? "Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0a0a1a 0%, #16231a 100%)",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    background: "rgba(20, 40, 32, 0.98)",
    borderRadius: "16px",
    padding: "40px",
    width: "100%",
    maxWidth: "400px",
    border: "1px solid rgba(74, 222, 128, 0.2)",
  },
  logo: { fontSize: "3rem", display: "block", textAlign: "center", marginBottom: "8px" },
  title: {
    color: "#4ade80",
    fontSize: "1.5rem",
    textAlign: "center",
    margin: "0 0 4px 0",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: "0.9rem",
    textAlign: "center",
    margin: "0 0 24px 0",
  },
  skipBtn: {
    width: "100%",
    padding: "10px",
    marginBottom: "20px",
    background: "transparent",
    border: "1px solid rgba(74, 222, 128, 0.3)",
    color: "#4ade80",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  input: {
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(0,0,0,0.2)",
    color: "#fff",
    fontSize: "1rem",
  },
  error: { color: "#f87171", fontSize: "0.85rem" },
  successBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "12px",
    background: "rgba(74, 222, 128, 0.1)",
    borderRadius: "8px",
    border: "1px solid rgba(74, 222, 128, 0.3)",
  },
  message: { color: "#4ade80", fontSize: "0.9rem", fontWeight: 500 },
  messageHint: { color: "#94a3b8", fontSize: "0.85rem" },
  gotItBtn: {
    padding: "8px 16px",
    background: "rgba(74, 222, 128, 0.2)",
    border: "1px solid rgba(74, 222, 128, 0.5)",
    borderRadius: "6px",
    color: "#4ade80",
    fontSize: "0.9rem",
    cursor: "pointer",
    alignSelf: "flex-start",
  },
  submit: {
    padding: "12px 24px",
    borderRadius: "8px",
    border: "none",
    background: "#16a34a",
    color: "#fff",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  switch: {
    marginTop: "16px",
    background: "none",
    border: "none",
    color: "#94a3b8",
    fontSize: "0.9rem",
    cursor: "pointer",
    textDecoration: "underline",
  },
};
