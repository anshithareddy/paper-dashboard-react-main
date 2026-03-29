import React, { useEffect, useMemo, useRef, useState } from "react";
import NotificationAlert from "react-notification-alert";
import axios from "axios";
import {
  Alert,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
} from "reactstrap";
import { calculateAqiMetrics } from "../utils/aqi";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:5000";
const REFRESH_INTERVAL_MS = 3000;

function Notifications() {
  const notificationAlert = useRef();
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
        console.error("Failed to refresh notifications:", error);

        if (isMounted) {
          setLoadError("Notifications are waiting for backend data.");
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

  const { airPollutionIndex, aqiBand, counts, greenery, occupiedCells } = calculateAqiMetrics(buildings);

  const alerts = useMemo(() => {
    const items = [];

    if (airPollutionIndex <= 80) {
      items.push({
        id: "aqi-good",
        color: "success",
        title: "Air Quality Stable",
        body: `AQI is ${airPollutionIndex}. Current layout is maintaining healthy air conditions.`,
        icon: "nc-icon nc-check-2",
      });
    } else if (airPollutionIndex <= 150) {
      items.push({
        id: "aqi-watch",
        color: "warning",
        title: "AQI Needs Attention",
        body: `AQI is ${airPollutionIndex}. Add greenery or spread out heavy-emission buildings.`,
        icon: "nc-icon nc-alert-circle-i",
      });
    } else {
      items.push({
        id: "aqi-high",
        color: "danger",
        title: "High Pollution Alert",
        body: `AQI is ${airPollutionIndex}. Industrial and power clusters are pushing pollution too high.`,
        icon: "nc-icon nc-notification-70",
      });
    }

    if (counts.industrial + counts.powerPlant >= 12) {
      items.push({
        id: "industry-cluster",
        color: "danger",
        title: "Heavy Emission Cluster",
        body: `${counts.industrial + counts.powerPlant} high-emission cells are active. Consider reducing industrial density.`,
        icon: "nc-icon nc-settings",
      });
    }

    if (greenery <= 110) {
      items.push({
        id: "greenery-low",
        color: "warning",
        title: "Green Cover Dropping",
        body: `Only ${greenery} green cells remain. Parks and open buffers would improve recovery.`,
        icon: "nc-icon nc-world-2",
      });
    } else {
      items.push({
        id: "greenery-healthy",
        color: "info",
        title: "Green Buffer Healthy",
        body: `${greenery} green cells are helping offset emissions across the grid.`,
        icon: "nc-icon nc-world-2",
      });
    }

    if (occupiedCells >= 140) {
      items.push({
        id: "density-high",
        color: "primary",
        title: "Urban Density Rising",
        body: `${occupiedCells} cells are occupied. Congestion and environmental pressure are increasing.`,
        icon: "nc-icon nc-chart-bar-32",
      });
    }

    if (counts.road >= 45) {
      items.push({
        id: "road-traffic",
        color: "info",
        title: "Traffic Corridor Load",
        body: `${counts.road} road cells are active. Traffic-linked emissions may grow without buffers.`,
        icon: "nc-icon nc-bus-front-12",
      });
    }

    return items;
  }, [airPollutionIndex, counts, greenery, occupiedCells]);

  const notify = (alert, place) => {
    notificationAlert.current.notificationAlert({
      place,
      message: (
        <div>
          <div>
            <b>{alert.title}</b>
            <div>{alert.body}</div>
          </div>
        </div>
      ),
      type: alert.color,
      icon: alert.icon,
      autoDismiss: 6,
    });
  };

  return (
    <>
      <div className="content">
        <NotificationAlert ref={notificationAlert} />
        <Row>
          <Col md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h4">City Notifications</CardTitle>
                <p className="card-category">
                  Live alerts generated from AQI and current grid activity
                  {lastUpdated ? ` • refreshed at ${lastUpdated}` : ""}
                </p>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col lg="4" md="6">
                    <Alert color={airPollutionIndex <= 80 ? "success" : airPollutionIndex <= 150 ? "warning" : "danger"}>
                      <span>
                        <b>AQI Status - </b>
                        {airPollutionIndex} ({aqiBand.label})
                      </span>
                    </Alert>
                  </Col>
                  <Col lg="4" md="6">
                    <Alert color="info">
                      <span>
                        <b>Occupied Cells - </b>
                        {occupiedCells}
                      </span>
                    </Alert>
                  </Col>
                  <Col lg="4" md="12">
                    <Alert color="success">
                      <span>
                        <b>Green Cells - </b>
                        {greenery}
                      </span>
                    </Alert>
                  </Col>
                </Row>

                {loadError ? (
                  <Alert color="danger">
                    <span>{loadError}</span>
                  </Alert>
                ) : null}

                <Row>
                  {alerts.map((alert) => (
                    <Col md="6" key={alert.id}>
                      <Card className="card-plain">
                        <CardBody>
                          <Alert className="alert-with-icon" color={alert.color}>
                            <span data-notify="icon" className={alert.icon} />
                            <span data-notify="message">
                              <b>{alert.title} - </b>
                              {alert.body}
                            </span>
                          </Alert>
                        </CardBody>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md="12">
            <Card>
              <CardBody>
                <div className="places-buttons">
                  <Row>
                    <Col className="ml-auto mr-auto text-center" md="8">
                      <CardTitle tag="h4">Preview Live Alerts</CardTitle>
                      <p className="category">Push the top alert to a notification position</p>
                    </Col>
                  </Row>
                  <Row>
                    <Col className="ml-auto mr-auto" lg="8">
                      <Row>
                        <Col md="4">
                          <Button block color="primary" onClick={() => notify(alerts[0], "tl")} disabled={!alerts.length}>
                            Top Left
                          </Button>
                        </Col>
                        <Col md="4">
                          <Button block color="primary" onClick={() => notify(alerts[0], "tc")} disabled={!alerts.length}>
                            Top Center
                          </Button>
                        </Col>
                        <Col md="4">
                          <Button block color="primary" onClick={() => notify(alerts[0], "tr")} disabled={!alerts.length}>
                            Top Right
                          </Button>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                  <Row>
                    <Col className="ml-auto mr-auto" lg="8">
                      <Row>
                        <Col md="4">
                          <Button block color="primary" onClick={() => notify(alerts[0], "bl")} disabled={!alerts.length}>
                            Bottom Left
                          </Button>
                        </Col>
                        <Col md="4">
                          <Button block color="primary" onClick={() => notify(alerts[0], "bc")} disabled={!alerts.length}>
                            Bottom Center
                          </Button>
                        </Col>
                        <Col md="4">
                          <Button block color="primary" onClick={() => notify(alerts[0], "br")} disabled={!alerts.length}>
                            Bottom Right
                          </Button>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default Notifications;
