from typing import List, Dict
from fastapi import FastAPI, Body
import pandas as pd
from pydantic import BaseModel
import json
from google import genai as genai
import os

# Load the dataframe
df = pd.read_csv("aeropuertos_100_ciudad_pais.csv")

# Convert the 'vibes' stringified dictionary to a list of active vibes
def parse_vibes(vibe_dict_str):
    try:
        vibe_dict = json.loads(vibe_dict_str)
        return [k for k, v in vibe_dict.items() if v == "1"]
    except (json.JSONDecodeError, TypeError):
        return []

df['vibes'] = df['vibes'].apply(parse_vibes)

# Request model for POST body
class UserCityVibes(BaseModel):
    user_requests: List[Dict[str, List[str]]]  # Each dict is like {"Barcelona": ["beach", "great_food"]}

# Configure the Google API key
try:
    GOOGLE_API_KEY = 'AIzaSyBmfLBKwdEPatEArndZspgnqJdl7InVt64'
    if not GOOGLE_API_KEY:
        raise ValueError("API key not found in GOOGLE_API_KEY environment variable.")
    genai.configure(api_key=GOOGLE_API_KEY)
except ValueError as e:
    print(f"Configuration Error: {e}")
    exit()  # Exit if no key
except Exception as e:
    print(f"An unexpected error occurred during configuration: {e}")
    exit()

# Initialize the Gemini model
model = genai.GenerativeModel('gemini-1.5-flash')

# Analyze travel preferences using the Gemini model
def analyze_travel_preferences(user_text):
    """
    Analyzes travel preference text using Gemini to extract key info
    and suggest relevant cities.
    """
    prompt = f"""
    Eres un asistente experto en planificación de viajes para Skyscanner.
    Analiza el siguiente texto proporcionado por un usuario sobre sus preferencias de viaje.
    Tu tarea es:
    1. Extraer los elementos clave más importantes para la planificación.
    2. Basándote EXCLUSIVAMENTE en los elementos clave extraídos del texto, sugiere 5 ciudades.
    Texto del usuario:
    ---
    {user_text}
    ---
    Devuelve la respuesta estructurada en formato JSON.
    """

    try:
        response = model.generate_content(prompt)
        cleaned_response_text = response.text.strip()
        if cleaned_response_text.startswith("```json"):
            cleaned_response_text = cleaned_response_text[7:]
        if cleaned_response_text.endswith("```"):
            cleaned_response_text = cleaned_response_text[:-3]

        result = json.loads(cleaned_response_text.strip())
        return result
    except Exception as e:
        print(f"Error interacting with the Gemini API: {e}")
        return None


@app.post("/find_matching_airports")
def find_matching_airports(user_input: UserCityVibes):
    user_requests = user_input.user_requests
    valid_vibes = set().union(*df['vibes'])

    user_filtered_sets = []

    for user_dict in user_requests:
        if len(user_dict) != 1:
            return {"error": "Each user request must contain exactly one city and its vibes."}
        
        # Extract city and requested vibes
        user_city, user_vibes = list(user_dict.items())[0]

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

@app.post("/analyze_travel_preferences/")
def analyze_preferences(user_text: str):
    """
    Accepts a user's text input, analyzes it using the Gemini model, and returns suggested cities
    """
    analysis_result = analyze_travel_preferences(user_text)

    if analysis_result:
        return {
            "elementos_clave": analysis_result.get("elementos_clave", []),
            "ciudades_sugeridas": analysis_result.get("ciudades_sugeridas", [])
        }
    else:
        return {"error": "Unable to analyze preferences. Please try again."}


#Une la lista de destinos segun las vibes y la lista de destinos segun el AI (libre texto)
@app.post("/find_matching_with_text/")
def find_matching_with_text(
    user_requests: List[Dict[str, List[str]]] = Body(...),
    user_text: str = Body(...),
    text_city: str = Body(...)
):
    """
    Combina input estructurado + texto libre para encontrar aeropuertos que coincidan con todas las preferencias.
    - `user_requests`: lista como [{"Paris": ["historic", "nightlife"]}]
    - `user_text`: texto libre como "Quiero playa y comida deliciosa"
    - `text_city`: ciudad de origen del usuario que escribió el texto libre
    """
    analysis_result = analyze_travel_preferences(user_text)

    if not analysis_result:
        return {"error": "Unable to analyze text preferences."}

    # Extraer vibes del texto
    text_vibes = analysis_result.get("elementos_clave", [])
    if not text_vibes:
        return {"error": "No vibes found in text analysis."}

    # Añadir como nuevo usuario
    full_user_requests = user_requests + [{text_city: text_vibes}]
    valid_vibes = set().union(*df['vibes'])
    user_filtered_sets = []

    for user_dict in full_user_requests:
        if len(user_dict) != 1:
            return {"error": "Each user request must contain exactly one city and its vibes."}
        
        user_city, user_vibes = list(user_dict.items())[0]
        user_vibes = [v for v in user_vibes if v in valid_vibes]
        if not user_vibes:
            continue

        df_other_cities = df[df['en-GB'] != user_city]
        matching_airports = df_other_cities[
            df_other_cities['vibes'].apply(lambda vibes: set(user_vibes).issubset(set(vibes)))
        ]
        user_filtered_sets.append(set(matching_airports['id']))

    if not user_filtered_sets:
        return {"error": "No valid vibes found for any user."}

    common_ids = set.intersection(*user_filtered_sets)
    df_filtered = df[df['id'].isin(common_ids)]

    if not df_filtered.empty:
        return {
            "match_type": "exact",
            "results": df_filtered[['id', 'IATA', 'en-GB', 'vibes']].to_dict(orient="records")
        }

    # No exact match: devolver coincidencias aproximadas
    all_requested_vibes = set().union(*[list(v.values())[0] for v in full_user_requests])
    df_other_cities = df[df['en-GB'].apply(lambda city: city not in [list(d.keys())[0] for d in full_user_requests])]
    df_other_cities['matched_vibes_count'] = df_other_cities['vibes'].apply(
        lambda vibes: len(set(vibes).intersection(all_requested_vibes))
    )
    df_sorted = df_other_cities.sort_values(by='matched_vibes_count', ascending=False).head(10)

    return {
        "match_type": "approximate",
        "results": df_sorted[['id', 'IATA', 'en-GB', 'vibes', 'matched_vibes_count']].to_dict(orient="records")
    }

