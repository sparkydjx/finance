const form = document.getElementById("budget-form");
const result = document.getElementById("result");
const requestForm = document.getElementById("request-form");
const requestType = document.getElementById("request-type");
const tickerInput = document.getElementById("ticker-input");
const executeTickerButton = document.getElementById("execute-ticker");
const activeTicker = document.getElementById("active-ticker");
const modulesInput = document.getElementById("modules");
const queryInput = document.getElementById("query-input");
const routePreview = document.getElementById("route-preview");
const requestResultBody = document.getElementById("request-result-body");

let currentTicker = "AAPL";
const RESULT_COLUMNS = [
  "symbol",
  "name",
  "marketPrice",
  "change",
  "changePercent",
  "marketTime",
  "targetMeanPrice",
  "targetLowPrice",
  "targetHighPrice",
  "targetMedianPrice",
  "recommendationMean",
  "numberOfAnalystOpinions"
];

function formatCellValue(column, value) {
  if (value === undefined || value === null) return "";
  if (column === "marketTime") return String(value);
  if (typeof value === "number") return value.toFixed(2);
  const maybeNumber = Number(value);
  if (!Number.isNaN(maybeNumber) && Number.isFinite(maybeNumber)) return maybeNumber.toFixed(2);
  return String(value);
}

function renderMessageRow(message) {
  if (!requestResultBody) return;
  requestResultBody.innerHTML = "";
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = RESULT_COLUMNS.length;
  cell.textContent = message;
  row.appendChild(cell);
  requestResultBody.appendChild(row);
}

function renderDataRow(payload) {
  if (!requestResultBody) return;
  requestResultBody.innerHTML = "";
  const row = document.createElement("tr");
  RESULT_COLUMNS.forEach((column) => {
    const cell = document.createElement("td");
    const value = payload?.[column];
    cell.textContent = formatCellValue(column, value);
    row.appendChild(cell);
  });
  requestResultBody.appendChild(row);
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const income = Number(formData.get("income"));
  const expenses = Number(formData.get("expenses"));
  const balance = income - expenses;
  const formatter = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" });

  result.textContent =
    balance >= 0
      ? `You are ahead by ${formatter.format(balance)}.`
      : `You are over budget by ${formatter.format(Math.abs(balance))}.`;
});

function buildEndpoint() {
  const type = requestType?.value || "quote";
  const symbol = currentTicker || "AAPL";
  const modules = (modulesInput?.value || "price,summaryDetail,financialData").trim();
  const query = (queryInput?.value || "").trim();

  if (type === "quote") return `/api/quote/${encodeURIComponent(symbol)}`;
  if (type === "chart")
    return `/api/chart/${encodeURIComponent(symbol)}?period1=2025-01-01&period2=2026-01-01&interval=1d`;
  if (type === "historical")
    return `/api/historical/${encodeURIComponent(symbol)}?period1=2025-01-01&events=history`;
  if (type === "options") return `/api/options/${encodeURIComponent(symbol)}`;
  if (type === "search") return `/api/search?q=${encodeURIComponent(query || symbol)}`;
  if (type === "quoteSummary")
    return `/api/quote-summary/${encodeURIComponent(symbol)}?modules=${encodeURIComponent(modules)}`;
  if (type === "insights") return `/api/insights/${encodeURIComponent(symbol)}`;
  if (type === "recommendationsBySymbol") return `/api/recommendations/${encodeURIComponent(symbol)}`;
  if (type === "trendingSymbols") return `/api/trending?region=${encodeURIComponent(query || "US")}`;
  if (type === "dailyGainers") return "/api/daily-gainers";
  if (type === "dailyLosers") return "/api/daily-losers";
  return `/api/screener?predefined=${encodeURIComponent(query || "day_gainers")}&count=10`;
}

function refreshRoutePreview() {
  if (routePreview) routePreview.textContent = buildEndpoint();
}

async function runLiveRequest() {
  refreshRoutePreview();
  const endpoint = buildEndpoint();
  renderMessageRow("Loading live data...");

  try {
    const response = await fetch(endpoint);
    const contentType = response.headers.get("content-type") || "";
    const rawBody = await response.text();

    if (!contentType.includes("application/json")) {
      throw new Error(
        "API returned HTML instead of JSON. This usually means the backend is not running (or you are on GitHub Pages, which is static-only). Run with `npm start` locally or deploy the API separately."
      );
    }

    const payload = JSON.parse(rawBody);
    if (!response.ok) {
      const details = payload?.details ? ` (${payload.details})` : "";
      throw new Error(`${payload.error || "Request failed."}${details}`);
    }
    const canRenderRow =
      payload && typeof payload === "object" && !Array.isArray(payload) && RESULT_COLUMNS.some((key) => key in payload);
    if (!canRenderRow) {
      renderMessageRow("This response does not match the Sheet1 quote format. Use request type: quote(symbol).");
      return;
    }
    renderDataRow(payload);
  } catch (error) {
    renderMessageRow(error?.message || "Unable to fetch data right now.");
  }
}

function applyTickerAndRun() {
  const nextTicker = String(tickerInput?.value || "").trim().toUpperCase() || "AAPL";
  currentTicker = nextTicker;
  if (activeTicker) activeTicker.textContent = currentTicker;
  runLiveRequest();
}

executeTickerButton?.addEventListener("click", applyTickerAndRun);

tickerInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    applyTickerAndRun();
  }
});

requestType?.addEventListener("change", runLiveRequest);
modulesInput?.addEventListener("change", runLiveRequest);
queryInput?.addEventListener("change", runLiveRequest);

requestForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  runLiveRequest();
});

refreshRoutePreview();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./service-worker.js");
    } catch (error) {
      console.error("Service worker registration failed:", error);
    }
  });
}
