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
const requestResult = document.getElementById("request-result");

let currentTicker = "AAPL";

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

executeTickerButton?.addEventListener("click", () => {
  const nextTicker = String(tickerInput?.value || "").trim().toUpperCase() || "AAPL";
  currentTicker = nextTicker;
  if (activeTicker) activeTicker.textContent = currentTicker;
  refreshRoutePreview();
});

requestType?.addEventListener("change", refreshRoutePreview);
modulesInput?.addEventListener("input", refreshRoutePreview);
queryInput?.addEventListener("input", refreshRoutePreview);

requestForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  refreshRoutePreview();

  const endpoint = buildEndpoint();
  if (requestResult) requestResult.textContent = "Loading live data...";

  try {
    const response = await fetch(endpoint);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Request failed.");
    if (requestResult) requestResult.textContent = JSON.stringify(payload, null, 2);
  } catch (error) {
    if (requestResult) {
      requestResult.textContent = JSON.stringify(
        { error: error?.message || "Unable to fetch data right now." },
        null,
        2
      );
    }
  }
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
