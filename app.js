const requestForm = document.getElementById("request-form");
const requestType = document.getElementById("request-type");
const tickerInput = document.getElementById("ticker-input");
const executeTickerButton = document.getElementById("execute-ticker");
const activeTicker = document.getElementById("active-ticker");
const modulesInput = document.getElementById("modules");
const queryInput = document.getElementById("query-input");
const routePreview = document.getElementById("route-preview");
const requestStatus = document.getElementById("request-status");
const requestResultBody = document.getElementById("request-result-body");
const requestResultTable = document.getElementById("request-result-table");
const buildVersion = document.getElementById("build-version");
const APP_BUILD = "v12";

let currentTicker = "AAPL";
const tableRows = [];
const sortState = {
  column: null,
  direction: "asc"
};
const RESULT_COLUMNS = [
  "symbol",
  "name",
  "marketPrice",
  "change",
  "marketTime",
  "targetMeanPrice",
  "meanPercentChange",
  "targetLowPrice",
  "targetHighPrice",
  "targetMedianPrice",
  "medianPercentChange",
  "recommendationMean",
  "numberOfAnalystOpinions"
];

function formatMarketTime(value) {
  if (value === undefined || value === null || String(value).trim() === "") return "";

  let rawValue = value;
  if (typeof rawValue === "string" && /^-?\d+(\.\d+)?$/.test(rawValue.trim())) {
    rawValue = Number(rawValue.trim());
  }

  let parsedDate;
  if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
    const timestampMs = Math.abs(rawValue) < 1e12 ? rawValue * 1000 : rawValue;
    parsedDate = new Date(timestampMs);
  } else {
    parsedDate = new Date(rawValue);
  }

  if (Number.isNaN(parsedDate.getTime())) return String(value);

  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  const year = String(parsedDate.getFullYear());
  const hour = String(parsedDate.getHours()).padStart(2, "0");
  const minute = String(parsedDate.getMinutes()).padStart(2, "0");

  return `${month}/${day}/${year} ${hour}:${minute}`;
}

