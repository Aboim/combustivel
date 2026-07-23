# FuelSmart Portugal (COMBUSTIVEL)

Directorio nacional de precos de combustiveis e postos de carregamento eletrico em Portugal.

## Stack

- **Frontend:** Vanilla HTML/CSS/JS, Leaflet.js, Leaflet.markercluster
- **Backend:** Node.js + Express + SQLite (sql.js)
- **Dados:** DGEG (precos), OpenStreetMap (POIs)

## Funcionalidades

- Precos de combustiveis: Gasolina 95, Gasolina 98, Gasoleo, GPL
- Postos de carregamento eletrico com detalhes (potencia, fichas, taxas)
- Filtros por distrito, concelho, freguesia, marca
- Mapa interativo com clustering
- Geolocalizacao ("usar minha localizacao")
- Estatisticas nacionais (media, minimo)
- Tema escuro premium

## Instalacao

```bash
npm install
```

## Executar

```bash
npm start
# Abrir http://localhost:8080
```

Ou usar `iniciar.bat` (Windows).

## Pipeline de Dados

Scripts disponiveis para atualizar dados:
- `node fetch_osm.js` - Descarregar dados OSM atuais
- `node process_osm.js` - Processar dados OSM para a base de dados
