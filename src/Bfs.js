const CARDINAL_MOVES = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function isInsideGrid(grid, row, col) {
  return row >= 0 && row < grid.length && col >= 0 && col < grid[0].length;
}

export function findShortestDistance(grid, startRow, startCol, targetValues, traversableValues) {
  if (!isInsideGrid(grid, startRow, startCol)) {
    return Infinity;
  }

  const targetSet = new Set(targetValues);
  const traversableSet = new Set(traversableValues);
  const visited = Array.from({ length: grid.length }, () =>
    Array.from({ length: grid[0].length }, () => false)
  );
  const queue = [[startRow, startCol, 0]];
  visited[startRow][startCol] = true;

  while (queue.length) {
    const [row, col, distance] = queue.shift();

    if (distance > 0 && targetSet.has(grid[row][col])) {
      return distance;
    }

    for (const [dx, dy] of CARDINAL_MOVES) {
      const nextRow = row + dx;
      const nextCol = col + dy;

      if (!isInsideGrid(grid, nextRow, nextCol) || visited[nextRow][nextCol]) {
        continue;
      }

      const nextValue = grid[nextRow][nextCol];
      const canTraverse = traversableSet.has(nextValue) || targetSet.has(nextValue);

      if (!canTraverse) {
        continue;
      }

      visited[nextRow][nextCol] = true;
      queue.push([nextRow, nextCol, distance + 1]);
    }
  }

  return Infinity;
}

export function countAdjacentValues(grid, row, col, targetValues) {
  const targetSet = new Set(targetValues);

  return CARDINAL_MOVES.reduce((count, [dx, dy]) => {
    const nextRow = row + dx;
    const nextCol = col + dy;

    if (!isInsideGrid(grid, nextRow, nextCol)) {
      return count;
    }

    return count + (targetSet.has(grid[nextRow][nextCol]) ? 1 : 0);
  }, 0);
}
