from typing import List, Dict, Union
from fastapi import FastAPI, Query
import requests
import time
import pandas as pd
from pydantic import BaseModel
import google.generativeai as genai
import os
import json
import statistics

app = FastAPI()

df = pd.read_csv("aeropuertos_100_ciudad_pais.csv")

# Convert the 'vibes' stringified dictionary to a list of active vibes
def parse_vibes(vibe_dict_str):
    try:
        vibe_dict = json.loads(vibe_dict_str)
        return [k for k, v in vibe_dict.items() if v == "1"]
    except (json.JSONDecodeError, TypeError):
        return []

df['vibes'] = df['vibes'].apply(parse_vibes)

# Request model
class UserCityVibes(BaseModel):
    user_requests: List[Dict[str, Union[str, List[str]]]]  # {"username": "Juan", "city": "Barcelona", "vibes": ["beach", "food"]}

@app.post("/find_matching_airports/")
def find_matching_airports(user_input: UserCityVibes):
    user_requests = user_input.user_requests
    valid_vibes = set().union(*df['vibes'])

    user_filtered_sets = []

    for user_dict in user_requests:
        try:
            username = user_dict["username"]
            user_city = user_dict["city"]
            user_vibes = user_dict["vibes"]
        except KeyError:
            return {"error": "Each user request must include 'username', 'city', and 'vibes'."}


        # Filter out vibes not in the dataset
        user_vibes = [v for v in user_vibes if v in valid_vibes]
        if not user_vibes:
            continue

        # Exclude airports from user's city
        df_other_cities = df[df['en-GB'] != user_city]

        # Find airports that satisfy all the user's vibes
        matching_airports = df_other_cities[df_other_cities['vibes'].apply(lambda vibes: set(user_vibes).issubset(set(vibes)))]
        user_filtered_sets.append(set(matching_airports['id']))

    if not user_filtered_sets:
        return {"error": "No valid vibes found for any user."}

    # Find intersection of all user sets
    common_ids = set.intersection(*user_filtered_sets)
    df_filtered = df[df['id'].isin(common_ids)]

    if not df_filtered.empty:
        return {
            "match_type": "exact",
            "results": df_filtered[['id', 'IATA', 'en-GB', 'vibes']].to_dict(orient="records")
        }

    # No exact match: return top 10 closest based on shared vibes
    all_requested_vibes = set().union(*[list(v.values())[0] for v in user_requests])
    df_other_cities = df[df['en-GB'].apply(lambda city: city not in [list(d.keys())[0] for d in user_requests])]
    df_other_cities['matched_vibes_count'] = df_other_cities['vibes'].apply(lambda vibes: len(set(vibes).intersection(all_requested_vibes)))
    df_sorted = df_other_cities.sort_values(by='matched_vibes_count', ascending=False).head(10)

    return {
        "match_type": "approximate",
        "results": df_sorted[['id', 'IATA', 'en-GB', 'vibes', 'matched_vibes_count']].to_dict(orient="records")
    }


#### AI
try: 
    GOOGLE_API_KEY = "AIzaSyBmfLBKwdEPatEArndZspgnqJdl7InVt64"
    if not GOOGLE_API_KEY:
        raise ValueError("API key not found")
    genai.configure(api_key = GOOGLE_API_KEY)

except ValueError as e:
    print(f"Configuration Error: {e}")
    exit()

except Exception as e:
    print(f"An unexpected error occurred during configuration: {e}")
    exit()

model = genai.GenerativeModel('gemini-1.5-flash')

class TravelPreferences(BaseModel):
    description: str

