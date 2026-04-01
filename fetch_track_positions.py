import fastf1
import pandas as pd

# Enable cache (make sure you have 'cache' folder created already)
fastf1.Cache.enable_cache('cache')

# Load the session
session = fastf1.get_session(2023, 'Bahrain Grand Prix', 'Race')
session.load()

# List of all drivers in the session
drivers = session.laps['Driver'].unique()

# Create a dataframe to hold all telemetry data
all_telemetry = pd.DataFrame()

for driver in drivers:
    laps = session.laps.pick_driver(driver)
    if not laps.empty:
        lap = laps.pick_fastest()
        tel = lap.get_car_data().add_distance()
        tel['Driver'] = driver
        tel['LapNumber'] = lap['LapNumber']
        all_telemetry = pd.concat([all_telemetry, tel])

# Save all telemetry to CSV
all_telemetry.to_csv('driver_positions_bahrain.csv', index=False)

print("✅ Telemetry data saved to driver_positions_bahrain.csv!")
