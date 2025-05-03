import google.generativeai as genai
import os
import json # Using JSON for structured output

# --- Configuration ---
# VERY IMPORTANT!: Store your API key securely.
# The recommended way is using an environment variable.
try:
    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
    if not GOOGLE_API_KEY:
        raise ValueError("API key not found in GOOGLE_API_KEY environment variable.")
    genai.configure(api_key=GOOGLE_API_KEY)
except ValueError as e:
    print(f"Configuration Error: {e}")
    print("Please ensure the GOOGLE_API_KEY environment variable is set.")
    exit() # Exit if no key
except Exception as e:
    print(f"An unexpected error occurred during configuration: {e}")
    exit()

# --- Model Initialization ---
# Choose the Gemini model you want to use
model = genai.GenerativeModel('gemini-1.5-flash')

# --- Function to Analyze Text and Suggest Cities (Error messages inside are English) ---
# Renamed function to English convention
def analyze_travel_preferences(user_text):
    """
    Analyzes travel preference text using Gemini to extract key info
    and suggest relevant cities.

    Args:
        user_text (str): User's text describing their preferences.

    Returns:
        dict: A dictionary with key info and suggested cities,
              or None if an error occurs.
    """
    # Detailed instruction (prompt) for the Gemini model (remains Spanish as it defines the AI's task language processing)
    prompt = f"""
    Eres un asistente experto en planificación de viajes para Skyscanner.
    Analiza el siguiente texto proporcionado por un usuario sobre sus preferencias de viaje.
    Tu tarea es:
    1. Extraer los elementos clave más importantes para la planificación:
        - Intereses específicos (ej: playa, montaña, historia, arte, gastronomía).
        - Actividades deseadas (ej: senderismo, visitar museos, relajarse, vida nocturna).
        - Tipo de viaje (ej: vacaciones familiares, escapada romántica, aventura, cultural).
        - Ambiente deseado (ej: tranquilo, vibrante, natural, urbano).
        - Menciones de lugares, fechas, duración o presupuesto (si existen).
        - Cualquier otra restricción o preferencia relevante.
    2. Basándote EXCLUSIVAMENTE en los elementos clave extraídos del texto, sugiere 5 ciudades
       que serían destinos ideales.
    3. Para cada ciudad sugerida, explica brevemente (1-2 frases) por qué encaja con las
       preferencias del usuario, relacionándola directamente con los elementos clave extraídos.

    Texto del usuario:
    ---
    {user_text}
    ---

    Devuelve la respuesta estructurada en formato JSON. El JSON debe tener dos claves principales:
    - "elementos_clave": Una lista de strings, donde cada string es un punto importante extraído.
    - "ciudades_sugeridas": Una lista de diccionarios. Cada diccionario debe contener:
        - "ciudad": El nombre de la ciudad (y país si es relevante para evitar ambigüedad).
        - "razon": La explicación concisa de por qué se sugiere esa ciudad basada en el texto.
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

    except json.JSONDecodeError:
        print("Error: The model's response could not be decoded as JSON.")
        print("Received response from model (may contain useful information or an error):\n", response.text)
        if hasattr(response, 'prompt_feedback') and response.prompt_feedback.block_reason:
             print(f"Block detected: {response.prompt_feedback.block_reason}")
        return None
    except Exception as e:
        print(f"Error interacting with the Gemini API: {e}")
        if 'response' in locals() and hasattr(response, 'text'):
            print("Partial or error response from model:", response.text)
        if 'response' in locals() and hasattr(response, 'prompt_feedback') and response.prompt_feedback.block_reason:
             print(f"Block detected: {response.prompt_feedback.block_reason}")
        return None

# --- Main Execution ---
if __name__ == "__main__":
    # All user-facing prompts and messages are now in English
    print("-" * 40)
    print(" Travel Planning Assistant ")
    print("-" * 40)
    print("Describe what specific preferences you.")
    print("\nEnter your description and press Enter:")
    user_description = input("> ")

    # Check if the user entered something
    if user_description and user_description.strip():
        print("\n Analyzing your preferences...")
        print("-" * 30)

        # Call the analysis function (renamed)
        analysis_result = analyze_travel_preferences(user_description)

        # Display results if analysis was successful
        if analysis_result:
            print("\n Analysis Completed:")
            
            # # --- Key Elements Section ---
            key_elements = analysis_result.get("elementos_clave", [])

            # # --- Suggested Cities with Reasons Section ---
            # # Use .get() for safer access, provide default empty list
            suggested_cities_data = analysis_result.get("ciudades_sugeridas", [])
            # # --- New Section: City Names List Only ---
            print("📋 List of Suggested City Names Only:")
            if suggested_cities_data: # Reuse the variable from previous section
                # Extract just the city names using a list comprehension
                city_names_list = [
                    suggestion.get('ciudad', 'N/A')
                    for suggestion in suggested_cities_data
                    if suggestion.get('ciudad') # Ensure 'ciudad' key exists and is not None/empty
                ]
                if city_names_list:
                    for city_name in city_names_list:
                        print(f"- {city_name}")
                else:
                    # Handle case where suggestions exist but have no valid city names
                    print("  (No valid city names found in the suggestions)")
            else:
                 # Handle case where no suggestions were returned at all
                 print("  (No city suggestions data available to create a list)")
            print("-------------------------------------")
            # --- End of New Section ---

        else:
            # English Error Message
            print("\n Analysis could not be completed due to a previous error.")

    else:
        # User guidance messages in English upon providing no input
        print("\nNo description entered.")
        print("Please run the script again and enter your preferences.")