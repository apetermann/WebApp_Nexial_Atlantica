# ASX no Brasil — pacote do app

App web estático (estilo MiningHub) com as empresas listadas na ASX que operam
no Brasil: mapa interativo + lista lateral com filtros e busca.

## Conteúdo do zip

```
index.html              # página principal
styles.css              # tema escuro
app.js                  # mapa, filtros, busca, popups
data/companies.json     # base de dados (editável)
vendor/leaflet/         # biblioteca do mapa, embarcada (sem CDN)
.github/workflows/      # workflow de deploy no GitHub Pages
README.md               # documentação
```

## Como publicar um link (escolha um)

### Opção A — Netlify Drop (mais rápido, funciona no iPhone) ⭐
1. Baixe o zip e **descompacte** (no iPhone: toque no zip no app Arquivos → ele extrai a pasta).
2. No Safari, abra **https://app.netlify.com/drop**
3. Arraste/selecione a **pasta descompactada** (não o zip). Sai um link público na hora.
   > Importante: envie a pasta com o `index.html` na raiz.

### Opção B — Vercel
1. **https://vercel.com** → New Project → suba a pasta. Link automático.

### Opção C — GitHub Pages
1. Coloque estes arquivos no repositório `WebApp_Nexial_Atlantica`.
2. **Settings → Pages → Source: GitHub Actions** (o workflow já está incluído).
3. Link: `https://apetermann.github.io/WebApp_Nexial_Atlantica/`

## Rodar localmente (computador)

```bash
python3 -m http.server 8000   # abra http://localhost:8000
```

## Editar a lista de empresas

Tudo vive em `data/companies.json`. Cada empresa tem uma lista de `projects`;
cada projeto vira um marcador no mapa. Veja o `README.md` para o formato.

## Avisos
- Dados curados de fontes públicas (jun/2026); coordenadas aproximadas.
- Não é aconselhamento de investimento.
