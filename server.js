const express = require("express");
const cors = require("cors");
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("."));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/quote/:symbol", async (req, res) => {
  const symbol = String(req.params.symbol || "").trim().toUpperCase();

  if (!symbol) {
    return res.status(400).json({ error: "Symbol is required." });
  }

  try {
    const [quote, summary] = await Promise.all([
      yahooFinance.quote(symbol),
      yahooFinance.quoteSummary(symbol, { modules: ["financialData"] })
    ]);

    if (!quote || typeof quote.regularMarketPrice !== "number") {
      return res.status(404).json({ error: `No quote found for ${symbol}.` });
    }

    const financialData = summary?.financialData || {};

    return res.json({
      symbol: quote.symbol,
      name: quote.shortName || quote.longName || quote.symbol,
      currency: quote.currency || "USD",
      marketPrice: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      marketState: quote.marketState,
      marketTime: quote.regularMarketTime,
      targetMeanPrice: financialData.targetMeanPrice ?? null,
      targetLowPrice: financialData.targetLowPrice ?? null,
      targetHighPrice: financialData.targetHighPrice ?? null,
      targetMedianPrice: financialData.targetMedianPrice ?? null,
      recommendationMean: financialData.recommendationMean ?? null,
      numberOfAnalystOpinions: financialData.numberOfAnalystOpinions ?? null
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch quote from Yahoo Finance.",
      details: error?.message || "Unknown error"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Yahoo Finance API running on http://localhost:${PORT}`);
});
