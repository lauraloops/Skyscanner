from typing import List, Dict
from fastapi import FastAPI
import pandas as pd
from pydantic import BaseModel
import json

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
    user_requests: List[Dict[str, List[str]]]  # Each dict is like {"Barcelona": ["beach", "great_food"]}

@app.post("/find_matching_airports/")
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

