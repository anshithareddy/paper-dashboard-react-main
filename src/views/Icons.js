import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Badge.css";
import goldBadge from "../assets/img/badges/gold-badge.svg";
import silverBadge from "../assets/img/badges/silver-badge.svg";
import bronzeBadge from "../assets/img/badges/bronze-badge.svg";
import { calculateAqiMetrics } from "../utils/aqi";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:5000";
const REFRESH_INTERVAL_MS = 3000;

const BADGE_IMAGES = {
  gold: goldBadge,
  silver: silverBadge,
  bronze: bronzeBadge,
};

function Icons() {
  const [buildings, setBuildings] = useState([]);
  const [lastUpdated, setLastUpdated] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadBuildings = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/arrq`);

        if (isMounted && Array.isArray(response.data)) {
          setBuildings(response.data);
          setLastUpdated(new Date().toLocaleTimeString());
          setLoadError("");
        }
      } catch (error) {
        console.error("Failed to refresh rewards page:", error);

        if (isMounted) {
          setLoadError("Rewards are waiting for AQI data from the backend.");
        }
      }
    };

    loadBuildings();
    const intervalId = window.setInterval(loadBuildings, REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const { airPollutionIndex, aqiBand, reward, greenery, occupiedCells } = calculateAqiMetrics(buildings);
  const badgeImage = BADGE_IMAGES[reward.type];

  return (
    <div className="badge-container">
      <div className="badge-summary">
        <h3 style={{ marginBottom: 8 }}>AQI Rewards</h3>
        <p style={{ marginBottom: 8 }}>
          Current AQI: <strong>{airPollutionIndex}</strong> ({aqiBand.label})
        </p>
        <p style={{ marginBottom: 8 }}>
          Grid status: <strong>{occupiedCells}</strong> occupied cells, <strong>{greenery}</strong> green cells
        </p>
        <p style={{ marginBottom: 0, color: "#7b809a" }}>
          {lastUpdated ? `Last synced at ${lastUpdated}` : "Waiting for first sync"}
        </p>
      </div>

      {reward.type !== "none" ? (
        <div className={`badge badge--${reward.type}`}>
          <img src={badgeImage} alt={reward.title} className="badge-img" />
          <p className="badge-text">{reward.title}</p>
          <p className="badge-note">{reward.message}</p>
        </div>
      ) : (
        <div className="badge badge--locked">
          <p className="badge-text">{reward.title}</p>
          <p className="badge-note">{reward.message}</p>
        </div>
      )}

      <div className="badge-summary">
        <h5 style={{ marginBottom: 10 }}>Reward Rules</h5>
        <p style={{ marginBottom: 6 }}><strong>Gold:</strong> AQI 80 or below</p>
        <p style={{ marginBottom: 6 }}><strong>Silver:</strong> AQI 81 to 130</p>
        <p style={{ marginBottom: 6 }}><strong>Bronze:</strong> AQI 131 to 180</p>
        <p style={{ marginBottom: 0 }}><strong>No badge:</strong> AQI above 180</p>
      </div>

      {loadError ? <p className="badge-error">{loadError}</p> : null}
    </div>
  );
}

export default Icons;
