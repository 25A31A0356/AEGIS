file_path = r"c:\Users\tst20\.gemini\antigravity-ide\brain\32c05b85-0fb8-47e5-955e-abb2a01ae4e4\scratch\AEGIS\web\src\context\LocationContext.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

target = """    return () => {
      isMounted = false;
    };
  }, [requestCurrentGPS, selectLocationItem]);"""

replacement = """    return () => {
      isMounted = false;
    };
  }, [requestCurrentGPS, selectLocationItem]);

  // Automatic 30-second background polling & telemetry refresh for Web
  useEffect(() => {
    const webRefreshTimer = setInterval(() => {
      if (selectedLocation && selectedLocation.coordinates) {
        void syncLocationTelemetry(
          selectedLocation.coordinates,
          selectedLocation.name,
          selectedLocation.stateId
        );
      }
    }, 30000);

    return () => clearInterval(webRefreshTimer);
  }, [selectedLocation, syncLocationTelemetry]);"""

if target in text:
    text = text.replace(target, replacement)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(text)
    print("Updated web LocationContext with 30s auto-refresh timer")
else:
    print("Could not find target in web LocationContext")
