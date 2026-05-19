import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(".data");
const stateFile = path.join(dataDir, "backend-state.json");

function ensureStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(stateFile)) {
    fs.writeFileSync(
      stateFile,
      JSON.stringify({ auditLogs: [], splitReceipts: {}, sessionLogs: [] }, null, 2),
      "utf8",
    );
  }
}

function readStore() {
  ensureStore();
  const raw = fs.readFileSync(stateFile, "utf8");
  return JSON.parse(raw);
}

function writeStore(next) {
  ensureStore();
  fs.writeFileSync(stateFile, JSON.stringify(next, null, 2), "utf8");
}

export function loadPersistentState() {
  const state = readStore();
  return {
    auditLogs: Array.isArray(state.auditLogs) ? state.auditLogs : [],
    splitReceipts: typeof state.splitReceipts === "object" && state.splitReceipts ? state.splitReceipts : {},
    sessionLogs: Array.isArray(state.sessionLogs) ? state.sessionLogs : [],
  };
}

export function persistAuditLog(log) {
  const state = readStore();
  state.auditLogs = [...(state.auditLogs ?? []), log];
  writeStore(state);
}

export function persistSplitReceipt(id, receipt) {
  const state = readStore();
  state.splitReceipts = { ...(state.splitReceipts ?? {}), [id]: receipt };
  writeStore(state);
}

export function persistSessionLog(session) {
  const state = readStore();
  state.sessionLogs = [...(state.sessionLogs ?? []), session];
  writeStore(state);
}
