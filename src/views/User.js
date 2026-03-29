import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Badge,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardTitle,
  Row,
  Col,
} from "reactstrap";
import { calculateAqiMetrics } from "../utils/aqi";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:5000";
const REFRESH_INTERVAL_MS = 3000;

function User() {
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
        console.error("Failed to refresh user profile:", error);

        if (isMounted) {
          setLoadError("Profile insights are waiting for backend data.");
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

  const { airPollutionIndex, aqiBand, reward, greenery, occupiedCells, counts } =
    calculateAqiMetrics(buildings);

  const populationEstimate = counts.residential * 50;
  const commerceSupport = counts.commercial * 35;
  const industryPressure = counts.industrial + counts.powerPlant;

  const quickStats = [
    { label: "Population Capacity", value: populationEstimate },
    { label: "Active Grid Cells", value: occupiedCells },
    { label: "Green Cells", value: greenery },
    { label: "Commercial Support", value: commerceSupport },
  ];

  const recommendations = useMemo(() => {
    const items = [];

    if (airPollutionIndex > 150) {
      items.push("Reduce industrial and power-plant clustering near residential zones.");
    }

    if (greenery < 120) {
      items.push("Increase greenery to create stronger air-recovery buffers across the grid.");
    }

    if (counts.road > 45) {
      items.push("Review road spread and add green separators around heavy traffic corridors.");
    }

    if (counts.commercial < Math.ceil(counts.residential / 6)) {
      items.push("Add more commercial support to balance residential growth.");
    }

    if (!items.length) {
      items.push("City balance looks stable. Fine-tune district placement for even better AQI.");
    }

    return items;
  }, [airPollutionIndex, greenery, counts]);

  return (
    <>
      <div className="content">
        <Row>
          <Col lg="4" md="5">
            <Card className="card-user">
              <div className="image">
                <img alt="planner cover" src={require("assets/img/header.jpg")} />
              </div>
              <CardBody>
                <div className="author">
                  <img
                    alt="planner avatar"
                    className="avatar border-gray"
                    src={require("assets/img/default-avatar.png")}
                  />
                  <h5 className="title">City Operations Planner</h5>
                  <p className="description">Live planning profile</p>
                </div>
                <p className="description text-center">
                  Managing growth, air quality, and infrastructure balance across the smart city grid.
                </p>
              </CardBody>
              <CardFooter>
                <hr />
                <div className="button-container">
                  <Row>
                    <Col className="ml-auto" lg="4" md="4" xs="4">
                      <h5>
                        {counts.residential}
                        <br />
                        <small>Homes</small>
                      </h5>
                    </Col>
                    <Col className="ml-auto mr-auto" lg="4" md="4" xs="4">
                      <h5>
                        {counts.commercial}
                        <br />
                        <small>Commercial</small>
                      </h5>
                    </Col>
                    <Col className="mr-auto" lg="4" md="4" xs="4">
                      <h5>
                        {industryPressure}
                        <br />
                        <small>Heavy Load</small>
                      </h5>
                    </Col>
                  </Row>
                </div>
              </CardFooter>
            </Card>
          </Col>

          <Col lg="8" md="7">
            <Card className="card-user">
              <CardHeader>
                <CardTitle tag="h4">Planner Profile</CardTitle>
                <p className="card-category">
                  Live city health and planning insights
                  {lastUpdated ? ` • refreshed at ${lastUpdated}` : ""}
                </p>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col md="6">
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ fontWeight: 600 }}>Current AQI</label>
                      <h2 style={{ marginBottom: 6 }}>{airPollutionIndex}</h2>
                      <Badge
                        color={
                          airPollutionIndex <= 80
                            ? "success"
                            : airPollutionIndex <= 150
                            ? "warning"
                            : "danger"
                        }
                        pill
                        style={{ padding: "8px 14px", fontSize: 14 }}
                      >
                        {aqiBand.label}
                      </Badge>
                    </div>
                  </Col>
                  <Col md="6">
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ fontWeight: 600 }}>Reward Status</label>
                      <h4 style={{ marginBottom: 6 }}>{reward.title}</h4>
                      <p style={{ marginBottom: 0, color: "#7b809a" }}>{reward.message}</p>
                    </div>
                  </Col>
                </Row>

                <Row>
                  {quickStats.map((stat) => (
                    <Col md="6" key={stat.label}>
                      <div
                        style={{
                          background: "#f8fafc",
                          borderRadius: 16,
                          padding: 18,
                          marginBottom: 16,
                          boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
                        }}
                      >
                        <p style={{ marginBottom: 6, color: "#7b809a" }}>{stat.label}</p>
                        <h4 style={{ marginBottom: 0 }}>{stat.value}</h4>
                      </div>
                    </Col>
                  ))}
                </Row>

                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: 18,
                    padding: 20,
                    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
                  }}
                >
                  <h5 style={{ marginBottom: 14 }}>Planning Recommendations</h5>
                  {recommendations.map((item) => (
                    <p key={item} style={{ marginBottom: 10 }}>
                      {item}
                    </p>
                  ))}
                  {loadError ? (
                    <p style={{ marginBottom: 0, color: "#e74c3c", fontWeight: 600 }}>
                      {loadError}
                    </p>
                  ) : null}
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default User;
