import pandas as pd

# Cargar el archivo original
df = pd.read_csv('iata_airports_and_locations_with_vibes.csv')

# Filtrar por 'London', 'Madrid' o 'Paris' en la columna 'en-GB'
filtered_df = df[df['en-GB'].str.contains('London|Madrid|Paris', case=False, na=False)]

# Guardar el nuevo CSV
filtered_df.to_csv('only_london_madrid_paris.csv', index=False)
