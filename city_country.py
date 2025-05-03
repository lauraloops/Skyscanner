import pandas as pd
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
import time

# Cargar solo las primeras 100 filas
df = pd.read_csv("iata_airports_and_locations_with_vibes.csv").head(100)

# Redondear coordenadas (1 decimal ≈ ~11 km)
df['lat_lon'] = df[['latitude', 'longitude']].apply(lambda x: (round(x[0], 1), round(x[1], 1)), axis=1)

# Obtener coordenadas únicas
unique_coords = df['lat_lon'].drop_duplicates()

# Inicializar geolocalizador
geolocator = Nominatim(user_agent="airport_lookup")

# Función para obtener ciudad y país
def reverse_geocode(coord, retries=3):
    for _ in range(retries):
        try:
            location = geolocator.reverse(coord, language='en', timeout=10)
            if location and 'address' in location.raw:
                addr = location.raw['address']
                country = addr.get('country', 'Unknown')
                city = addr.get('city') or addr.get('town') or addr.get('village') or addr.get('state') or 'Unknown'
                return (city, country)
            return ("Unknown", "Unknown")
        except GeocoderTimedOut:
            time.sleep(0.3)
        except Exception as e:
            print(f"Error: {e}")
            return ("Error", "Error")
    return ("Timeout", "Timeout")

# Geocodificación
coord_to_location = {}
for i, coord in enumerate(unique_coords):
    city, country = reverse_geocode(coord)
    coord_to_location[coord] = (city, country)
    print(f"{i+1}/{len(unique_coords)}: {coord} → {city}, {country}")
    time.sleep(0.3)

# Mapear resultados
df[['city', 'country']] = df['lat_lon'].map(coord_to_location).apply(pd.Series)

# Limpiar y guardar
df.drop(columns=['lat_lon'], inplace=True)
df.to_csv("aeropuertos_100_ciudad_pais.csv", index=False)
print("Archivo guardado como aeropuertos_100_ciudad_pais.csv")
