import csv
import json
from collections import defaultdict
from math import radians, cos, sin, sqrt, atan2

CSV_PATH = 'iata_airports_and_locations_with_vibes.csv'
OUTPUT_JSON = 'frontend/src/aeropuertos_por_zona.json'

# Parámetro: radio máximo (en km) para considerar que dos aeropuertos están en la misma zona
RADIUS_KM = 30  # Puedes ajustar este valor para más o menos agrupación

# Haversine para calcular distancia entre dos puntos

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Radio de la Tierra en km
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    return R * c

# Leer aeropuertos
airports = []
with open(CSV_PATH, encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        try:
            lat = float(row['latitude'])
            lon = float(row['longitude'])
        except (ValueError, KeyError):
            continue
        airports.append({
            'id': row['id'],
            'IATA': row['IATA'],
            'name': row['en-GB'],
            'latitude': lat,
            'longitude': lon
        })

# Agrupación eficiente por zonas geográficas
clusters = []
for airport in airports:
    found_cluster = False
    for cluster in clusters:
        # Comprobar si está cerca de algún aeropuerto del cluster
        if any(haversine(airport['latitude'], airport['longitude'], a['latitude'], a['longitude']) < RADIUS_KM for a in cluster['airports']):
            cluster['airports'].append(airport)
            found_cluster = True
            break
    if not found_cluster:
        clusters.append({'airports': [airport]})

# Calcular centro de cada zona
zonas = []
for cluster in clusters:
    airports = cluster['airports']
    lat = sum(a['latitude'] for a in airports) / len(airports)
    lon = sum(a['longitude'] for a in airports) / len(airports)
    zonas.append({
        'zona': f"Zona {lat:.3f},{lon:.3f}",
        'lat': lat,
        'lon': lon,
        'airports': airports
    })

with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
    json.dump(zonas, f, ensure_ascii=False, indent=2)

print(f'Agrupadas {len(zonas)} zonas en {OUTPUT_JSON}')
