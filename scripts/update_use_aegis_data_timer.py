file_path = r"c:\Users\tst20\.gemini\antigravity-ide\brain\32c05b85-0fb8-47e5-955e-abb2a01ae4e4\scratch\AEGIS\mobile\hooks\use-aegis-data.ts"

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

target = """  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData(location.latitude, location.longitude, true);
  }, [loadData, location.latitude, location.longitude]);"""

replacement = """  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData(location.latitude, location.longitude, true);
  }, [loadData, location.latitude, location.longitude]);

  // Automatic 30-second silent background polling & telemetry sync
  useEffect(() => {
    const autoRefreshTimer = setInterval(() => {
      if (location.latitude && location.longitude) {
        void loadData(location.latitude, location.longitude, true);
      }
    }, 30000);

    return () => clearInterval(autoRefreshTimer);
  }, [loadData, location.latitude, location.longitude]);"""

if target in text:
    text = text.replace(target, replacement)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(text)
    print("Updated use-aegis-data.ts with 30s auto-refresh timer")
else:
    print("Could not find target in use-aegis-data.ts")
