# ASX no Brasil 🇧🇷⛏️

App web interativo (estilo [MiningHub](https://mininghub.com)) que mapeia **empresas listadas na ASX (Australian Securities Exchange) com projetos de mineração no Brasil**.

![stack](https://img.shields.io/badge/stack-HTML%20%2B%20Leaflet-2ea043)

## O que faz

- 🗺️ **Mapa interativo** do Brasil com um marcador por projeto, colorido por commodity.
- 📋 **Lista lateral** de empresas com ticker, commodity principal e projetos.
- 🔎 **Busca** por nome, ticker, projeto ou município.
- 🎛️ **Filtros** por commodity e por estado.
- 💬 **Popups** com tipo de depósito, localização, status e link para o site da empresa.

## Como rodar

O app carrega os dados via `fetch`, então precisa de um servidor HTTP local
(abrir o `index.html` direto no navegador é bloqueado pela política de CORS do `file://`).

```bash
# na pasta do projeto
python3 -m http.server 8000
# depois abra http://localhost:8000
```

Ou com Node:

```bash
npx serve .
```

> O mapa (tiles do CARTO/OpenStreetMap) e o Leaflet são carregados via CDN,
> então é necessário acesso à internet no navegador do usuário.

## Estrutura

```
.
├── index.html          # marcação + carregamento do Leaflet
├── styles.css          # tema escuro
├── app.js              # mapa, filtros, busca, renderização
├── data/companies.json # base de dados (editável)
└── README.md
```

## Adicionar / editar empresas

Tudo vive em [`data/companies.json`](data/companies.json). Cada empresa tem
uma lista de `projects`; cada projeto vira um marcador no mapa:

```json
{
  "ticker": "MEI",
  "name": "Meteoric Resources",
  "exchange": "ASX",
  "website": "https://meteoric.com.au",
  "primaryCommodity": "Terras Raras",
  "projects": [
    {
      "name": "Caldeira",
      "commodity": "Terras Raras",
      "type": "Argila iônica (IAC)",
      "state": "MG",
      "municipality": "Poços de Caldas",
      "status": "Desenvolvimento",
      "lat": -21.85,
      "lng": -46.45,
      "note": "Recurso de ~1,5 Bt; licença ambiental preliminar obtida."
    }
  ]
}
```

Cores de commodity e status são configuráveis no topo de `app.js`
(`COMMODITY_COLORS`, `STATUS_COLORS`).

## Cobertura atual

12 empresas / 14 projetos — terras raras, lítio, níquel, minério de ferro,
fosfato/cobre e titânio, concentrados em Minas Gerais, Bahia, Pará, São Paulo,
Rio Grande do Sul e Amazonas.

## Avisos

- **Não é aconselhamento de investimento.** Dados curados de fontes públicas
  (Stockhead, MINING.COM, Yahoo Finance, sites das empresas) em junho/2026.
- **Coordenadas são aproximadas** (nível de município/projeto).
- A lista não é exaustiva — é um ponto de partida fácil de estender.
  Empresas como a Latin Resources (LRS) aparecem marcadas como *Adquirida*
  por terem sido compradas por outras companhias.
