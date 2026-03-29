import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
  Table,
  Input,
  Badge,
} from "reactstrap";
import { countAdjacentValues, findShortestDistance } from "../Bfs";
import {
  buildGridFromBuildings,
  CELL_TYPES,
  getClusterCentroids,
  GRID_SIZE,
  REVERSE_CELL_TYPES,
} from "../graph";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:5000";
const REFRESH_INTERVAL_MS = 3000;
const TRAVERSABLE_VALUES = [CELL_TYPES.empty, CELL_TYPES.road];

function clampScore(value) {
  return Math.max(0, Number(value.toFixed(1)));
}

function distanceToNearest(grid, row, col, targetType) {
  return findShortestDistance(grid, row, col, [CELL_TYPES[targetType]], TRAVERSABLE_VALUES);
}

function clusterAffinity(row, col, centroids, invert = false) {
  if (!centroids.length) {
    return 0;
  }

  const distances = centroids.map((centroid) =>
    Math.sqrt((row - centroid.x) ** 2 + (col - centroid.y) ** 2)
  );
  const nearest = Math.min(...distances);
  const score = Math.max(0, 12 - nearest * 2);
  return invert ? 12 - score : score;
}

function getSuitabilityScores(buildings, grid, row, col) {
  const roadDistance = distanceToNearest(grid, row, col, "road");
  const residentialDistance = distanceToNearest(grid, row, col, "residential");
  const commercialDistance = distanceToNearest(grid, row, col, "commercial");
  const industrialDistance = distanceToNearest(grid, row, col, "industrial");
  const powerDistance = distanceToNearest(grid, row, col, "power-plant");

  const adjacentRoads = countAdjacentValues(grid, row, col, [CELL_TYPES.road]);
  const adjacentEmpty = countAdjacentValues(grid, row, col, [CELL_TYPES.empty]);
  const adjacentResidential = countAdjacentValues(grid, row, col, [CELL_TYPES.residential]);
  const adjacentIndustry = countAdjacentValues(grid, row, col, [
    CELL_TYPES.industrial,
    CELL_TYPES["power-plant"],
  ]);

  const residentialClusters = getClusterCentroids(buildings, "residential", 3);
  const commercialClusters = getClusterCentroids(buildings, "commercial", 2);
  const industrialClusters = getClusterCentroids(buildings, "industrial", 2);
  const powerClusters = getClusterCentroids(buildings, "power-plant", 2);

  const scores = {
    residential: clampScore(
      28 +
        Math.max(0, 12 - roadDistance * 1.6) +
        Math.max(0, 10 - commercialDistance * 1.3) +
        clusterAffinity(row, col, residentialClusters) +
        adjacentEmpty * 2.2 -
        Math.max(0, 14 - industrialDistance * 2.8) -
        Math.max(0, 12 - powerDistance * 2.6) -
        adjacentIndustry * 3
    ),
    commercial: clampScore(
      24 +
        Math.max(0, 12 - roadDistance * 1.4) +
        Math.max(0, 10 - residentialDistance * 1.1) +
        clusterAffinity(row, col, commercialClusters) +
        adjacentRoads * 2.5 -
        Math.max(0, 8 - powerDistance * 1.8)
    ),
    industrial: clampScore(
      22 +
        Math.max(0, 14 - roadDistance * 1.2) +
        clusterAffinity(row, col, industrialClusters) +
        clusterAffinity(row, col, residentialClusters, true) +
        Math.max(0, residentialDistance * 1.8) +
        adjacentRoads * 2 -
        adjacentResidential * 4
    ),
    "power-plant": clampScore(
      18 +
        Math.max(0, 12 - roadDistance * 1.1) +
        clusterAffinity(row, col, powerClusters) +
        clusterAffinity(row, col, residentialClusters, true) +
        Math.max(0, industrialDistance * 0.8) -
        adjacentResidential * 5
    ),
    road: clampScore(
      20 +
        Math.max(0, 16 - residentialDistance * 1.1) +
        Math.max(0, 12 - commercialDistance * 1.2) +
        adjacentRoads * 6 +
        adjacentResidential * 1.5 -
        adjacentIndustry
    ),
    "base-station": clampScore(
      23 +
        Math.max(0, 10 - residentialDistance) +
        Math.max(0, 10 - commercialDistance) +
        clusterAffinity(row, col, residentialClusters) * 0.7 +
        clusterAffinity(row, col, commercialClusters) * 0.6 +
        adjacentEmpty * 1.5 -
        Math.max(0, 8 - powerDistance * 1.8)
    ),
  };

  return Object.entries(scores)
    .map(([type, score]) => ({ type, score }))
    .sort((a, b) => b.score - a.score);
}

