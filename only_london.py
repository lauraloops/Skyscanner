import pandas as pd

# Cargar el archivo original
df = pd.read_csv('iata_airports_and_locations_with_vibes.csv')

# Filtrar las filas donde la columna 'en-GB' contiene 'London' o 'london'
filtered_df = df[df['en-GB'].str.contains('London', case=False, na=False)]

# Guardar el nuevo CSV
filtered_df.to_csv('only_london.csv', index=False)