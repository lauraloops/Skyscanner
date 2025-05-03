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
    user_filtered_sets = []

    for user_vibes in user_requests:
        matching_airports = df[df['vibes'].apply(lambda vibes: set(user_vibes).issubset(set(vibes)))]
        user_filtered_sets.append(set(matching_airports['id']))

    # Intersección de todos los sets de IDs
    common_ids = set.intersection(*user_filtered_sets)
    df_filtered = df[df['id'].isin(common_ids)]

    # Si hay resultados que cumplen todo, los devolvemos directamente
    if not df_filtered.empty:
        return df_filtered[['id', 'IATA', 'en-GB', 'vibes']]

    # Si no, buscar los que más coincidencias tienen con todas las vibes pedidas
    print("\n[!] There are no airports that match all preferences.")
    print("[!] Showing the 10 closest airports...")

    # Unión de todas las vibes pedidas por todos los usuarios
    all_requested_vibes = set().union(*user_requests)

    # Calcular cuántas vibes pedidas tiene cada aeropuerto
    df['matched_vibes_count'] = df['vibes'].apply(lambda vibes: len(set(vibes).intersection(all_requested_vibes)))

    # Ordenar por mayor cantidad de coincidencias y devolver top 10
    df_sorted = df.sort_values(by='matched_vibes_count', ascending=False).head(10)

    return df_sorted[['id', 'IATA', 'en-GB', 'vibes', 'matched_vibes_count']]


def collect_user_requests(valid_vibes: set) -> List[List[str]]:
    user_requests = []
    
    while True:
        try:
            total_users = int(input("How many users are there? Enter an integer: "))
            if total_users > 0:
                break
            else:
                print("The number must be greater than 0.")
        except ValueError:
            print("Invalid entrance. Please, enter an integer.")

    for user_num in range(1, total_users + 1):
        while True:
            user_input = input(f"User {user_num} - writte the vibes separated by a ",": ").strip()
            user_vibes = [v.strip() for v in user_input.split(',') if v.strip()]
            filtered_vibes = [v for v in user_vibes if v in valid_vibes]

            if filtered_vibes:
                user_requests.append(filtered_vibes)
                break
            else:
                print("None of the introduced vibes is valid. Try again.")

    return user_requests


if __name__ == "__main__":
    pd.set_option('display.max_colwidth', None)

    csv_file = "iata_airports_and_locations_with_vibes.csv"
    df_airports = load_airports_with_vibes(csv_file)

    # Obtener el conjunto de todas las vibes válidas del DataFrame
    all_vibes = set(v for vibes_list in df_airports['vibes'] for v in vibes_list)

    user_requests = collect_user_requests(valid_vibes=all_vibes)

    if not user_requests:
        print("No valid preferences introduced.")
    else:
        result = find_airports_with_all_user_preferences(df_airports, user_requests)

        print("\n=== AIRPORTS THAT MATCH ALL PREFERENCES ===")
        if result.empty:
            print("No airport that satisfies all preferences has been found.")
        else:
            print(result.head(10))


