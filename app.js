const form = document.getElementById("budget-form");
const result = document.getElementById("result");
const quoteForm = document.getElementById("quote-form");
const quoteResult = document.getElementById("quote-result");

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

quoteForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(quoteForm);
  const symbol = String(formData.get("symbol") || "").trim().toUpperCase();

  if (!symbol) {
    quoteResult.textContent = "Please enter a ticker symbol.";
    return;
  }

  quoteResult.textContent = "Loading quote...";

  try {
    const response = await fetch(`/api/quote/${encodeURIComponent(symbol)}`);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Unable to fetch quote.");
    }

    const currency = payload.currency || "USD";
    const formatter = new Intl.NumberFormat(undefined, { style: "currency", currency });
    const price = formatter.format(payload.marketPrice);
    const changeValue = Number(payload.change || 0);
    const changePercent = Number(payload.changePercent || 0).toFixed(2);
    const sign = changeValue >= 0 ? "+" : "";
    const meanTarget = payload.targetMeanPrice ?? "n/a";
    const lowTarget = payload.targetLowPrice ?? "n/a";
    const highTarget = payload.targetHighPrice ?? "n/a";
    const medianTarget = payload.targetMedianPrice ?? "n/a";
    const recommendationMean = payload.recommendationMean ?? "n/a";
    const analystCount = payload.numberOfAnalystOpinions ?? "n/a";

    quoteResult.textContent = `${payload.name} (${payload.symbol}): ${price} (${sign}${changeValue.toFixed(
      2
    )}, ${sign}${changePercent}%). Targets: mean ${meanTarget}, low ${lowTarget}, high ${highTarget}, median ${medianTarget}. Recommendation mean: ${recommendationMean}. Analysts: ${analystCount}.`;
  } catch (error) {
    quoteResult.textContent = error.message || "Unable to fetch quote right now.";
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./service-worker.js");
    } catch (error) {
      console.error("Service worker registration failed:", error);
    }
  });
}
