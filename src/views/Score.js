import "./dashboard/Dashboard.css";
import React, { useEffect, useState } from "react";
import axios from "axios";
import ReactSpeedometer from "react-d3-speedometer";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Card, CardHeader, CardBody, Row, Col } from "reactstrap";
import { calculateAqiMetrics } from "../utils/aqi";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:5000";
const REFRESH_INTERVAL_MS = 3000;
const TOTAL_GRID_CELLS = 256;

function ProgressMeter({ label, value, color, note }) {
  return (
    <div style={{ width: 190, textAlign: "center" }}>
      <div style={{ width: 150, height: 150, margin: "0 auto 14px" }}>
        <CircularProgressbar
          value={value}
          text={`${value}%`}
          styles={{
            root: { width: "100%", height: "100%" },
            path: { stroke: color, strokeLinecap: "round" },
            trail: { stroke: "#eef1f5" },
            text: { fill: color, fontSize: "16px", fontWeight: 700 },
          }}
        />
      </div>
      <h6 style={{ marginBottom: 6 }}>{label}</h6>
      <p style={{ margin: 0, color: "#7b809a", fontSize: 13 }}>{note}</p>
    </div>
  );
}

function Score() {
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
        console.error("Failed to refresh AQI score:", error);

        if (isMounted) {
          setLoadError("AQI is waiting for backend data. Start the backend or save a grid layout first.");
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
  const {
    airPollutionIndex,
    greenCoverage,
    emissionPressure,
    ecoBalance,
    greenery,
    occupiedCells,
    aqiBand,
  } = calculateAqiMetrics(buildings);

  return (
    <>
      <div className="content">
        <Card className="hover-effect">
          <CardHeader>
            <h5 className="card-title">Air Pollution Index</h5>
            <p className="card-category">
              A live AQI model based on your current city layout
              {lastUpdated ? ` • refreshed at ${lastUpdated}` : ""}
            </p>
          </CardHeader>
          <CardBody>
            <Row className="align-items-center">
              <Col lg="7">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: 360,
                  }}
                >
                  <ReactSpeedometer
                    value={airPollutionIndex}
                    minValue={0}
                    maxValue={500}
                    width={520}
                    height={320}
                    segments={5}
                    ringWidth={58}
                    needleColor="#34495e"
                    startColor="#2ecc71"
                    endColor="#8e44ad"
                    needleTransition="easeElastic"
                    currentValueText={`AQI: ${airPollutionIndex} (${aqiBand.label})`}
                  />
                </div>
              </Col>
              <Col lg="5">
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: 18,
                    padding: 24,
                    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
                  }}
                >
                  <div
                    style={{
                      display: "inline-block",
                      padding: "8px 14px",
                      borderRadius: 999,
                      backgroundColor: aqiBand.color,
                      color: "#fff",
                      fontWeight: 700,
                      marginBottom: 14,
                    }}
                  >
                    {aqiBand.label}
                  </div>
                  <h3 style={{ marginBottom: 12 }}>{airPollutionIndex} / 500</h3>
                  <p style={{ color: "#7b809a", marginBottom: 20 }}>{aqiBand.advice}</p>
                  <p style={{ marginBottom: 8 }}>
                    <strong>Cells loaded:</strong> {occupiedCells} occupied, {greenery} green.
                  </p>
                  <p style={{ marginBottom: 8 }}>
                    <strong>High impact sources:</strong> industry, power plants, road density, and polluted clusters.
                  </p>
                  <p style={{ marginBottom: 8 }}>
                    <strong>Natural recovery:</strong> greenery and open buffers around homes lower the AQI.
                  </p>
                  <p style={{ marginBottom: 0 }}>
                    <strong>Live sync:</strong> every save to the grid updates this score automatically.
                  </p>
                  {loadError ? (
                    <p style={{ marginTop: 14, marginBottom: 0, color: "#e74c3c", fontWeight: 600 }}>
                      {loadError}
                    </p>
                  ) : null}
                </div>
              </Col>
            </Row>
          </CardBody>
        </Card>

        <div style={{ paddingTop: 20 }}>
          <Card className="hover-effect">
            <CardHeader>
              <h5 className="card-title">Pollution Drivers</h5>
              <p className="card-category">Three supporting indicators behind the AQI</p>
            </CardHeader>
            <CardBody>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 24,
                  justifyContent: "space-around",
                }}
              >
                <ProgressMeter
                  label="Green Coverage"
                  value={greenCoverage}
                  color="#2ecc71"
                  note={`${greenery} of ${TOTAL_GRID_CELLS} cells are absorbing emissions.`}
                />
                <ProgressMeter
                  label="Emission Pressure"
                  value={emissionPressure}
                  color="#e74c3c"
                  note="Industry, power plants, and roads drive this upward."
                />
                <ProgressMeter
                  label="Eco Balance"
                  value={ecoBalance}
                  color="#3498db"
                  note="Measures how well green space offsets heavy infrastructure."
                />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

export default Score;
