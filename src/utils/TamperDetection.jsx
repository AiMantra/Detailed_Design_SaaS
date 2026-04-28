import React from "react";
import thumbsUpGif from "../assets/gif/thumbsUp.gif";
import { AlignCenter } from "lucide-react";
import { logout } from "../features/auth/authSlice";
import { useDispatch } from "react-redux";

const TamperDetection = () => {
  const dispatch = useDispatch();
  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.imageContainer}>
          <img src={thumbsUpGif} alt="Tamper Detected" style={styles.image} />
        </div>

        <h1 style={styles.title}>Nice Try!</h1>

        <p style={styles.description}>
          It looks like session data was modified.
          For security reasons, this action is not permitted.
        </p>

        <button
          style={styles.button}
          // onClick={() => window.location.reload()}
          onClick={() => {
            dispatch(logout());
            // window.location.reload();
          }}
        >
          Go To Login Page
        </button>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #eef2f3, #dfe9f3)",
    padding: "20px",
  },
  card: {
    background: "#ffffff",
    padding: "40px",
    borderRadius: "16px",
    boxShadow: "0 15px 40px rgba(0,0,0,0.08)",
    maxWidth: "420px",
    width: "100%",
    textAlign: "center",
    animation: "fadeIn 0.4s ease-in-out",
  },
  imageContainer: {
    // height: "250px",
    // width: "250px",
    // alignItems: "center",
    marginBottom: "20px",
  },
  image: {
    alignItems: "center",
    width: "100%",
    // height: "250px",
    borderRadius: "8px",
    objectFit: "contain",
  },
  title: {
    fontSize: "22px",
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: "12px",
  },
  description: {
    fontSize: "15px",
    color: "#636e72",
    marginBottom: "25px",
    lineHeight: "1.5",
  },
  button: {
    backgroundColor: "#4a69bd",
    color: "#ffffff",
    border: "none",
    padding: "10px 22px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.3s ease",
  },
};

export default TamperDetection;
