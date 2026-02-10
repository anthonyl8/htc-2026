import React from "react";

const MarkdownRenderer = ({ text }) => {
  if (!text) return null;

  // Simple parser: split by lines
  const lines = text.split('\n');
  const elements = [];

  lines.forEach((line, index) => {
    const key = `line-${index}`;
    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<div key={key} style={{ height: '16px' }} />);
      return;
    }

    // Process bold text (**text**)
    const processBold = (str) => {
      const parts = str.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={key} style={styles.h1}>{processBold(trimmed.slice(2))}</h1>);
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={key} style={styles.h2}>{processBold(trimmed.slice(3))}</h2>);
    } else if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={key} style={styles.h3}>{processBold(trimmed.slice(4))}</h3>);
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
       elements.push(
        <li key={key} style={styles.li}>
          {processBold(trimmed.slice(2))}
        </li>
      );
    } else {
      // Regular paragraph, maybe with bold headers like "1. Executive Summary:"
      elements.push(
        <p key={key} style={styles.p}>
          {processBold(trimmed)}
        </p>
      );
    }
  });

  return <div>{elements}</div>;
};

const GrantProposalCard = ({ proposal, onClose, isOpen }) => {
  if (!isOpen || !proposal) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>FEMA Grant Proposal</h2>
          <button onClick={onClose} style={styles.closeButton}>
            ×
          </button>
        </div>
        <div style={styles.content}>
          <MarkdownRenderer text={proposal} />
        </div>
        <div style={styles.footer}>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(proposal);
              alert("Copied to clipboard!");
            }}
            style={styles.copyButton}
          >
            Copy to Clipboard
          </button>
          <button onClick={onClose} style={styles.doneButton}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
    backdropFilter: "blur(4px)",
  },
  card: {
    backgroundColor: "#1e1e2f",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "800px",
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  header: {
    padding: "20px 24px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    margin: 0,
    color: "#4ade80",
    fontSize: "1.25rem",
    fontWeight: "600",
  },
  closeButton: {
    background: "none",
    border: "none",
    color: "#9ca3af",
    fontSize: "1.5rem",
    cursor: "pointer",
    padding: "0 8px",
    lineHeight: 1,
  },
  content: {
    padding: "24px",
    overflowY: "auto",
    flex: 1,
    fontFamily: '"Merriweather", "Georgia", serif',
    color: "#e2e8f0",
  },
  h1: {
    fontSize: "1.8rem",
    color: "#fff",
    borderBottom: "1px solid #444",
    paddingBottom: "8px",
    marginTop: "24px",
    marginBottom: "16px",
  },
  h2: {
    fontSize: "1.4rem",
    color: "#4ade80",
    marginTop: "20px",
    marginBottom: "12px",
  },
  h3: {
    fontSize: "1.1rem",
    color: "#ddd",
    fontWeight: "bold",
    marginTop: "16px",
    marginBottom: "8px",
  },
  p: {
    fontSize: "1rem",
    lineHeight: "1.6",
    marginBottom: "12px",
    color: "#ccc",
  },
  li: {
    marginLeft: "20px",
    marginBottom: "8px",
    fontSize: "1rem",
    lineHeight: "1.5",
    color: "#ccc",
  },
  footer: {
    padding: "16px 24px",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  },
  copyButton: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    background: "rgba(255, 255, 255, 0.05)",
    color: "#e2e8f0",
    cursor: "pointer",
    fontSize: "0.9rem",
    transition: "background 0.2s",
  },
  doneButton: {
    padding: "8px 20px",
    borderRadius: "6px",
    border: "none",
    background: "#4ade80",
    color: "#064e3b",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "0.9rem",
    transition: "background 0.2s",
  },
};

export default GrantProposalCard;