function Typography() {
  const [buildings, setBuildings] = useState([]);
  const [lastUpdated, setLastUpdated] = useState("");
  const [loadError, setLoadError] = useState("");
  const [selectedRow, setSelectedRow] = useState(0);
  const [selectedCol, setSelectedCol] = useState(0);

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
        console.error("Failed to refresh grid advisor:", error);

        if (isMounted) {
          setLoadError("Grid advisor is waiting for backend data.");
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

  const grid = useMemo(() => buildGridFromBuildings(buildings), [buildings]);
  const currentCellValue = grid[selectedRow]?.[selectedCol] ?? CELL_TYPES.empty;
  const currentCellType = REVERSE_CELL_TYPES[currentCellValue];
  const recommendationScores = useMemo(
    () => getSuitabilityScores(buildings, grid, selectedRow, selectedCol),
    [buildings, grid, selectedRow, selectedCol]
  );

  const topRecommendation = recommendationScores[0];
  const clusterSummary = useMemo(
    () =>
      [
        { label: "Residential Clusters", value: getClusterCentroids(buildings, "residential", 3) },
        { label: "Commercial Clusters", value: getClusterCentroids(buildings, "commercial", 2) },
        { label: "Industrial Clusters", value: getClusterCentroids(buildings, "industrial", 2) },
      ].map((item) => ({
        ...item,
        text:
          item.value.length > 0
            ? item.value.map((point) => `(${point.x.toFixed(1)}, ${point.y.toFixed(1)})`).join(", ")
            : "No cluster yet",
      })),
    [buildings]
  );

  const isOccupied = currentCellValue !== CELL_TYPES.empty;

  return (
    <>
      <div className="content">
        <Row>
          <Col md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h4">Grid Suitability Advisor</CardTitle>
                <p className="card-category">
                  Uses BFS distance and k-means clustering to suggest the best item for a selected grid cell
                  {lastUpdated ? ` • refreshed at ${lastUpdated}` : ""}
                </p>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col md="3">
                    <label style={{ fontWeight: 600 }}>Row</label>
                    <Input
                      type="number"
                      min="0"
                      max={GRID_SIZE - 1}
                      value={selectedRow}
                      onChange={(event) => setSelectedRow(Number(event.target.value))}
                    />
                  </Col>
                  <Col md="3">
                    <label style={{ fontWeight: 600 }}>Column</label>
                    <Input
                      type="number"
                      min="0"
                      max={GRID_SIZE - 1}
                      value={selectedCol}
                      onChange={(event) => setSelectedCol(Number(event.target.value))}
                    />
                  </Col>
                  <Col md="6" style={{ display: "flex", alignItems: "end" }}>
                    <div>
                      <Badge color={isOccupied ? "warning" : "success"} pill style={{ padding: "8px 14px" }}>
                        {isOccupied
                          ? `Cell occupied by ${currentCellType}`
                          : `Cell (${selectedRow}, ${selectedCol}) is empty`}
                      </Badge>
                    </div>
                  </Col>
                </Row>

                {loadError ? (
                  <p style={{ marginTop: 18, color: "#e74c3c", fontWeight: 600 }}>{loadError}</p>
                ) : null}

                <Row style={{ marginTop: 20 }}>
                  <Col lg="5">
                    <div
                      style={{
                        background: "#f8fafc",
                        borderRadius: 18,
                        padding: 22,
                        boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
                        minHeight: 220,
                      }}
                    >
                      <h5 style={{ marginBottom: 12 }}>Best Fit for This Cell</h5>
                      {isOccupied ? (
                        <p style={{ marginBottom: 0 }}>
                          This grid is already used by <strong>{currentCellType}</strong>. Pick an empty cell to see the best next item.
                        </p>
                      ) : (
                        <>
                          <h3 style={{ marginBottom: 8 }}>{topRecommendation?.type}</h3>
                          <p style={{ marginBottom: 8 }}>
                            Suitability score: <strong>{topRecommendation?.score}</strong>
                          </p>
                          <p style={{ marginBottom: 0, color: "#7b809a" }}>
                            Recommendation is based on nearest roads, nearby demand, distance from pollution sources, and cluster alignment.
                          </p>
                        </>
                      )}
                    </div>
                  </Col>
                  <Col lg="7">
                    <div
                      style={{
                        background: "#f8fafc",
                        borderRadius: 18,
                        padding: 22,
                        boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
                        minHeight: 220,
                      }}
                    >
                      <h5 style={{ marginBottom: 12 }}>Cluster Summary</h5>
                      {clusterSummary.map((cluster) => (
                        <p key={cluster.label} style={{ marginBottom: 10 }}>
                          <strong>{cluster.label}:</strong> {cluster.text}
                        </p>
                      ))}
                    </div>
                  </Col>
                </Row>

                <Row style={{ marginTop: 20 }}>
                  <Col md="12">
                    <Table responsive>
                      <thead className="text-primary">
                        <tr>
                          <th>Candidate Item</th>
                          <th>Suitability Score</th>
                          <th>Recommendation Rank</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recommendationScores.map((item, index) => (
                          <tr key={item.type}>
                            <td>{item.type}</td>
                            <td>{item.score}</td>
                            <td>#{index + 1}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default Typography;
