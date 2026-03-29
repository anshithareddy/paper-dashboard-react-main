const TOTAL_GRID_CELLS = 256;
const NEIGHBOR_OFFSETS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getCellKey(x, y) {
  return `${x},${y}`;
}

function getNeighbors(x, y) {
  return NEIGHBOR_OFFSETS.map(([dx, dy]) => [x + dx, y + dy]);
}

export function getAqiBand(aqi) {
  if (aqi <= 50) {
    return { label: "Good", color: "#2ecc71", advice: "Air is clean and stable." };
  }
  if (aqi <= 100) {
    return { label: "Moderate", color: "#f1c40f", advice: "Conditions are acceptable, but keep green cover growing." };
  }
  if (aqi <= 150) {
    return { label: "Sensitive", color: "#e67e22", advice: "High-emission zones are starting to dominate the layout." };
  }
  if (aqi <= 200) {
    return { label: "Unhealthy", color: "#e74c3c", advice: "Pollution sources are outpacing natural absorption." };
  }
  return { label: "Severe", color: "#8e44ad", advice: "The city mix needs urgent rebalancing." };
}

export function getRewardFromAqi(aqi) {
  if (aqi <= 80) {
    return {
      type: "gold",
      title: "Gold Badge",
      message: "Outstanding air quality. Your city layout is protecting residents well.",
    };
  }
  if (aqi <= 130) {
    return {
      type: "silver",
      title: "Silver Badge",
      message: "Good balance overall, but a few pollution zones still need cleanup.",
    };
  }
  if (aqi <= 180) {
    return {
      type: "bronze",
      title: "Bronze Badge",
      message: "You are on the board, but greener buffers would help a lot.",
    };
  }
  return {
    type: "none",
    title: "No Badge Yet",
    message: "AQI is still too high. Reduce clustered emissions and add more greenery.",
  };
}

export function calculateAqiMetrics(buildings) {
  const counts = buildings.reduce(
    (totals, building) => {
      switch (building.buildingType) {
        case "residential":
          totals.residential += 1;
          break;
        case "commercial":
          totals.commercial += 1;
          break;
        case "industrial":
          totals.industrial += 1;
          break;
        case "power-plant":
          totals.powerPlant += 1;
          break;
        case "road":
          totals.road += 1;
          break;
        case "base-station":
          totals.baseStation += 1;
          break;
        default:
          break;
      }

      return totals;
    },
    {
      residential: 0,
      commercial: 0,
      industrial: 0,
      powerPlant: 0,
      road: 0,
      baseStation: 0,
    }
  );

  const occupiedCells =
    counts.residential +
    counts.commercial +
    counts.industrial +
    counts.powerPlant +
    counts.road +
    counts.baseStation;
  const greenery = Math.max(0, TOTAL_GRID_CELLS - occupiedCells);

  const buildingMap = new Map(
    buildings.map((building) => [getCellKey(building.x, building.y), building.buildingType])
  );

  const adjacencyScore = buildings.reduce((score, building) => {
    const neighbors = getNeighbors(building.x, building.y)
      .map(([x, y]) => buildingMap.get(getCellKey(x, y)))
      .filter(Boolean);

    if (building.buildingType === "industrial" || building.buildingType === "power-plant") {
      const nearbyResidential = neighbors.filter((type) => type === "residential").length;
      const nearbyRoads = neighbors.filter((type) => type === "road").length;
      const nearbyGreenBuffers = 4 - neighbors.length;
      return score + nearbyResidential * 6 + nearbyRoads * 2 - nearbyGreenBuffers * 1.5;
    }

    if (building.buildingType === "road") {
      const nearbyIndustry = neighbors.filter(
        (type) => type === "industrial" || type === "power-plant"
      ).length;
      return score + nearbyIndustry * 1.5;
    }

    return score;
  }, 0);

  const clusterPenalty = buildings.reduce((score, building) => {
    if (building.buildingType !== "industrial" && building.buildingType !== "power-plant") {
      return score;
    }

    const pollutionNeighbors = getNeighbors(building.x, building.y).filter(([x, y]) => {
      const type = buildingMap.get(getCellKey(x, y));
      return type === "industrial" || type === "power-plant";
    }).length;

    return score + pollutionNeighbors * 2.5;
  }, 0);

  const greenBufferBonus = buildings.reduce((bonus, building) => {
    if (building.buildingType !== "residential") {
      return bonus;
    }

    const openEdges = getNeighbors(building.x, building.y).filter(([x, y]) => {
      return !buildingMap.has(getCellKey(x, y));
    }).length;

    return bonus + openEdges * 1.5;
  }, 0);

  const emissionLoad =
    counts.industrial * 8 +
    counts.powerPlant * 12 +
    counts.road * 2.5 +
    counts.commercial * 1.5 +
    counts.residential * 0.8 +
    counts.baseStation * 1.2;

  const greenRelief = greenery * 0.18;
  const densityPenalty = Math.max(0, occupiedCells - 96) * 0.9;
  const imbalancePenalty = Math.max(0, counts.industrial + counts.powerPlant - greenery / 10) * 3.5;
  const activityFloor = occupiedCells * 0.35;

  const airPollutionIndex = clamp(
    Math.round(
      25 +
        emissionLoad +
        activityFloor +
        densityPenalty +
        imbalancePenalty +
        adjacencyScore * 2.4 +
        clusterPenalty * 1.8 -
        greenRelief -
        greenBufferBonus * 1.2
    ),
    0,
    500
  );

  const greenCoverage = clamp(Math.round((greenery / TOTAL_GRID_CELLS) * 100), 0, 100);
  const emissionPressure = clamp(
    Math.round(((emissionLoad + adjacencyScore * 2.4 + clusterPenalty * 1.8) / 260) * 100),
    0,
    100
  );
  const ecoBalance = clamp(
    Math.round(
      100 -
        (counts.industrial * 2.4 +
          counts.powerPlant * 3.2 +
          counts.road * 1.2 -
          greenery * 0.22 +
          adjacencyScore * 0.9 +
          clusterPenalty * 0.7 -
          greenBufferBonus * 1.1)
    ),
    0,
    100
  );

  return {
    airPollutionIndex,
    greenCoverage,
    emissionPressure,
    ecoBalance,
    occupiedCells,
    greenery,
    counts,
    aqiBand: getAqiBand(airPollutionIndex),
    reward: getRewardFromAqi(airPollutionIndex),
  };
}
