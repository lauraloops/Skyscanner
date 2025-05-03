import requests
import time

API_KEY = "sh967490139224896692439644109194"
HEADERS = {"x-api-key": API_KEY}

def create_search():
    url = "https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/create"
    body = {
        "query": {
            "market": "ES",
            "locale": "es-ES",
            "currency": "EUR",
            "query_legs": [{
                "origin_place_id": {"iata": "BCN"},
                "destination_place_id": {"iata": "BER"},
                "date": {"year": 2025, "month": 6, "day": 22}
            }],
            "adults": 1,
            "cabin_class": "CABIN_CLASS_ECONOMY"
        }
    }

    response = requests.post(url, json=body, headers=HEADERS)
    data = response.json()

    if "sessionToken" in data:
        return data["sessionToken"]
    else:
        print("❌ Error al crear sesión:")
        print(data)
        return None

def poll_results(session_token):
    poll_url = f"https://partners.api.skyscanner.net/apiservices/v3/flights/live/search/poll/{session_token}"

    print("⌛ Esperando resultados...")
    for _ in range(10):
        time.sleep(2)
        response = requests.post(poll_url, headers=HEADERS)
        data = response.json()
        status = data.get("status")
        if status == "RESULT_STATUS_COMPLETE":
            return data
    print("❌ No se completaron los resultados a tiempo.")
    return None

def extract_prices(data):
    itineraries = data.get("content", {}).get("results", {}).get("itineraries", {})
    prices = []
    for it in itineraries.values():
        if "pricingOptions" in it:
            amount = float(it["pricingOptions"][0]["price"]["amount"]) / 1000  # ← CORRECTO
            prices.append(amount)
    return prices



# === MAIN ===
session_token = create_search()
if session_token:
    result_data = poll_results(session_token)
    if result_data:
        prices = extract_prices(result_data)
        if prices:
            print(f"✅ Precios encontrados: {prices}")
            print(f"💰 Precio mínimo: €{min(prices)}")
        else:
            print("❌ No se encontraron precios.")
