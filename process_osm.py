# DEPRECATED: Use process_osm_v2.py instead
import json
import sqlite3
import uuid
import random

with open('osm_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

conn = sqlite3.connect('database.db')
cursor = conn.cursor()

# Clear existing EV data
cursor.execute("DELETE FROM ev_chargers")
cursor.execute("DELETE FROM stations WHERE type = 'ev'")

# District mapping from populate_portugal.py
PORTUGAL_MAPPING = {
    'Lisboa': ['Lisboa', 'Sintra', 'Cascais', 'Loures', 'Amadora', 'Oeiras', 'Odivelas', 'Vila Franca de Xira', 'Mafra', 'Torres Vedras', 'Alenquer', 'Lourinhã', 'Cadaval', 'Sobral de Monte Agraço', 'Arruda dos Vinhos'],
    'Porto': ['Porto', 'Vila Nova de Gaia', 'Matosinhos', 'Maia', 'Gondomar', 'Valongo', 'Póvoa de Varzim', 'Vila do Conde', 'Santo Tirso', 'Penafiel', 'Amarante', 'Felgueiras', 'Lousada', 'Paços de Ferreira', 'Paredes', 'Baião', 'Marco de Canaveses', 'Trofa'],
    'Setúbal': ['Setúbal', 'Almada', 'Seixal', 'Barreiro', 'Palmela', 'Moita', 'Sesimbra', 'Montijo', 'Alcochete', 'Grândola', 'Santiago do Cacém', 'Sines', 'Alcácer do Sal'],
    'Braga': ['Braga', 'Guimarães', 'Vila Nova de Famalicão', 'Barcelos', 'Fafe', 'Esposende', 'Vizela', 'Amares', 'Barcelos', 'Cabeceiras de Basto', 'Celorico de Basto', 'Esposende', 'Fafe', 'Guimarães', 'Póvoa de Lanhoso', 'Terras de Bouro', 'Vieira do Minho', 'Vila Nova de Famalicão', 'Vila Verde', 'Vizela'],
    'Aveiro': ['Aveiro', 'Santa Maria da Feira', 'Oliveira de Azeméis', 'Ovar', 'Ílhavo', 'Águeda', 'Estarreja', 'Anadia', 'Albergaria-a-Velha', 'Castelo de Paiva', 'Espinho', 'Murtosa', 'Oliveira do Bairro', 'Sever do Vouga', 'Vagos', 'Vale de Cambra'],
    'Leiria': ['Leiria', 'Alcobaça', 'Caldas da Rainha', 'Pombal', 'Marinha Grande', 'Peniche', 'Nazaré', 'Batalha', 'Bombarral', 'Castanheira de Pera', 'Figueiró dos Vinhos', 'Óbidos', 'Pedrógão Grande', 'Porto de Mós'],
    'Santarém': ['Santarém', 'Ourém', 'Tomar', 'Abrantes', 'Torres Novas', 'Entroncamento', 'Cartaxo', 'Almeirim', 'Alpiarça', 'Benavente', 'Chamusca', 'Constância', 'Coruche', 'Ferreira do Zêzere', 'Golegã', 'Mação', 'Rio Maior', 'Salvaterra de Magos', 'Sardoal', 'Vila Nova da Barquinha'],
    'Coimbra': ['Coimbra', 'Figueira da Foz', 'Cantanhede', 'Oliveira do Hospital', 'Condeixa-a-Nova', 'Arganil', 'Góis', 'Lousã', 'Mira', 'Miranda do Corvo', 'Montemor-o-Velho', 'Pampilhosa da Serra', 'Penacova', 'Penela', 'Soure', 'Tábua', 'Vila Nova de Poiares'],
    'Faro': ['Faro', 'Portimão', 'Loulé', 'Albufeira', 'Silves', 'Lagos', 'Tavira', 'Olhão', 'Vila Real de Santo António', 'Aljezur', 'Alcoutim', 'Castro Marim', 'Monchique', 'São Brás de Alportel', 'Vila do Bispo'],
    'Viseu': ['Viseu', 'Lamego', 'Mangualde', 'São Pedro do Sul', 'Tondela', 'Armamar', 'Carregal do Sal', 'Castro Daire', 'Cinfães', 'Moimenta da Beira', 'Mortágua', 'Nelas', 'Oliveira de Frades', 'Penalva do Castelo', 'Penedono', 'Resende', 'Santa Comba Dão', 'São João da Pesqueira', 'Sátão', 'Sernancelhe', 'Tabuaço', 'Tarouca', 'Vila Nova de Paiva', 'Vouzela'],
    'Viana do Castelo': ['Viana do Castelo', 'Ponte de Lima', 'Arcos de Valdevez', 'Caminha', 'Melgaço', 'Monção', 'Paredes de Coura', 'Ponte da Barca', 'Valença', 'Vila Nova de Cerveira'],
    'Vila Real': ['Vila Real', 'Chaves', 'Peso da Régua', 'Valpaços', 'Alijó', 'Boticas', 'Mesão Frio', 'Mondim de Basto', 'Montalegre', 'Murça', 'Ribeira de Pena', 'Sabrosa', 'Santa Marta de Penaguião', 'Vila Pouca de Aguiar'],
    'Castelo Branco': ['Castelo Branco', 'Covilhã', 'Fundão', 'Sertã', 'Belmonte', 'Idanha-a-Nova', 'Oleiros', 'Penamacor', 'Proença-a-Nova', 'Vila de Rei', 'Vila Velha de Ródão'],
    'Évora': ['Évora', 'Estremoz', 'Montemor-o-Novo', 'Vendas Novas', 'Alandroal', 'Arraiolos', 'Borba', 'Mora', 'Mourão', 'Portel', 'Redondo', 'Reguengos de Monsaraz', 'Viana do Alentejo', 'Vila Viçosa'],
    'Guarda': ['Guarda', 'Seia', 'Gouveia', 'Aguiar da Beira', 'Almeida', 'Celorico da Beira', 'Figueira de Castelo Rodrigo', 'Fornos de Algodres', 'Manteigas', 'Mêda', 'Pinhel', 'Sabugal', 'Trancoso', 'Vila Nova de Foz Côa'],
    'Beja': ['Beja', 'Odemira', 'Serpa', 'Moura', 'Aljustrel', 'Almodôvar', 'Alvito', 'Barrancos', 'Castro Verde', 'Cuba', 'Ferreira do Alentejo', 'Mértola', 'Ourique', 'Vidigueira'],
    'Bragança': ['Bragança', 'Mirandela', 'Macedo de Cavaleiros', 'Alfândega da Fé', 'Carrazeda de Ansiães', 'Freixo de Espada à Cinta', 'Miranda do Douro', 'Mogadouro', 'Torre de Moncorvo', 'Vila Flor', 'Vimioso', 'Vinhais'],
    'Portalegre': ['Portalegre', 'Elvas', 'Ponte de Sor', 'Alter do Chão', 'Arronches', 'Avis', 'Campo Maior', 'Castelo de Vide', 'Crato', 'Fronteira', 'Gavião', 'Marvão', 'Monforte', 'Nisa', 'Sousel'],
    'Ilha da Madeira': ['Funchal', 'Santa Cruz', 'Câmara de Lobos', 'Machico', 'Ribeira Brava', 'Calheta', 'Pontassol', 'Porto Moniz', 'São Vicente', 'Santana', 'Porto Santo'],
    'Ilha de São Miguel': ['Ponta Delgada', 'Ribeira Grande', 'Lagoa', 'Vila Franca do Campo', 'Povoação', 'Nordeste'],
    'Ilhas Açores (Outras)': ['Angra do Heroísmo', 'Praia da Vitória', 'Horta', 'Madalena', 'São Roque do Pico', 'Lajes do Pico', 'Velas', 'Calheta', 'Santa Cruz da Graciosa', 'Vila do Porto', 'Santa Cruz das Flores', 'Lajes das Flores', 'Vila do Corvo']
}

def get_location_info(tags):
    # Try multiple tags for location
    raw_city = tags.get('addr:city') or tags.get('addr:municipality') or tags.get('addr:suburb') or tags.get('addr:province') or ""
    raw_suburb = tags.get('addr:suburb') or tags.get('addr:neighborhood') or ""
    postcode = tags.get('addr:postcode', "")
    name = tags.get('name', "")
    ref = tags.get('ref', "")
    
    # Simple postcode to district mapping (first digit)
    POSTCODE_TO_DISTRICT = {
        '1': 'Lisboa', '2': 'Santarém', '3': 'Coimbra', '4': 'Porto',
        '5': 'Vila Real', '6': 'Castelo Branco', '7': 'Évora', '8': 'Faro', '9': 'Açores/Madeira'
    }
    
    # Additional mapping for common towns/parishes
    TOWN_TO_MUNI = {
        'Vilamoura': 'Loulé', 'Quarteira': 'Loulé', 'Vale de Lobo': 'Loulé', 'Almancil': 'Loulé',
        'Linda-a-Velha': 'Oeiras', 'Porto Salvo': 'Oeiras', 'Alges': 'Oeiras', 'Paco de Arcos': 'Oeiras', 
        'Barcarena': 'Oeiras', 'Carnaxide': 'Oeiras', 'Queijas': 'Oeiras', 'Alfragide': 'Amadora',
        'Ericeira': 'Mafra', 'Malveira': 'Mafra',
        'Fogueteiro': 'Seixal', 'Corroios': 'Seixal', 'Amora': 'Seixal', 'Fernao Ferro': 'Seixal',
        'Pinhal Novo': 'Palmela', 'Quinta do Anjo': 'Palmela', 'Azeitao': 'Setúbal',
        'Estoril': 'Cascais', 'Parede': 'Cascais', 'Carcavelos': 'Cascais', 'Alcabideche': 'Cascais',
        'Alverca': 'Vila Franca de Xira', 'Povoa de Santa Iria': 'Vila Franca de Xira',
        'Leca da Palmeira': 'Matosinhos', 'Senhora da Hora': 'Matosinhos',
        'Sacavem': 'Loures', 'Sacavém': 'Loures', 'Moscavide': 'Loures', 'Bobadela': 'Loures', 'Sta Iria de Azoia': 'Loures',
        'Albufeira': 'Albufeira', 'Fatima': 'Ourém', 'Fátima': 'Ourém',
        'Queluz': 'Sintra', 'Agualva-Cacem': 'Sintra', 'Algueirao': 'Sintra', 'Rio de Mouro': 'Sintra', 'Belas': 'Sintra',
        'Costa de Caparica': 'Almada', 'Charneca de Caparica': 'Almada', 'Laranjeiro': 'Almada', 'Feijo': 'Almada',
        'Parque das Nacoes': 'Lisboa', 'Belem': 'Lisboa', 'Benfica': 'Lisboa', 'Olivais': 'Lisboa',
        'Antas': 'Porto', 'Foz do Douro': 'Porto', 'Boavista': 'Porto',
        'Canidelo': 'Vila Nova de Gaia', 'Mafamude': 'Vila Nova de Gaia'
    }

    
    # 1. Try postcode first (very reliable for district)
    if postcode and len(postcode) >= 1:
        first_digit = postcode[0]
        if first_digit in POSTCODE_TO_DISTRICT:
            district = POSTCODE_TO_DISTRICT[first_digit]
            # Special case for 9 (Madeira/Açores)
            if first_digit == '9':
                if postcode.startswith('95') or postcode.startswith('96'): district = 'Ilha de São Miguel'
                elif postcode.startswith('90') or postcode.startswith('91') or postcode.startswith('92') or postcode.startswith('93') or postcode.startswith('94'): district = 'Ilha da Madeira'
                else: district = 'Ilhas Açores (Outras)'
            
            # Now try to find municipality and parish from other tags
            found_muni = raw_city or district
            found_parish = raw_suburb or raw_city or district
            
            for s in [raw_city, raw_suburb, name, ref]:
                if not s: continue
                # Check TOWN_TO_MUNI
                for town, muni in TOWN_TO_MUNI.items():
                    if town.lower() in s.lower():
                        return district, muni, town
                # Check PORTUGAL_MAPPING
                for d, munis in PORTUGAL_MAPPING.items():
                    for m in munis:
                        if m.lower() in s.lower():
                            found_muni = m
                            if not raw_suburb: found_parish = m
            
            return district, found_muni, found_parish

    # 2. Search strategy: Location tags, Name tag, Ref tag
    search_strings = [raw_city, raw_suburb, name, ref]
    
    for s in search_strings:
        if not s or len(s) < 3: continue
        
        # Check TOWN_TO_MUNI
        for town, muni in TOWN_TO_MUNI.items():
            if town.lower() in s.lower():
                for dist, munis in PORTUGAL_MAPPING.items():
                    if muni in munis:
                        return dist, muni, town
        
        # Check PORTUGAL_MAPPING directly
        s_lower = s.lower()
        for dist, munis in PORTUGAL_MAPPING.items():
            if s_lower == dist.lower() or dist.lower() in s_lower:
                return dist, dist, raw_suburb or raw_city or dist
            for muni in munis:
                if s_lower == muni.lower() or muni.lower() in s_lower:
                    return dist, muni, raw_suburb or raw_city or muni
                    
    return "Outros", raw_city or "Portugal", raw_suburb or raw_city or "Portugal"


def get_clean_brand(tags):
    brand = tags.get('brand') or tags.get('operator') or 'Mobi.E'
    brand_lower = brand.lower()
    
    if 'edp' in brand_lower: return 'EDP'
    if 'galp' in brand_lower: return 'Galp'
    if 'powerdot' in brand_lower: return 'Powerdot'
    if 'ionity' in brand_lower: return 'Ionity'
    if 'tesla' in brand_lower: return 'Tesla'
    if 'continente' in brand_lower: return 'Continente Plug&Charge'
    if 'pingo doce' in brand_lower: return 'Pingo Doce'
    if 'lidl' in brand_lower: return 'Lidl'
    if 'aldi' in brand_lower: return 'Aldi'
    if 'mercadona' in brand_lower: return 'Mercadona'
    if 'ikea' in brand_lower: return 'IKEA'
    if 'auchan' in brand_lower: return 'Auchan'
    if 'kargo' in brand_lower: return 'Kargo'
    if 'prio' in brand_lower: return 'PRIO'
    if 'iberdrola' in brand_lower: return 'Iberdrola'
    
    return brand

inserted = 0

for element in data:
    lat = element.get('lat')
    lng = element.get('lon')
    
    if not lat or not lng:
        continue
        
    tags = element.get('tags', {})

    
    s_id = str(uuid.uuid4())
    name = tags.get('name') or tags.get('ref') or "Posto de Carregamento"
    brand = get_clean_brand(tags)
    
    street = tags.get('addr:street', '')
    housenumber = tags.get('addr:housenumber', '')
    address = f"{street} {housenumber}".strip() or "Portugal"
    
    district, municipality, parish = get_location_info(tags)




    
    # Using lat/lng from the top of the loop

    
    # Posts
    try:
        total_posts = int(tags.get('capacity', 2))
    except ValueError:
        total_posts = 2
        
    available_posts = random.randint(0, total_posts)
    
    # Power
    powers = []
    for k, v in tags.items():
        if k.endswith(':output'):
            powers.append(v)
    
    power_info = ", ".join(list(set(powers))) if powers else ("22 kW" if total_posts <= 2 else "50 kW, 22 kW")
    
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

print(f"Successfully processed and inserted {inserted} real charging stations from OSM.")
