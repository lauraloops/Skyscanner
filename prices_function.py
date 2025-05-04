import requests
import time
import statistics

API_KEY = "sh967490139224896692439644109194"
HEADERS = {"x-api-key": API_KEY}
CREATE_URL = "https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/create"
POLL_URL = "https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/poll/{}"

def create_search(origin_iata, destination_iata, date):
    body = {
        "query": {
            "market": "ES",
            "locale": "es-ES",
            "currency": "EUR",
            "query_legs": [{
                "origin_place_id": {"iata": origin_iata},
                "destination_place_id": {"iata": destination_iata},
                "date": {
                    "year": date["year"],
                    "month": date["month"],
                    "day": date["day"]
                }
            }],
            "adults": 1,
            "cabin_class": "CABIN_CLASS_ECONOMY"
        }
    }
    response = requests.post(CREATE_URL, json=body, headers=HEADERS)
    return response.json().get("sessionToken")

def poll_results(session_token):
    for _ in range(10):
        time.sleep(2)
        response = requests.post(POLL_URL.format(session_token), headers=HEADERS)
        data = response.json()
        if data.get("status") == "RESULT_STATUS_COMPLETE":
            return data
    return None

def get_min_price(data):
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

def compute_mean_roundtrip_price(origins, destinations, date_departure, date_return):
    result = {}
    for dest in destinations:
        roundtrip_prices = []
        for origin in origins:
            print(f"Ida: {origin} → {dest}")
            session_token_out = create_search(origin, dest, date_departure)
            if not session_token_out:
                print(f"Error creando sesión de ida para {origin} → {dest}")
                continue
            data_out = poll_results(session_token_out)
            if not data_out:
                print(f"Sin resultados de ida para {origin} → {dest}")
                continue
            price_out = get_min_price(data_out)

            print(f"Vuelta: {dest} → {origin}")
            session_token_in = create_search(dest, origin, date_return)
            if not session_token_in:
                print(f"Error creando sesión de vuelta para {dest} → {origin}")
                continue
            data_in = poll_results(session_token_in)
            if not data_in:
                print(f"Sin resultados de vuelta para {dest} → {origin}")
                continue
            price_in = get_min_price(data_in)

            if price_out is not None and price_in is not None:
                roundtrip = price_out + price_in
                print(f"Ida + Vuelta {origin} ↔ {dest}: €{roundtrip}")
                roundtrip_prices.append(roundtrip)

        if roundtrip_prices:
            mean_price = round(statistics.mean(roundtrip_prices), 2)
            result[dest] = mean_price
            print(f"Media total para {dest} (ida+vuelta): €{mean_price}\n")
        else:
            print(f"No se encontraron precios ida y vuelta para {dest}\n")
    return result

if __name__ == "__main__":
    origins = ["BCN", "FCO", "CDG"]
    destinations = ["BER", "ORD", "SYD"]
    date_departure = {"year": 2025, "month": 5, "day": 22}
    date_return = {"year": 2025, "month": 5, "day": 29}

    avg_prices = compute_mean_roundtrip_price(origins, destinations, date_departure, date_return)

    print("\nRESULTADOS FINALES DE IDA + VUELTA:")
    for dest, price in avg_prices.items():
        print(f"{dest}: €{price}")