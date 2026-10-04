---
title: 'Naïve vs ETS vs ARIMA: forecasting IBM’s share price in R'
description: 'Five forecasting models, one seven-month test window, and why the simplest baseline still matters.'
date: 2026-10-03
tags: ['R', 'Forecasting', 'Time series']
draft: true
---

<!-- DRAFT: the numbers below come from the IBM_stock_price_forecast notebook.
     Rewrite the commentary in your own voice, then set `draft: false`. -->

Before reaching for a complex model, I like to know how far a simple one gets. To test that, I forecast IBM’s monthly adjusted closing price with five models and compared them on data none of them had seen.

## The setup

- **Data:** IBM monthly adjusted close from Yahoo Finance.
- **Training set:** January 2016 to May 2021.
- **Test set:** June to December 2021 (7 months).
- **Metrics:** RMSE, in dollars, and MASE, which compares the error with a naïve forecast's. A MASE below 1 means the model beats the naïve baseline.

## Results

| Model          | RMSE     | MASE     |
| -------------- | -------- | -------- |
| Naïve          | 17.74    | 1.27     |
| Seasonal naïve | 14.94    | 1.01     |
| ETS            | 10.32    | 0.77     |
| NNAR           | 7.42     | 0.46     |
| **ARIMA**      | **5.45** | **0.37** |

ARIMA was the clear winner. It cut the naïve model’s RMSE by about 69%.

## What I took from it

<!-- DRAFT: add 2–3 lessons, e.g. why the neural network didn't win on a short
     monthly series, what the residual checks showed, and what you'd try next. -->

- Baselines matter: without the naïve forecast, an RMSE of 10 for ETS would be hard to judge.
- A more complex model isn't automatically better: the neural network lost to ARIMA on this short monthly series.

The full code and plots are in the [repository on GitHub](https://github.com/AbdoslamB/IBM_stock_price_forecast).
