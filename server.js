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

function parseDate(value) {
  if (!value) return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseModules(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

app.get("/api/chart/:symbol", async (req, res) => {
  try {
    const symbol = String(req.params.symbol || "").trim().toUpperCase();
    if (!symbol) return res.status(400).json({ error: "Symbol is required." });

    const options = {
      period1: parseDate(req.query.period1) || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      interval: req.query.interval || "1d"
    };
    const period2 = parseDate(req.query.period2);
    if (period2) options.period2 = period2;

    const result = await yahooFinance.chart(symbol, options);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch chart data.", details: error?.message });
  }
});

app.get("/api/historical/:symbol", async (req, res) => {
  try {
    const symbol = String(req.params.symbol || "").trim().toUpperCase();
    if (!symbol) return res.status(400).json({ error: "Symbol is required." });

    const options = {
      period1: parseDate(req.query.period1) || new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      interval: req.query.interval || "1d",
      events: req.query.events || "history"
    };
    const period2 = parseDate(req.query.period2);
    if (period2) options.period2 = period2;

    const result = await yahooFinance.historical(symbol, options);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch historical data.", details: error?.message });
  }
});

app.get("/api/options/:symbol", async (req, res) => {
  try {
    const symbol = String(req.params.symbol || "").trim().toUpperCase();
    if (!symbol) return res.status(400).json({ error: "Symbol is required." });
    const result = await yahooFinance.options(symbol);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch options data.", details: error?.message });
  }
});

app.get("/api/search", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    if (!query) return res.status(400).json({ error: "Query parameter q is required." });
    const result = await yahooFinance.search(query);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: "Failed to search symbols.", details: error?.message });
  }
});

app.get("/api/quote-summary/:symbol", async (req, res) => {
  try {
    const symbol = String(req.params.symbol || "").trim().toUpperCase();
    if (!symbol) return res.status(400).json({ error: "Symbol is required." });
    const modules = parseModules(req.query.modules);
    if (!modules.length) {
      return res.status(400).json({ error: "Query parameter modules is required." });
    }
    const result = await yahooFinance.quoteSummary(symbol, { modules });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch quote summary.", details: error?.message });
  }
});

app.get("/api/insights/:symbol", async (req, res) => {
  try {
    const symbol = String(req.params.symbol || "").trim().toUpperCase();
    if (!symbol) return res.status(400).json({ error: "Symbol is required." });
    const result = await yahooFinance.insights(symbol);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch insights.", details: error?.message });
  }
});

app.get("/api/recommendations/:symbol", async (req, res) => {
  try {
    const symbol = String(req.params.symbol || "").trim().toUpperCase();
    if (!symbol) return res.status(400).json({ error: "Symbol is required." });
    const result = await yahooFinance.recommendationsBySymbol(symbol);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch recommendations.", details: error?.message });
  }
});

app.get("/api/trending", async (req, res) => {
  try {
    const region = String(req.query.region || "US");
    const result = await yahooFinance.trendingSymbols(region);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch trending symbols.", details: error?.message });
  }
});

app.get("/api/daily-gainers", async (_req, res) => {
  try {
    const result = await yahooFinance.screener({
      scrIds: "day_gainers",
      count: 25
    });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch daily gainers.", details: error?.message });
  }
});

app.get("/api/daily-losers", async (_req, res) => {
  try {
    const result = await yahooFinance.screener({
      scrIds: "day_losers",
      count: 25
    });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch daily losers.", details: error?.message });
  }
});

app.get("/api/screener", async (req, res) => {
  try {
    const predefined = String(req.query.predefined || "day_gainers");
    const count = parseNumber(req.query.count, 10);
    const result = await yahooFinance.screener({
      scrIds: predefined,
      count
    });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: "Failed to run screener.", details: error?.message });
  }
});

app.listen(PORT, () => {
  console.log(`Yahoo Finance API running on http://localhost:${PORT}`);
});
