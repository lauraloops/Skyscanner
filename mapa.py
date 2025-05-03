
import pandas as pd

# Ejemplo de DataFrame
df = pd.DataFrame({
    "city": ["Madrid", "Paris", "Berlin", "Zurich", "Bruges"],
    "iata": ["MAD", "PAR", "BER", "ZRH", "BRU"],
    "lat": [40.4168, 48.8566, 52.52, 47.3769, 51.2093],
    "lon": [-3.7038, 2.3522, 13.405, 8.5417, 3.2247]
})

import requests
import folium
from tqdm import tqdm

API_KEY = "TU_API_KEY_AQUI"  # Reemplaza con tu clave real

def ciudad_tiene_aeropuerto(ciudad):
    url = "https://partners.api.skyscanner.net/apiservices/v3/autosuggest/flights"
    headers = {
        "Content-Type": "application/json",
        "apikey": API_KEY
    }

    body = {
        "query": {
            "market": "UK",
            "locale": "en-GB",
            "searchTerm": ciudad,
            "includedEntityTypes": ["PLACE_TYPE_CITY"]
        },
        "limit": 1,
        "isDestination": True
    }

    response = requests.post(url, headers=headers, json=body)

    if response.status_code != 200:
        print(f"Error en la API para {ciudad}: {response.status_code}")
        return False  # Si falla, asumimos que no tiene aeropuerto

    data = response.json()
    places = data.get("places", [])
    if not places:
        return False

    city_data = places[0]
    # Asegúrate de que la ciudad tiene información de aeropuerto
    if "airportInformation" in city_data:
        return True
    else:
        print(f"No se encontró aeropuerto para {ciudad}")
        return False

# Filtramos las ciudades que tienen aeropuerto
ciudades_con_aeropuerto = []

for _, row in tqdm(df.iterrows(), total=len(df)):
    if ciudad_tiene_aeropuerto(row["city"]):
        ciudades_con_aeropuerto.append(row)

df_ciudades_aeropuerto = pd.DataFrame(ciudades_con_aeropuerto)

# Verifica si hay ciudades con aeropuerto
if df_ciudades_aeropuerto.empty:
    print("No se encontraron ciudades con aeropuerto.")
else:
    # Creamos el mapa con folium
    mapa = folium.Map(location=[48.0, 8.0], zoom_start=4)

    for _, row in df_ciudades_aeropuerto.iterrows():
        folium.Marker(
            location=[row["lat"], row["lon"]],
            popup=row["city"],
            icon=folium.Icon(color="blue", icon="plane", prefix="fa")
        ).add_to(mapa)

    mapa.save("ciudades_con_aeropuerto.html")
    print(f"Se ha guardado el mapa con {len(df_ciudades_aeropuerto)} ciudades.")

