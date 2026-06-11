# DEPRECATED: Use process_osm_v2.py instead
import sqlite3
import uuid
import random

conn = sqlite3.connect('database.db')
cursor = conn.cursor()

# Clear existing EV data
cursor.execute("DELETE FROM ev_chargers")
cursor.execute("DELETE FROM stations WHERE type = 'ev'")

districts = {
    'Lisboa': ['Lisboa', 'Sintra', 'Cascais', 'Loures', 'Amadora', 'Oeiras', 'Odivelas', 'Vila Franca de Xira', 'Mafra'],
    'Porto': ['Porto', 'Vila Nova de Gaia', 'Matosinhos', 'Maia', 'Gondomar', 'Valongo', 'Póvoa de Varzim', 'Vila do Conde', 'Santo Tirso', 'Penafiel'],
    'Setúbal': ['Setúbal', 'Almada', 'Seixal', 'Barreiro', 'Palmela', 'Moita', 'Sesimbra', 'Montijo', 'Alcochete', 'Grândola'],
    'Braga': ['Braga', 'Guimarães', 'Vila Nova de Famalicão', 'Barcelos', 'Fafe', 'Esposende', 'Vizela'],
    'Aveiro': ['Aveiro', 'Santa Maria da Feira', 'Oliveira de Azeméis', 'Ovar', 'Ílhavo', 'Águeda', 'Estarreja'],
    'Leiria': ['Leiria', 'Alcobaça', 'Caldas da Rainha', 'Pombal', 'Marinha Grande', 'Peniche', 'Nazaré'],
    'Santarém': ['Santarém', 'Ourém', 'Tomar', 'Abrantes', 'Torres Novas', 'Entroncamento', 'Cartaxo'],
    'Coimbra': ['Coimbra', 'Figueira da Foz', 'Cantanhede', 'Oliveira do Hospital', 'Condeixa-a-Nova'],
    'Faro': ['Faro', 'Portimão', 'Loulé', 'Albufeira', 'Silves', 'Lagos', 'Tavira', 'Olhão', 'Vila Real de Santo António'],
    'Viseu': ['Viseu', 'Lamego', 'Mangualde', 'São Pedro do Sul', 'Tondela'],
    'Viana do Castelo': ['Viana do Castelo', 'Ponte de Lima', 'Arcos de Valdevez', 'Caminha'],
    'Vila Real': ['Vila Real', 'Chaves', 'Peso da Régua', 'Valpaços'],
    'Castelo Branco': ['Castelo Branco', 'Covilhã', 'Fundão', 'Sertã'],
    'Évora': ['Évora', 'Estremoz', 'Montemor-o-Novo', 'Vendas Novas'],
    'Guarda': ['Guarda', 'Seia', 'Gouveia'],
    'Beja': ['Beja', 'Odemira', 'Serpa', 'Moura'],
    'Bragança': ['Bragança', 'Mirandela', 'Macedo de Cavaleiros'],
    'Portalegre': ['Portalegre', 'Elvas', 'Ponte de Sor'],
    'Ilha da Madeira': ['Funchal', 'Santa Cruz', 'Câmara de Lobos', 'Machico'],
    'Ilha de São Miguel': ['Ponta Delgada', 'Ribeira Grande', 'Lagoa']
}

brands = [
    ('EDP', 0.25), ('Galp', 0.20), ('Mobi.E', 0.20), ('Powerdot', 0.10),
    ('Continente Plug&Charge', 0.08), ('Tesla', 0.05), ('Ionity', 0.02),
    ('Pingo Doce', 0.03), ('IKEA', 0.02), ('Mercadona', 0.02), ('Aldi', 0.01), ('Lidl', 0.02)
]

def get_random_brand():
    r = random.random()
    cumulative = 0
    for brand, prob in brands:
        cumulative += prob
        if r <= cumulative:
            return brand
    return 'Mobi.E'

def get_random_power(brand):
    if brand == 'Ionity':
        return "350 kW"
    if brand == 'Tesla':
        return random.choice(["150 kW", "250 kW"])
    
    profiles = [
        "22 kW", "11 kW", "3.7 kW", # Normal
        "50 kW, 22 kW", "50 kW", "60 kW, 22 kW", # Fast
        "150 kW, 50 kW", "120 kW", "180 kW" # Ultra Fast
    ]
    weights = [0.3, 0.1, 0.05, 0.2, 0.15, 0.05, 0.05, 0.05, 0.05]
    return random.choices(profiles, weights=weights)[0]

total_stations = 1500
inserted = 0

for _ in range(total_stations):
    s_id = str(uuid.uuid4())
    brand = get_random_brand()
    
    district = random.choice(list(districts.keys()))
    municipality = random.choice(districts[district])
    parish = municipality # Simplify
    
    name = f"Estação de Carregamento {brand} - {municipality}"
    if brand == 'Tesla': name = f"Tesla Supercharger {municipality}"
    elif brand == 'Ionity': name = f"IONITY {municipality}"
    elif brand == 'Continente Plug&Charge': name = f"Continente Plug&Charge {municipality}"
    elif brand in ['Lidl', 'Aldi', 'Mercadona', 'IKEA', 'Pingo Doce']: name = f"{brand} {municipality}"
    
    address = f"Rua Principal, {random.randint(1, 500)}"
    lat = 39.0 + (random.random() * 2 - 1) * 2.5 # Approximate lat range for PT
    lng = -8.0 + (random.random() * 2 - 1) * 1.5 # Approximate lng range for PT
    
    # Generate posts
    total_posts = random.choice([2, 2, 2, 3, 4, 4, 6, 8, 12]) if brand not in ['Tesla', 'Ionity'] else random.choice([6, 8, 12, 16])
    available_posts = random.randint(0, total_posts)
    power_info = get_random_power(brand)
    
    cursor.execute('''
        INSERT INTO stations (id, name, brand, address, district, municipality, parish, lat, lng, type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (s_id, name, brand, address, district, municipality, parish, lat, lng, 'ev'))
    
    cursor.execute('''
        INSERT INTO ev_chargers (station_id, available_posts, total_posts, power_info)
        VALUES (?, ?, ?, ?)
    ''', (s_id, available_posts, total_posts, power_info))
    
    inserted += 1

conn.commit()
conn.close()
print(f"Successfully generated and inserted {inserted} charging stations for Portugal.")
