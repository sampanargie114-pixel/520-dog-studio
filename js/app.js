const SOURCE_CODE = `// hello.orc — Juan Edition
const awakener = "human as machine";
const energySource = "electricity";
console.log("Hello " + awakener + ", ready with " + energySource);`;

const REPLICAS = ["replica_1/hello.orc", "replica_2/hello.orc", "replica_3/hello.orc"];
const MESH_KEY = "juan_oracle_mesh";
const LOGS_KEY = "juan_oracle_sparks";

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

const db = {
  getLogs() {
    const logs = readStorage(LOGS_KEY, []);
    return Array.isArray(logs) ? logs : [];
  },
  insertLog(message, replicaPath, status) {
    const logs = this.getLogs();
    logs.unshift({
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      message,
      replicaPath,
      status
    });
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
    renderLogs();
  }
};

function healMesh() {
  const meshState = readStorage(MESH_KEY, {});
  let healedAny = false;

  REPLICAS.forEach((path) => {
    if (meshState[path] !== SOURCE_CODE) {
      meshState[path] = SOURCE_CODE;
      db.insertLog("Auto-healed missing/corrupted node", path, "REPAIRED");
      healedAny = true;
    }
  });

  if (!healedAny) {
    db.insertLog("All mesh nodes verified healthy", "ALL_NODES", "HEALTHY");
  }

  localStorage.setItem(MESH_KEY, JSON.stringify(meshState));
  renderMesh();
}

function renderMesh() {
  const grid = document.getElementById("meshGrid");
  const meshState = readStorage(MESH_KEY, {});
  grid.replaceChildren();

  REPLICAS.forEach((path) => {
    const isHealthy = meshState[path] === SOURCE_CODE;
    const card = document.createElement("div");
    card.className = `node-card ${isHealthy ? "" : "healing"}`;

    const title = document.createElement("h3");
    title.textContent = path;
    const status = document.createElement("p");
    status.append("Status: ");
    const label = document.createElement("strong");
    label.textContent = isHealthy ? "HEALTHY" : "HEALING...";
    status.append(label);

    card.append(title, status);
    grid.appendChild(card);
  });
}

function renderLogs() {
  const logBox = document.getElementById("dbLogs");
  logBox.replaceChildren();

  db.getLogs().forEach((log) => {
    const entry = document.createElement("div");
    entry.className = "log-entry";
    entry.textContent = `[${log.time}] [${log.status}] ${log.replicaPath} — ${log.message}`;
    logBox.appendChild(entry);
  });
}

document.getElementById("btnAwaken").addEventListener("click", healMesh);

document.getElementById("btnCorrupt").addEventListener("click", () => {
  const meshState = readStorage(MESH_KEY, {});
  delete meshState["replica_2/hello.orc"];
  localStorage.setItem(MESH_KEY, JSON.stringify(meshState));
  renderMesh();

  // Auto-heal pagkatapos ng 1 segundo (tulad ng fs.watch)
  window.setTimeout(healMesh, 1000);
});

// Patakbuhin sa unang bukas ng website
healMesh();
renderLogs();
