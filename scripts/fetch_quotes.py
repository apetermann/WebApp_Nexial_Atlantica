# -*- coding: utf-8 -*-
"""
Busca preço da ação e valor de mercado de cada empresa em data/companies.json
e grava data/quotes.json. Usado pelo workflow .github/workflows/update-quotes.yml
(roda diariamente) e pode ser rodado localmente: python scripts/fetch_quotes.py

Requer: pip install yfinance
"""
import json
import os
import time
from datetime import datetime, timezone

import yfinance as yf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COMPANIES = os.path.join(ROOT, "data", "companies.json")
OUT = os.path.join(ROOT, "data", "quotes.json")

# Sufixo do símbolo no Yahoo Finance por bolsa.
SUFFIX = {"ASX": ".AX", "TSX": ".TO", "TSX.V": ".V", "NASDAQ": ""}
# Moeda de negociação por bolsa (fallback se o Yahoo não informar).
CURRENCY = {"ASX": "AUD", "TSX": "CAD", "TSX.V": "CAD", "NASDAQ": "USD"}
# Exceções: empresas cujo símbolo principal não segue a regra acima.
OVERRIDE = {
    "TSX:NEXA": "NEXA",  # Nexa Resources negocia principalmente na NYSE
}


def symbol_for(c):
    uid = f"{c['exchange']}:{c['ticker']}"
    if uid in OVERRIDE:
        return OVERRIDE[uid]
    return c["ticker"] + SUFFIX.get(c["exchange"], "")


def fetch_one(sym, fallback_currency):
    price = mcap = currency = None
    t = yf.Ticker(sym)
    try:
        fi = t.fast_info
        price = getattr(fi, "last_price", None)
        mcap = getattr(fi, "market_cap", None)
        currency = getattr(fi, "currency", None)
    except Exception:
        pass
    if price is None or mcap is None or currency is None:
        try:
            info = t.info or {}
            price = price or info.get("currentPrice") or info.get("regularMarketPrice")
            mcap = mcap or info.get("marketCap")
            currency = currency or info.get("currency")
        except Exception:
            pass
    return (
        round(float(price), 4) if price else None,
        int(mcap) if mcap else None,
        currency or fallback_currency,
    )


def main():
    companies = json.load(open(COMPANIES, encoding="utf-8"))["companies"]
    quotes = {}
    ok = 0
    for c in companies:
        uid = f"{c['exchange']}:{c['ticker']}"
        sym = symbol_for(c)
        rec = {"symbol": sym, "price": None, "marketCap": None,
               "currency": CURRENCY.get(c["exchange"])}
        try:
            price, mcap, currency = fetch_one(sym, CURRENCY.get(c["exchange"]))
            rec.update(price=price, marketCap=mcap, currency=currency)
            if price is not None:
                ok += 1
        except Exception as e:
            rec["error"] = str(e)[:120]
        quotes[uid] = rec
        print(f"{uid:14s} {sym:10s} -> price={rec['price']} cap={rec['marketCap']} {rec['currency']}")
        time.sleep(0.25)

    result = {
        "asOf": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "count": len(quotes),
        "withPrice": ok,
        "quotes": quotes,
    }
    json.dump(result, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"\nGravado {OUT}: {ok}/{len(quotes)} com preço.")


if __name__ == "__main__":
    main()
