import openai

client = openai.OpenAI(api_key="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")  # usa tu API Key aquí

def extraer_info_importante(texto_usuario):
    prompt = f"""
Extrae los aspectos más importantes del siguiente texto relacionado con la planificación de un viaje. Resume los intereses clave y lo que busca el viajero.

Texto:
\"\"\"{texto_usuario}\"\"\"

Devuelve un resumen con:
- Temas principales de interés (playa, cultura, gastronomía, naturaleza, etc.)
- Actividades deseadas (surf, senderismo, visitas a museos, etc.)
- Clima preferido
- Presupuesto aproximado (si se menciona)
- Tipo de viaje (aventura, relajación, familiar, romántico, etc.)
"""
    response = client.chat.completions.create(
        model="gpt-3.5",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
    )

    return response.choices[0].message.content


def sugerir_destinos(info_clave):
    prompt = f"""
Basándote en esta información de viaje:
\"\"\"{info_clave}\"\"\"

Sugiere 3-5 ciudades del mundo que encajen bien con esos intereses. Devuelve solo los nombres de las ciudades y una breve razón de por qué encajan.
"""
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
    )

    return response.choices[0].message.content


# Ejemplo de uso
texto_usuario = """
Queremos hacer un viaje en pareja, relajante, con clima cálido. Nos encantan las playas, la buena comida y algo de vida nocturna. No queremos gastar demasiado.
"""

info_clave = extraer_info_importante(texto_usuario)
print("🎯 Información clave extraída:\n", info_clave)

destinos = sugerir_destinos(info_clave)
print("\n🌍 Ciudades recomendadas:\n", destinos)
