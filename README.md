# FuelSmart Portugal (COMBUSTIVEL)

Directorio nacional de precos de combustiveis e postos de carregamento eletrico em Portugal.

## Stack

- **Frontend:** Vanilla HTML/CSS/JS, Leaflet.js, Leaflet.markercluster
- **Backend:** Python http.server + SQLite
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
pip install -r requirements.txt  # Se existir
```

## Executar

```bash
python server.py
# Abrir http://localhost:8000
```

Ou usar `iniciar.bat` (Windows).

## Pipeline de Dados

Scripts disponiveis para atualizar dados:
- `fetch_osm.py` / `process_osm.py` - Dados OSM
- `populate_portugal.py` - Dados DGEG
- `update_ev_db.py` - Atualizar carregadores EV
