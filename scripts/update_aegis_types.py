file_path = r"c:\Users\tst20\.gemini\antigravity-ide\brain\32c05b85-0fb8-47e5-955e-abb2a01ae4e4\scratch\AEGIS\mobile\lib\services\aegis-types.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

target = "  forecast: WeatherForecastDay[];"
replacement = """  forecast: WeatherForecastDay[];
  pressureHpa?: number;
  uvIndex?: number;
  aqi?: number;
  aqiStatus?: string;
  dewPointC?: number;
  windDirectionCardinal?: string;
  sunriseTime?: string;
  sunsetTime?: string;
  daylightDuration?: string;
  riskScore?: number;
  riskLevel?: string;"""

if target in content and "pressureHpa" not in content:
    content = content.replace(target, replacement)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated aegis-types.ts successfully")
else:
    print("aegis-types.ts already up to date or target not found")
