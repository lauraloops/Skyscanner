import csv
import json

# Estructura: { país: { lat, lon, ciudades: { ciudad: { lat, lon, aeropuertos: [] } } } }
result = {}

with open('aeropuertos_100_ciudad_pais.csv', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        country = row['country']
        city = row['city']

        lat = float(row['latitude']) if 'latitude' in row and row['latitude'] else None
        lon = float(row['longitude']) if 'longitude' in row and row['longitude'] else None
        iata = row['IATA']
        name = row['en-GB']

        # Añadir país si no existe
        if country not in result:
            result[country] = {
                'lat': lat,
                'lon': lon,
                'ciudades': {}
            }
        # Añadir ciudad si no existe
        if city not in result[country]['ciudades']:
            result[country]['ciudades'][city] = {
                'lat': lat,
                'lon': lon,
                'aeropuertos': []
            }
        # Añadir aeropuerto a la ciudad
        result[country]['ciudades'][city]['aeropuertos'].append({
            'IATA': iata,
            'name': name,
            'latitude': lat,
            'longitude': lon
        })

# Guardar el resultado en el JSON que usa tu frontend
with open('frontend/src/paises_ciudades_aeropuertos.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print("Archivo JSON generado correctamente en frontend/src/paises_ciudades_aeropuertos.json")
