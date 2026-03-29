import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Table,
  Row,
  Col,
} from "reactstrap";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:5000";
const REFRESH_INTERVAL_MS = 3000;
const GRID_SIZE = 16;
const TOTAL_GRID_CELLS = GRID_SIZE * GRID_SIZE;

const BUILDING_LABELS = [
  { key: "residential", label: "Houses", color: "rgba(255, 193, 7, 0.75)" },
  { key: "commercial", label: "Commercial", color: "rgba(40, 167, 69, 0.75)" },
  { key: "industrial", label: "Industries", color: "rgba(220, 53, 69, 0.75)" },
  { key: "road", label: "Roads", color: "rgba(108, 117, 125, 0.8)" },
  { key: "power-plant", label: "Power Stations", color: "rgba(0, 123, 255, 0.75)" },
  { key: "base-station", label: "Base Stations", color: "rgba(111, 66, 193, 0.75)" },
];

function Statistics() {
  const [buildings, setBuildings] = useState([]);
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadBuildings = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/arrq`);

        if (isMounted && Array.isArray(response.data)) {
          setBuildings(response.data);
          setLastUpdated(new Date().toLocaleTimeString());
        }
      } catch (error) {
        console.error("Failed to refresh statistics:", error);
      }
    };

    loadBuildings();
    const intervalId = window.setInterval(loadBuildings, REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const buildingCounts = buildings.reduce(
    (totals, building) => {
      if (Object.prototype.hasOwnProperty.call(totals, building.buildingType)) {
        totals[building.buildingType] += 1;
      }

      return totals;
    },
    {
      residential: 0,
      commercial: 0,
      industrial: 0,
      road: 0,
      "power-plant": 0,
      "base-station": 0,
    }
  );

  const usedCells = Object.values(buildingCounts).reduce((sum, count) => sum + count, 0);
  const greenery = Math.max(0, TOTAL_GRID_CELLS - usedCells);

  const summaryRows = [
    ...BUILDING_LABELS.map(({ key, label }) => ({
      label,
      count: buildingCounts[key],
      share: ((buildingCounts[key] / TOTAL_GRID_CELLS) * 100).toFixed(1),
    })),
    {
      label: "Greenery",
      count: greenery,
      share: ((greenery / TOTAL_GRID_CELLS) * 100).toFixed(1),
    },
  ];

  const barChartData = {
    labels: [...BUILDING_LABELS.map(({ label }) => label), "Greenery"],
    datasets: [
      {
        label: "Grid Items",
        backgroundColor: [
          ...BUILDING_LABELS.map(({ color }) => color),
          "rgba(25, 135, 84, 0.8)",
        ],
        borderColor: [
          "rgba(255, 193, 7, 1)",
          "rgba(40, 167, 69, 1)",
          "rgba(220, 53, 69, 1)",
          "rgba(108, 117, 125, 1)",
          "rgba(0, 123, 255, 1)",
          "rgba(111, 66, 193, 1)",
          "rgba(25, 135, 84, 1)",
        ],
        borderWidth: 1,
        borderRadius: 8,
        data: [...BUILDING_LABELS.map(({ key }) => buildingCounts[key]), greenery],
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.raw}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
        title: {
          display: true,
          text: "Count",
        },
      },
      x: {
        ticks: {
          maxRotation: 0,
          minRotation: 0,
        },
      },
    },
  };

  return (
    <>
      <div className="content">
        <Row>
          <Col md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h4">Grid Statistics</CardTitle>
                <p className="card-category">
                  Live counts from the planner grid
                  {lastUpdated ? ` • refreshed at ${lastUpdated}` : ""}
                </p>
              </CardHeader>
              <CardBody>
                <Table responsive>
                  <thead className="text-primary">
                    <tr>
                      <th>Grid Item</th>
                      <th>Count</th>
                      <th>Share of 16x16 Grid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryRows.map((row) => (
                      <tr key={row.label}>
                        <td>{row.label}</td>
                        <td>{row.count}</td>
                        <td>{row.share}%</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col md="12">
            <Card className="hover-effect">
              <CardHeader>
                <CardTitle tag="h5">Dynamic Bar Graph</CardTitle>
                <p className="card-category">
                  This chart stays in sync with the current grid items
                </p>
              </CardHeader>
              <CardBody style={{ height: "360px" }}>
                <Bar data={barChartData} options={barChartOptions} />
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default Statistics;