def analyze_travel_preferences(user_text: str):
    prompt = f"""
    Eres un asistente experto en planificación de viajes para Skyscanner.
    Analiza el siguiente texto proporcionado por un usuario sobre sus preferencias de viaje.
    Tu tarea es:
    1. Extraer los elementos clave más importantes para la planificación:
        - Intereses específicos
        - Actividades deseadas
        - Tipo de viaje
        - Ambiente deseado
        - Menciones de lugares, fechas, duración o presupuesto
        - Cualquier otra restricción o preferencia relevante
    2. Sugerir 5 ciudades ideales.
    3. Explica por qué cada ciudad es adecuada.

    Texto del usuario:
    ---
    {user_text}
    ---

    Devuelve la respuesta estructurada en formato JSON:
    {{
        "elementos_clave": [...],
        "ciudades_sugeridas": [
            {{
                "ciudad": "Nombre de la ciudad",
                "razon": "Explicación"
            }},
            ...
        ]
    }}
    """

    try:
        response = model.generate_content(prompt)
        cleaned_response_text = response.text.strip()
        if cleaned_response_text.startswith("⁠  json"):
            cleaned_response_text = cleaned_response_text[7:]
        if cleaned_response_text.endswith("  ⁠"):
            cleaned_response_text = cleaned_response_text[:-3]

        return json.loads(cleaned_response_text.strip())
    except Exception as e:
        return {"error": f"Failed to analyze preferences: {str(e)}"}
    
@app.post("/analyze/")
def analyze(preferences: TravelPreferences):
    return analyze_travel_preferences(preferences.description)



### PRESUPOST
API_KEY = "sh967490139224896692439644109194"
HEADERS = {"x-api-key": API_KEY}
CREATE_URL = "https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/create"
POLL_URL = "https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/poll/{}"

def create_search(origin_data: str, destination_iata: str, date: Dict[str, int]) -> Union[str, None]:
    body = {
        "query": {
            "market": "ES",
            "locale": "es-ES",
            "currency": "EUR",
            "query_legs": [{
                "origin_place_id": {"iata": origin_iata},
                "destination_place_id": {"iata": destination_iata},
                "date": date
            }],
            "adults": 1,
            "cabin_class": "CABIN_CLASS_ECONOMY"
        }
    }
    response = requests.post(CREATE_URL, json=body, headers=HEADERS)
    return response.json().get("sessionToken")

def poll_results(session_token:str) -> Union[dict, None]:
    for _ in range(10):
        time.sleep(2)
        response = requests.post(POLL_URL.format(session_token), headers=HEADERS)
        data = response.json()
        if data.get("status") == "RESULT_STATUS_COMPLETE":
            return data
    return None

def get_min_price(data:dict) -> Union[float, None]:
    try:
        prices = [
            float(it["pricingOptions"][0]["price"]["amount"]) / 1000
            for it in data.get("content", {}).get("results", {}).get("itineraries", {}).values()
            if it.get("pricingOptions")
        ]
        return min(prices) if prices else None
    except Exception as e:
        print("Error extracting price:", e)
        return None

def compute_mean_roundtrip_price(origins:List[str], destinations:List[str], date_departure:Dict[str, int], date_return:Dict[str, int]) -> Dict[str, float]:
    result = {}
    for dest in destinations:
        roundtrip_prices = []
        for origin in origins:
            session_token_out = create_search(origin, dest, date_departure)
            if not session_token_out:
                continue
            data_out = poll_results(session_token_out)
            if not data_out:
                continue
            price_out = get_min_price(data_out)

            session_token_in = create_search(dest, origin, date_return)
            if not session_token_in:
                continue
            data_in = poll_results(session_token_in)
            if not data_in:
                continue
            price_in = get_min_price(data_in)

            if price_out is not None and price_in is not None:
                roundtrip_prices.append(price_out + price_in)
        if roundtrip_prices:
            mean_price = round(statistics.mean(roundtrip_prices),2)
            result[dest] = mean_price
    return result

@app.get("/roundtrip-prices/")
def get_roundtrip_prices(
    origins: List[str],
    destinations: List[str],
    departure_year: int,
    departure_month: int,
    departure_day: int,
    return_year: int,
    return_month: int,
    return_day: int
):
    date_departure = {"year": departure_year, "month": departure_month, "day": departure_day}
    date_return = {"year": return_year, "month": return_month, "day": return_day}
    prices = compute_mean_roundtrip_price(origins, destinations, date_departure, date_return)
    return prices


    
    





@app.get("/")
def read_root():
    return {"Hello" : "World"}