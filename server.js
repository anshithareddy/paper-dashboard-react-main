const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT) || 5000;
const DB_FILE_PATH = path.join(__dirname, "src", "db.json");

// Basic CORS support without extra dependency.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

app.use((err, _req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON body." });
  }

  return next(err);
});

function ensureDatabaseDirectory() {
  fs.mkdirSync(path.dirname(DB_FILE_PATH), { recursive: true });
}

function isValidBuilding(building) {
  return (
    building &&
    typeof building === "object" &&
    Number.isInteger(building.x) &&
    Number.isInteger(building.y) &&
    typeof building.buildingType === "string"
  );
}

function readBuildings() {
  ensureDatabaseDirectory();

  if (!fs.existsSync(DB_FILE_PATH)) {
    fs.writeFileSync(DB_FILE_PATH, "[]\n");
  }

  const raw = fs.readFileSync(DB_FILE_PATH, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("Database file must contain an array.");
  }

  return parsed;
}

function writeBuildings(buildings) {
  ensureDatabaseDirectory();
  fs.writeFileSync(DB_FILE_PATH, `${JSON.stringify(buildings, null, 2)}\n`);
}

function normalizeArrqPayload(body) {
  if (Array.isArray(body)) {
    return body;
  }

  if (Array.isArray(body?.arrq)) {
    return body.arrq;
  }

  return null;
}

app.get("/health", (_req, res) => {
  let buildingCount = 0;

  try {
    buildingCount = readBuildings().length;
  } catch (error) {
    console.error("Health check could not read DB file:", error);
  }

  res.json({ ok: true, host: HOST, port: PORT, buildingCount });
});

app.get("/arrq", (_req, res) => {
  try {
    return res.json(readBuildings());
  } catch (error) {
    console.error("Error reading arrq from file:", error);
    return res.status(500).json({ error: "Error reading arrq from file" });
  }
});

app.post("/save-arrq", (req, res) => {
  const arrq = normalizeArrqPayload(req.body);

  if (!arrq) {
    return res.status(400).json({
      error: "Invalid payload. Expected an array or body: { arrq: [...] }",
    });
  }

  if (!arrq.every(isValidBuilding)) {
    return res.status(400).json({
      error:
        "Invalid building data. Each item must include integer x, integer y, and string buildingType.",
    });
  }

  try {
    writeBuildings(arrq);
    return res.json({
      message: "Arrq saved to file successfully.",
      count: arrq.length,
    });
  } catch (error) {
    console.error("Error writing arrq to file:", error);
    return res.status(500).json({ error: "Error writing arrq to file" });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

if (require.main === module) {
  const server = app.listen(PORT, HOST, () => {
    console.log(`Server is running at http://${HOST}:${PORT}`);
    console.log(`Writing data to: ${DB_FILE_PATH}`);
  });

  server.on("error", (error) => {
    console.error("Server failed to start:", error);
    process.exit(1);
  });
}

module.exports = app;
