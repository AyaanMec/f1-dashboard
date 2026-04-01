import fastf1
import pandas as pd

fastf1.Cache.enable_cache('cache')

# Load the Bahrain 2023 race session
session = fastf1.get_session(2023, 'Bahrain Grand Prix', 'Race')
session.load()

# Now get all laps data
laps = session.laps

# Save laps to a CSV file
laps.to_csv('laps_bahrain_2023.csv', index=False)

print("✅ Laps data saved to laps_bahrain_2023.csv!")
