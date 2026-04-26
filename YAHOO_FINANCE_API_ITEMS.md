# Yahoo Finance API Request Catalog

This document lists what you can request from Yahoo Finance in this project.

## Currently implemented in your API

- `GET /api/health`
  - Returns API status.
- `GET /api/quote/:symbol`
  - Example: `/api/quote/AAPL`
  - Returns:
    - `symbol`
    - `name`
    - `currency`
    - `marketPrice`
    - `change`
    - `changePercent`
    - `marketState`
    - `marketTime`
    - `targetMeanPrice`
    - `targetLowPrice`
    - `targetHighPrice`
    - `targetMedianPrice`
    - `recommendationMean`
    - `numberOfAnalystOpinions`

## Available Yahoo Finance request types (via `yahoo-finance2`)

These are the main request modules you can expose as additional endpoints:

- `quote(symbol)`
  - Real-time/latest quote snapshot.
- `chart(symbol, options)`
  - Historical/intraday chart data.
  - Common options: `period1`, `period2`, `interval`, `includePrePost`, `events`, `return`.
- `historical(symbol, options)`
  - Historical prices, dividends, or splits.
  - Common options: `period1`, `period2`, `interval`, `events` (`history`, `dividends`, `split`).
- `quoteSummary(symbol, options)`
  - Deep fundamentals/financial modules (see module list below).
- `options(symbol, options?)`
  - Option chain data.
- `insights(symbol)`
  - Analyst and research insights.
- `recommendationsBySymbol(symbol)`
  - Analyst recommendation records.
- `search(query, options?)`
  - Search symbols and related entities.
- `autoc(query, options?)`
  - Autocomplete symbol lookup.
- `screener(options)`
  - Screeners for market instruments.
- `trendingSymbols(region)`
  - Trending symbols by region.
- `dailyGainers(options?)`
  - Daily top gainers.
- `dailyLosers(options?)`
  - Daily top losers.
- `fundamentalsTimeSeries(symbol, options)`
  - Fundamental metrics over time.

## `quoteSummary` sub-modules you can request

When calling `quoteSummary`, you can ask for one or more modules like:

- `assetProfile`
- `balanceSheetHistory`
- `balanceSheetHistoryQuarterly`
- `calendarEvents`
- `cashflowStatementHistory`
- `cashflowStatementHistoryQuarterly`
- `defaultKeyStatistics`
- `earnings`
- `earningsHistory`
- `earningsTrend`
- `financialData`
- `fundOwnership`
- `fundPerformance`
- `fundProfile`
- `incomeStatementHistory`
- `incomeStatementHistoryQuarterly`
- `indexTrend`
- `industryTrend`
- `insiderHolders`
- `insiderTransactions`
- `institutionOwnership`
- `majorDirectHolders`
- `majorHoldersBreakdown`
- `netSharePurchaseActivity`
- `price`
- `quoteType`
- `recommendationTrend`
- `secFilings`
- `sectorTrend`
- `summaryDetail`
- `summaryProfile`
- `topHoldings`
- `upgradeDowngradeHistory`

## Suggested next API endpoints (optional)

If you want, these are the next most useful endpoints to add:

- `GET /api/chart/:symbol?period1=2025-01-01&period2=2026-01-01&interval=1d`
- `GET /api/historical/:symbol?period1=2025-01-01&events=history`
- `GET /api/options/:symbol`
- `GET /api/search?q=apple`
- `GET /api/quote-summary/:symbol?modules=price,summaryDetail,financialData`

## Notes

- Yahoo data availability varies by symbol and market.
- Some modules may return partial data depending on the instrument type (stock, ETF, crypto, fund, etc.).
- For browser apps, keep Yahoo calls server-side (as done in this project) to avoid CORS issues and protect your API surface.
