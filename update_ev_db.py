# DEPRECATED: Use process_osm_v2.py instead
import sqlite3
import uuid
import json

data = [
  {
    "name": "Estação de carregamento Atlante",
    "address": "Rua de Oliveira Feijão 161",
    "available_posts": 5,
    "total_posts": 5,
    "power_info": "100 kW, 30 kW, 22 kW"
  },
  {
    "name": "Estação de carregamento Powerdot",
    "address": "Estr. Q.ta da Carcereira 22",
    "available_posts": 11,
    "total_posts": 17,
    "power_info": "200 kW, 100 kW, 50 kW, 43 kW, 22 kW"
  },
  {
    "name": "Atlante Charging Station",
    "address": "R. Alto dos Capuchos 19",
    "available_posts": 2,
    "total_posts": 3,
    "power_info": "60 kW, 50 kW, 22 kW"
  },
  {
    "name": "Estação de carregamento MOBI.E",
    "address": "R. Sérgio Malpique 2",
    "available_posts": 6,
    "total_posts": 14,
    "power_info": "200 kW, 22 kW, 11 kW"
  },
  {
    "name": "Estação de carregamento Renewing",
    "address": "R. Leitão de Barros 8",
    "available_posts": 3,
    "total_posts": 4,
    "power_info": "150 kW, 22 kW"
  },
  {
    "name": "GALP Charging Station",
    "address": "Azinhaga da Regateira 8",
    "available_posts": 3,
    "total_posts": 3,
    "power_info": "50 kW, 43 kW"
  },
  {
    "name": "Estação de carregamento Galp",
    "address": "Rua de Oliveira Feijão 1053",
    "available_posts": 0,
    "total_posts": 3,
    "power_info": "50 kW, 22 kW"
  },
  {
    "name": "Estação de carregamento EDP",
    "address": "R. Alfredo Cunha 55",
    "available_posts": 0,
    "total_posts": 5,
    "power_info": "120 kW, 60 kW, 22 kW"
  },
  {
    "name": "Mobiletric Estação de Carregamento",
    "address": "R. Parque Anjos 7",
    "available_posts": 0,
    "total_posts": 2,
    "power_info": "160 kW, 50 kW"
  },
  {
    "name": "Galp Estação de Carregamento",
    "address": "Av. Gen. Humberto Delgado 47",
    "available_posts": 0,
    "total_posts": 2,
    "power_info": "7 kW"
  },
  {
    "name": "MOBI.E Charging Station",
    "address": "Praceta Fernandes de Sá 34",
    "available_posts": 1,
    "total_posts": 1,
    "power_info": "22 kW"
  },
  {
    "name": "Mobiletric Charging Station",
    "address": "R. Infanta Dona Isabel 2",
    "available_posts": 1,
    "total_posts": 2,
    "power_info": "180 kW"
  },
  {
    "name": "Estação de carregamento PRIO",
    "address": "",
    "available_posts": 1,
    "total_posts": 2,
    "power_info": "180 kW"
  },
  {
    "name": "Evlink Charging Station",
    "address": "R. António Andrade 214",
    "available_posts": 0,
    "total_posts": 3,
    "power_info": "120 kW, 22 kW"
  },
  {
    "name": "Estação de carregamento Iberdrola | bp pulse",
    "address": "Av. de Belverde",
    "available_posts": 12,
    "total_posts": 12,
    "power_info": "300 kW, 150 kW, 80 kW"
  },
  {
    "name": "Estação de carregamento KLC",
    "address": "R. Abel Salazar 7",
    "available_posts": 0,
    "total_posts": 3,
    "power_info": "50 kW, 22 kW"
  },
  {
    "name": "Estação de carregamento Continente Plug&Charge",
    "address": "Av. Duarte Pacheco 25",
    "available_posts": 2,
    "total_posts": 5,
    "power_info": "50 kW, 22 kW"
  },
  {
    "name": "VoltBox",
    "address": "Equipamento e soluções energéticas",
    "available_posts": 0,
    "total_posts": 0,
    "power_info": ""
  },
  {
    "name": "EDP Comercial Charging Station",
    "address": "Praia da Rainha",
    "available_posts": 0,
    "total_posts": 4,
    "power_info": "3 kW"
  },
  {
    "name": "Continente Plug&Charge Estação de Carregamento",
    "address": "R. Branca Colaço",
    "available_posts": 1,
    "total_posts": 2,
    "power_info": "22 kW"
  }
]

conn = sqlite3.connect('database.db')
cursor = conn.cursor()

# Update schema for ev_chargers
cursor.execute('DROP TABLE IF EXISTS ev_chargers')
cursor.execute('''
    CREATE TABLE ev_chargers (
        station_id TEXT PRIMARY KEY,
        available_posts INTEGER,
        total_posts INTEGER,
        power_info TEXT,
        FOREIGN KEY(station_id) REFERENCES stations(id)
    )
''')

# Delete existing EV stations from stations table
cursor.execute("DELETE FROM stations WHERE type = 'ev'")

# Function to infer brand from name
def infer_brand(name):
    name_lower = name.lower()
    if 'atlante' in name_lower: return 'Atlante'
    if 'powerdot' in name_lower: return 'Powerdot'
    if 'mobi.e' in name_lower: return 'Mobi.E'
    if 'renewing' in name_lower: return 'Renewing'
    if 'galp' in name_lower: return 'Galp'
    if 'edp' in name_lower: return 'EDP'
    if 'mobiletric' in name_lower: return 'Mobiletric'
    if 'prio' in name_lower: return 'PRIO'
    if 'evlink' in name_lower: return 'Evlink'
    if 'iberdrola' in name_lower: return 'Iberdrola'
    if 'klc' in name_lower: return 'KLC'
    if 'continente' in name_lower: return 'Continente Plug&Charge'
    if 'voltbox' in name_lower: return 'VoltBox'
    return 'Outra'

for station in data:
    s_id = str(uuid.uuid4())
    brand = infer_brand(station['name'])
    
    # We will just put 'Almada' / 'Seixal' etc. roughly based on search, but we don't have perfect district/municipality info.
    # Let's set default values for missing geo data
    cursor.execute('''
        INSERT INTO stations (id, name, brand, address, district, municipality, parish, lat, lng, type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (s_id, station['name'], brand, station['address'], 'Setúbal', 'Almada', 'Almada', 38.617, -9.263, 'ev'))
    
    cursor.execute('''
        INSERT INTO ev_chargers (station_id, available_posts, total_posts, power_info)
        VALUES (?, ?, ?, ?)
    ''', (s_id, station['available_posts'], station['total_posts'], station['power_info']))

conn.commit()
conn.close()
print("Database updated successfully.")