function formatCellValue(column, value) {
  if (value === undefined || value === null) return "";
  if (column === "marketTime") return formatMarketTime(value);

  const currencyColumns = new Set([
    "marketPrice",
    "change",
    "targetMeanPrice",
    "targetLowPrice",
    "targetHighPrice",
    "targetMedianPrice"
  ]);

  const numericValue =
    typeof value === "number" ? value : Number(String(value).replace(/,/g, "").trim());
  const hasNumericValue = Number.isFinite(numericValue);

  if ((column === "meanPercentChange" || column === "medianPercentChange") && hasNumericValue) {
    return `${(numericValue * 100).toFixed(2)}%`;
  }

  if (currencyColumns.has(column) && hasNumericValue) {
    return numericValue.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  if (column === "recommendationMean" && hasNumericValue) {
    return numericValue.toFixed(3);
  }

  if (column === "numberOfAnalystOpinions" && hasNumericValue) {
    return Math.round(numericValue).toString();
  }

  if (hasNumericValue) return numericValue.toFixed(2);
  return String(value);
}

function renderMessageRow(message) {
  if (!requestResultBody) return;
  requestResultBody.innerHTML = "";
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = RESULT_COLUMNS.length + 1;
  cell.textContent = message;
  row.appendChild(cell);
  requestResultBody.appendChild(row);
}

function setStatus(message) {
  if (requestStatus) requestStatus.textContent = message;
}

function renderTableRows() {
  if (!requestResultBody) return;

  if (!tableRows.length) {
    renderMessageRow("Live API output will appear automatically.");
    return;
  }

  requestResultBody.innerHTML = "";
  const sortedRows = getSortedRows();
  sortedRows.forEach((payload) => {
    const row = document.createElement("tr");

    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "row-delete-btn";
    deleteButton.dataset.rowId = payload._rowId;
    deleteButton.textContent = "Delete";
    actionCell.appendChild(deleteButton);
    row.appendChild(actionCell);

    RESULT_COLUMNS.forEach((column, columnIndex) => {
      const cell = document.createElement("td");
      const value = payload?.[column];
      cell.textContent = formatCellValue(column, value);
      cell.classList.add(columnIndex < 5 ? "group-general-cell" : "group-analyst-cell");
      row.appendChild(cell);
    });

    requestResultBody.appendChild(row);
  });
}

function addResultRow(payload) {
  const incomingSymbol = String(payload?.symbol || "").trim().toUpperCase();
  const alreadyExists = tableRows.some(
    (row) => String(row?.symbol || "").trim().toUpperCase() === incomingSymbol
  );
  if (incomingSymbol && alreadyExists) {
    setStatus(`${incomingSymbol} is already in the table. Duplicate rows are blocked.`);
    return false;
  }

  const marketPrice = Number(payload?.marketPrice);
  const meanPrice = Number(payload?.targetMeanPrice);
  const medianPrice = Number(payload?.targetMedianPrice);
  const meanPercentChange =
    Number.isFinite(marketPrice) && marketPrice !== 0 && Number.isFinite(meanPrice)
      ? meanPrice / marketPrice - 1
      : null;
  const medianPercentChange =
    Number.isFinite(marketPrice) && marketPrice !== 0 && Number.isFinite(medianPrice)
      ? medianPrice / marketPrice - 1
      : null;

  const normalized = {
    _rowId: `${Date.now()}-${Math.random()}`,
    ...payload,
    meanPercentChange,
    medianPercentChange
  };
  tableRows.unshift(normalized);
  renderTableRows();
  return true;
}

function getColumnSortType(column) {
  const populatedValues = tableRows.map((row) => row?.[column]).filter((value) => value !== undefined && value !== null && String(value).trim() !== "");
  if (!populatedValues.length) return "string";
  const allNumeric = populatedValues.every((value) => {
    if (typeof value === "number") return Number.isFinite(value);
    const normalized = String(value).replace(/,/g, "").trim();
    if (normalized === "") return false;
    return Number.isFinite(Number(normalized));
  });
  return allNumeric ? "number" : "string";
}

function compareValues(aValue, bValue, column, direction) {
  const multiplier = direction === "asc" ? 1 : -1;
  const sortType = getColumnSortType(column);

  if (sortType === "number") {
    const normalizeNumber = (value) => {
      if (value === undefined || value === null || String(value).trim() === "") return direction === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
      if (typeof value === "number") return value;
      return Number(String(value).replace(/,/g, "").trim());
    };
    return (normalizeNumber(aValue) - normalizeNumber(bValue)) * multiplier;
  }

  const aText = (aValue ?? "").toString().toLowerCase();
  const bText = (bValue ?? "").toString().toLowerCase();
  return aText.localeCompare(bText, undefined, { numeric: true }) * multiplier;
}

function getSortedRows() {
  if (!sortState.column) return [...tableRows];
  return [...tableRows].sort((a, b) => compareValues(a?.[sortState.column], b?.[sortState.column], sortState.column, sortState.direction));
}

function updateHeaderSortIndicators() {
  if (!requestResultTable) return;
  const sortableHeaders = requestResultTable.querySelectorAll("thead th[data-column]");
  sortableHeaders.forEach((header) => {
    const column = header.dataset.column;
    if (!column) return;

    header.classList.remove("sort-asc", "sort-desc");
    header.removeAttribute("aria-sort");

    if (sortState.column === column) {
      const isAsc = sortState.direction === "asc";
      header.classList.add(isAsc ? "sort-asc" : "sort-desc");
      header.setAttribute("aria-sort", isAsc ? "ascending" : "descending");
    } else {
      header.setAttribute("aria-sort", "none");
    }
  });
}

function attachHeaderSorting() {
  if (!requestResultTable) return;
  const sortableHeaders = requestResultTable.querySelectorAll("thead th[data-column]");
  sortableHeaders.forEach((header) => {
    header.classList.add("sortable-column");
    header.tabIndex = 0;

    const activateSort = () => {
      const column = header.dataset.column;
      if (!column) return;

      if (sortState.column === column) {
        sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
      } else {
        sortState.column = column;
        sortState.direction = "asc";
      }

      updateHeaderSortIndicators();
      renderTableRows();
    };

    header.addEventListener("click", activateSort);
    header.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activateSort();
      }
    });
  });

  updateHeaderSortIndicators();
}

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
  setStatus(`Loading: ${endpoint}`);
  if (!tableRows.length) renderMessageRow("Loading live data...");

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
      setStatus("Response does not match quote row format. Use request type: quote(symbol).");
      if (!tableRows.length) {
        renderMessageRow("This response does not match the Sheet1 quote format. Use request type: quote(symbol).");
      }
      return;
    }
    if (addResultRow(payload)) {
      setStatus(`Added ${payload.symbol || currentTicker}. Rows: ${tableRows.length}`);
    }
  } catch (error) {
    setStatus(error?.message || "Unable to fetch data right now.");
    if (!tableRows.length) renderMessageRow(error?.message || "Unable to fetch data right now.");
  }
}

function applyTickerAndRun() {
  const nextTicker = String(tickerInput?.value || "").trim().toUpperCase() || "AAPL";
  currentTicker = nextTicker;
  if (activeTicker) activeTicker.textContent = currentTicker;
  if (requestType) requestType.value = "quote";
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

requestResultBody?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const rowId = target.dataset?.rowId;
  if (!rowId) return;
  const nextRows = tableRows.filter((row) => row._rowId !== rowId);
  tableRows.length = 0;
  tableRows.push(...nextRows);
  renderTableRows();
});

refreshRoutePreview();
if (buildVersion) buildVersion.textContent = APP_BUILD;
setStatus(`Ready. (${APP_BUILD})`);
attachHeaderSorting();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const isLocalHost =
        window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (isLocalHost) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      } else {
        await navigator.serviceWorker.register("./service-worker.js");
      }
    } catch (error) {
      console.error("Service worker registration failed:", error);
    }
  });
}
