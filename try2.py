import pandas as pd
import ast
from typing import List

def load_airports_with_vibes(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    df = df.dropna(subset=['vibes']).copy()

    def parse_vibes(vibe_str):
        vibes_dict = ast.literal_eval(vibe_str)
        return [k for k, v in vibes_dict.items() if v == '1']

    df['vibes'] = df['vibes'].apply(parse_vibes)
    return df

def find_airports_with_all_user_preferences(df: pd.DataFrame, user_requests: List[List[str]]) -> pd.DataFrame:
    # Lista de sets con los IATA de aeropuertos que cumplen las vibes de cada usuario
    user_filtered_sets = []

    for user_vibes in user_requests:
        matching_airports = df[df['vibes'].apply(lambda vibes: set(user_vibes).issubset(set(vibes)))]
        user_filtered_sets.append(set(matching_airports['IATA']))

    # Intersección de todos los sets
    common_iatas = set.intersection(*user_filtered_sets)
    df_filtered = df[df['IATA'].isin(common_iatas)]

    return df_filtered[['id', 'IATA', 'en-GB', 'vibes']]

def collect_user_requests() -> List[List[str]]:
    user_requests = []
    print("Introduce las vibes de cada usuario (escribe 'done' para terminar):")

    user_num = 1
    while True:
        user_input = input(f"Usuario {user_num} - escribe las vibes separadas por coma (ej: beach, art_and_culture): ").strip()
        if user_input.lower() == "done":
            break
        user_vibes = [v.strip() for v in user_input.split(',') if v.strip()]
        if user_vibes:
            user_requests.append(user_vibes)
            user_num += 1

    return user_requests

if __name__ == "__main__":
    csv_file = "iata_airports_and_locations_with_vibes.csv"
    df_airports = load_airports_with_vibes(csv_file)
    user_requests = collect_user_requests()

    if not user_requests:
        print("No se introdujeron preferencias.")
    else:
        result = find_airports_with_all_user_preferences(df_airports, user_requests)

        print("\n=== AEROPUERTOS QUE CUMPLEN LAS PREFERENCIAS DE TODOS LOS USUARIOS ===")
        if result.empty:
            print("No se encontró ningún aeropuerto que cumpla con todas las preferencias.")
        else:
            print(result.head(10))

