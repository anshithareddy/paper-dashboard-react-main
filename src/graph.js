export const GRID_SIZE = 16;

export const CELL_TYPES = {
  empty: 0,
  residential: 1,
  commercial: 2,
  industrial: 3,
  road: 4,
  "power-plant": 5,
  "base-station": 6,
};

export const REVERSE_CELL_TYPES = Object.fromEntries(
  Object.entries(CELL_TYPES).map(([key, value]) => [value, key])
);

export function createEmptyGrid() {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => CELL_TYPES.empty)
  );
}

export function buildGridFromBuildings(buildings) {
  const grid = createEmptyGrid();

  buildings.forEach((building) => {
    const { x, y, buildingType } = building;

    if (
      Number.isInteger(x) &&
      Number.isInteger(y) &&
      x >= 0 &&
      x < GRID_SIZE &&
      y >= 0 &&
      y < GRID_SIZE &&
      Object.prototype.hasOwnProperty.call(CELL_TYPES, buildingType)
    ) {
      grid[x][y] = CELL_TYPES[buildingType];
    }
  });

  return grid;
}

export function getEmptyCells(grid) {
  const cells = [];

  grid.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value === CELL_TYPES.empty) {
        cells.push({ row: rowIndex, col: colIndex });
      }
    });
  });

  return cells;
}

function getSquaredDistance(point, centroid) {
  return (point.x - centroid.x) ** 2 + (point.y - centroid.y) ** 2;
}

export function runKMeans(points, clusterCount) {
  if (!points.length) {
    return [];
  }

  const k = Math.max(1, Math.min(clusterCount, points.length));
  let centroids = points.slice(0, k).map((point) => ({ x: point.x, y: point.y }));

  for (let iteration = 0; iteration < 10; iteration += 1) {
    const clusters = Array.from({ length: k }, () => []);
    const currentCentroids = [...centroids];

    for (const point of points) {
      let bestIndex = 0;
      let bestDistance = Infinity;

      currentCentroids.forEach((centroid, index) => {
        const distance = getSquaredDistance(point, centroid);

        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });

      clusters[bestIndex].push(point);
    }

    const nextCentroids = [];

    for (let index = 0; index < k; index += 1) {
      if (!clusters[index].length) {
        nextCentroids.push(currentCentroids[index]);
        continue;
      }

      const totals = clusters[index].reduce(
        (sum, point) => ({
          x: sum.x + point.x,
          y: sum.y + point.y,
        }),
        { x: 0, y: 0 }
      );

      nextCentroids.push({
        x: totals.x / clusters[index].length,
        y: totals.y / clusters[index].length,
      });
    }

    centroids = nextCentroids;
  }

  return centroids;
}

export function getClusterCentroids(buildings, buildingType, desiredClusters = 2) {
  const points = buildings
    .filter((building) => building.buildingType === buildingType)
    .map((building) => ({ x: building.x, y: building.y }));

  return runKMeans(points, desiredClusters);
}
