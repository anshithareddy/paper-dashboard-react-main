import React from "react";
import { useEffect, useState } from "react";
// react plugin used to create charts
import { Line, Pie } from "react-chartjs-2";
// reactstrap components
import axios from "axios";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardTitle,
  Row,
  Col
} from "reactstrap";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:5000";
const REFRESH_INTERVAL_MS = 3000;
const TOTAL_GRID_CELLS = 256;

function Dashboard() {
  const [buildings, setBuildings] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadBuildings = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/arrq`);

        if (isMounted && Array.isArray(response.data)) {
          setBuildings(response.data);
        }
      } catch (error) {
        console.error("Failed to refresh dashboard values:", error);
      }
    };

    loadBuildings();
    const intervalId = window.setInterval(loadBuildings, REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const metrics = buildings.reduce(
    (totals, building) => {
      switch (building.buildingType) {
        case "residential":
          totals.residences += 1;
          break;
        case "commercial":
          totals.commercials += 1;
          break;
        case "industrial":
          totals.industries += 1;
          break;
        case "power-plant":
          totals.powerGrids += 1;
          break;
        case "base-station":
          totals.baseStations += 1;
          break;
        case "road":
          totals.roads += 1;
          break;
        default:
          break;
      }

      return totals;
    },
    {
      residences: 0,
      commercials: 0,
      industries: 0,
      powerGrids: 0,
      roads: 0,
      baseStations: 0,
    }
  );

  const residences = metrics.residences;
  const commercials = metrics.commercials;
  const industries = metrics.industries;
  const powerGrids = metrics.powerGrids;
  const roads = metrics.roads;
  const baseStations = metrics.baseStations;
  const parks = Math.max(
    0,
    TOTAL_GRID_CELLS - residences - commercials - industries - powerGrids - roads - baseStations
  );

  const chartLabels = [
    "Houses",
    "Commercial",
    "Industries",
    "Roads",
    "Power",
    "Base",
    "Greenery",
  ];

  const liveCounts = [
    residences,
    commercials,
    industries,
    roads,
    powerGrids,
    baseStations,
    parks,
  ];

  const liveShare = liveCounts.map((count) =>
    Number(((count / TOTAL_GRID_CELLS) * 100).toFixed(1))
  );

  const dashboardLineChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Grid Count",
        borderColor: "#6bd098",
        backgroundColor: "rgba(107, 208, 152, 0.2)",
        pointBackgroundColor: "#6bd098",
        pointBorderColor: "#6bd098",
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 3,
        tension: 0.35,
        fill: true,
        data: liveCounts,
      },
      {
        label: "Grid Share %",
        borderColor: "#f17e5d",
        backgroundColor: "rgba(241, 126, 93, 0.15)",
        pointBackgroundColor: "#f17e5d",
        pointBorderColor: "#f17e5d",
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 3,
        tension: 0.35,
        fill: true,
        data: liveShare,
      },
    ],
  };

  const dashboardLineChartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: "#9f9f9f",
        },
        grid: {
          drawBorder: false,
          color: "rgba(0, 0, 0, 0.06)",
        },
      },
      x: {
        ticks: {
          color: "#9f9f9f",
        },
        grid: {
          display: false,
          drawBorder: false,
        },
      },
    },
  };

  const dashboardPieChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Grid Mix",
        backgroundColor: [
          "#fbc658",
          "#51cbce",
          "#ef8157",
          "#6c757d",
          "#4b8ef1",
          "#9b59b6",
          "#2ecc71",
        ],
        borderColor: "#ffffff",
        borderWidth: 2,
        data: liveCounts,
      },
    ],
  };

  const dashboardPieChartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.raw}`,
        },
      },
    },
  };

  return (
    <>
      <div className="content">
        <Row>
          <Col lg="3" md="6" sm="6">
            <Card className=" hover-effect card-stats">
              <CardBody>
                <Row>
                  <Col md="4" xs="5">
                    <div className="icon-big text-center icon-warning">
                      <i className="fas fa-home text-warning" />
                    </div>
                  </Col>
                  <Col md="8" xs="7">
                    <div className="numbers">
                      <p className="card-category">Houses</p>
                      <CardTitle tag="p">{residences}</CardTitle>
                      <p />
                    </div>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter>
                <hr />
              </CardFooter>
            </Card>
          </Col>
          <Col lg="3" md="6" sm="6">
            <Card className="hover-effect card-stats">
              <CardBody>
                <Row>
                  <Col md="4" xs="5">
                    <div className="icon-big text-center icon-warning">
                      <i className="fas fa-building text-success" />
                    </div>
                  </Col>
                  <Col md="8" xs="7">
                    <div className="numbers">
                      <p className="card-category">Commercial</p>
                      <CardTitle tag="p">{commercials}</CardTitle>
                      <p />
                    </div>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter>
                <hr />
                
              </CardFooter>
            </Card>
          </Col>
          <Col lg="3" md="6" sm="6">
            <Card className="hover-effect card-stats">
              <CardBody>
                <Row>
                  <Col md="4" xs="5">
                    <div className="icon-big text-center icon-warning">
                      <i className="fas fa-industry text-danger" />
                    </div>
                  </Col>
                  <Col md="8" xs="7">
                    <div className="numbers">
                      <p className="card-category">Industries</p>
                      <CardTitle tag="p">{industries}</CardTitle>
                      <p />
                    </div>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter>
                <hr />
              </CardFooter>
            </Card>
          </Col>
          <Col lg="3" md="6" sm="6">
            <Card className="hover-effect card-stats">
              <CardBody>
                <Row>
                  <Col md="4" xs="5">
                    <div className="icon-big text-center icon-warning">
                      <i className="fas fa-road text" />
                    </div>
                  </Col>
                  <Col md="8" xs="7">
                    <div className="numbers">
                      <p className="card-category">Roads</p>
                      <CardTitle tag="p">{roads}</CardTitle>
                      <p />
                    </div>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter>
                <hr />
              </CardFooter>
            </Card>
          </Col>
          <Col lg="3" md="6" sm="6">
            <Card className="hover-effect card-stats">
              <CardBody>
                <Row>
                  <Col md="4" xs="5">
                    <div className="icon-big text-center icon-warning">
                      <i className="fas fa-bolt text-warning" />
                    </div>
                  </Col>
                  <Col md="8" xs="7">
                    <div className="numbers">
                      <p className="card-category">Power Stations</p>
                      <CardTitle tag="p">{powerGrids}</CardTitle>
                      <p />
                    </div>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter>
                <hr />
                
              </CardFooter>
            </Card>
          </Col>
          <Col lg="3" md="6" sm="6">
            <Card className="hover-effect card-stats">
              <CardBody>
                <Row>
                  <Col md="4" xs="5">
                    <div className="icon-big text-center icon-warning">
                      <i className="fas fa-broadcast-tower text" />
                    </div>
                  </Col>
                  <Col md="8" xs="7">
                    <div className="numbers">
                      <p className="card-category">Base Stations</p>
                      <CardTitle tag="p">{0}</CardTitle>
                      <p />
                    </div>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter>
                <hr />
                
              </CardFooter>
            </Card>
          </Col>
          <Col lg="3" md="6" sm="6">
            <Card className="hover-effect card-stats">
              <CardBody>
                <Row>
                  <Col md="4" xs="5">
                    <div className="icon-big text-center icon-warning">
                      <i className="fas fa-tree text-success" />
                    </div>
                  </Col>
                  <Col md="8" xs="7">
                    <div className="numbers">
                      <p className="card-category">Greenary</p>
                      <CardTitle tag="p">{parks}</CardTitle>
                      <p />
                    </div>
                  </Col>
                </Row>
              </CardBody>
              <CardFooter>
                <hr />
                
              </CardFooter>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h5">Grid Trends</CardTitle>
                <p className="card-category">Live counts and grid share by item type</p>
              </CardHeader>
              <CardBody style={{ height: "320px" }}>
                <Line
                  data={dashboardLineChartData}
                  options={dashboardLineChartOptions}
                  width={400}
                  height={100}
                />
              </CardBody>
              <CardFooter>
                <hr />
                <div className="stats">
                  <i className="fa fa-history" /> Refreshes automatically from the current grid
                </div>
              </CardFooter>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col md="8" className="ml-auto mr-auto">
            <Card>
              <CardHeader>
                <CardTitle tag="h5">Grid Composition</CardTitle>
                <p className="card-category">Live share of all occupied and free cells</p>
              </CardHeader>
              <CardBody
                style={{
                  height: "420px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <div style={{ width: "100%", maxWidth: "440px", height: "100%" }}>
                  <Pie
                    data={dashboardPieChartData}
                    options={dashboardPieChartOptions}
                  />
                </div>
              </CardBody>
              <CardFooter>
                <div className="legend">
                  <i className="fa fa-circle text-warning" /> Houses{" "}
                  <i className="fa fa-circle text-info" /> Commercial{" "}
                  <i className="fa fa-circle text-danger" /> Industries{" "}
                  <i className="fa fa-circle text-success" /> Greenery
                </div>
                <hr />
                <div className="stats">
                  <i className="fa fa-refresh" /> Synced with saved grid items
                </div>
              </CardFooter>
            </Card>
          </Col>
          
        </Row>
  
    

      </div>
    </>
  );
}


export default Dashboard;
