file_path = r"c:\Users\tst20\.gemini\antigravity-ide\brain\32c05b85-0fb8-47e5-955e-abb2a01ae4e4\scratch\AEGIS\mobile\app\(tabs)\index.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Update Disaster Risk Index Card Markup
old_risk_jsx = """          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <IconSymbol name="shield.fill" size={18} color="#F59E0B" />
              <Text style={[styles.sectionHeadingSmall, { color: colors.foreground }]}>DISASTER RISK INDEX</Text>
            </View>
            <View style={styles.moderatePill}>
              <Text style={styles.moderatePillText}>MODERATE</Text>
            </View>
          </View>

          <View style={styles.riskBigScoreRow}>
            <Text style={[styles.bigRiskNumber, { color: colors.foreground }]}>34</Text>
            <Text style={[styles.maxRiskText, { color: colors.muted }]}>/ 100 max risk</Text>
          </View>

          {/* Green Progress Gauge */}
          <View style={[styles.gaugeTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.gaugeFill, { width: "34%", backgroundColor: "#10B981" }]} />
          </View>

          <Text style={[styles.riskExplainText, { color: colors.muted }]}>
            Real-time multi-hazard assessment factoring cyclonic depressions, convective rain cells, and active district emergency beacons.
          </Text>

          {/* Contributing Factors */}
          <View style={[styles.factorsSection, { borderTopColor: colors.border }]}>
            <Text style={[styles.factorsTitle, { color: colors.muted }]}>CONTRIBUTING FACTORS</Text>

            <View style={styles.factorLine}>
              <Text style={[styles.factorName, { color: colors.muted }]}>• Rainfall Probability</Text>
              <Text style={[styles.factorNumber, { color: colors.foreground }]}>35%</Text>
            </View>

            <View style={styles.factorLine}>
              <Text style={[styles.factorName, { color: colors.muted }]}>• Wind Velocity Shear</Text>
              <Text style={[styles.factorNumber, { color: colors.foreground }]}>18 km/h</Text>
            </View>

            <View style={styles.factorLine}>
              <Text style={[styles.factorName, { color: colors.muted }]}>• Active SOS Beacons</Text>
              <Text style={[styles.factorNumber, { color: "#EF4444" }]}>2 Active</Text>
            </View>
          </View>"""

new_risk_jsx = """          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <IconSymbol name="shield.fill" size={18} color={riskColor} />
              <Text style={[styles.sectionHeadingSmall, { color: colors.foreground }]}>DISASTER RISK INDEX</Text>
            </View>
            <View style={[styles.moderatePill, { backgroundColor: `${riskColor}22`, borderColor: riskColor, borderWidth: 1 }]}>
              <Text style={[styles.moderatePillText, { color: riskColor }]}>{riskCategory}</Text>
            </View>
          </View>

          <View style={styles.riskBigScoreRow}>
            <Text style={[styles.bigRiskNumber, { color: colors.foreground }]}>{calculatedRiskScore}</Text>
            <Text style={[styles.maxRiskText, { color: colors.muted }]}>/ 100 live risk</Text>
          </View>

          {/* Dynamic Progress Gauge */}
          <View style={[styles.gaugeTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.gaugeFill, { width: `${calculatedRiskScore}%`, backgroundColor: riskColor }]} />
          </View>

          <Text style={[styles.riskExplainText, { color: colors.muted }]}>
            Real-time multi-hazard assessment factoring cyclonic depressions, convective rain cells, and active district emergency beacons for {location.label}.
          </Text>

          {/* Contributing Factors */}
          <View style={[styles.factorsSection, { borderTopColor: colors.border }]}>
            <Text style={[styles.factorsTitle, { color: colors.muted }]}>CONTRIBUTING FACTORS</Text>

            <View style={styles.factorLine}>
              <Text style={[styles.factorName, { color: colors.muted }]}>• Rainfall Probability</Text>
              <Text style={[styles.factorNumber, { color: colors.foreground }]}>{rainProb}%</Text>
            </View>

            <View style={styles.factorLine}>
              <Text style={[styles.factorName, { color: colors.muted }]}>• Wind Velocity Shear</Text>
              <Text style={[styles.factorNumber, { color: colors.foreground }]}>{windSpeed} km/h</Text>
            </View>

            <View style={styles.factorLine}>
              <Text style={[styles.factorName, { color: colors.muted }]}>• Active Critical Alerts</Text>
              <Text style={[styles.factorNumber, { color: activeCriticalAlerts.length > 0 ? "#EF4444" : colors.foreground }]}>
                {activeCriticalAlerts.length} Active
              </Text>
            </View>
          </View>"""

if old_risk_jsx in text:
    text = text.replace(old_risk_jsx, new_risk_jsx)
    print("Updated Risk Index JSX")
else:
    print("Risk index JSX not matched")

# 2. Update Highlights Cards (UV, Wind, Humidity, Solar, AQI)
old_highlights = """            {/* Card 2: UV Radiation Index */}
            <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.highlightTop}>
                <Text style={[styles.highlightTitle, { color: colors.muted }]}>UV Radiation Index</Text>
                <IconSymbol name="sun.max.fill" size={18} color="#F59E0B" />
              </View>
              <Text style={[styles.highlightBigVal, { color: colors.foreground }]}>
                6 <Text style={{ fontSize: 14, fontWeight: "800", color: "#EA580C" }}>High</Text>
              </Text>
              <View style={[styles.gaugeTrackSmall, { backgroundColor: colors.border }]}>
                <View style={[styles.gaugeFillSmall, { width: "60%", backgroundColor: "#EA580C" }]} />
              </View>
              <Text style={[styles.highlightSubText, { color: colors.muted }]}>
                Peak solar intensity from 11:30 to 14:30 IST.
              </Text>
            </View>

            {/* Card 3: Wind Status & Gusts */}
            <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.highlightTop}>
                <Text style={[styles.highlightTitle, { color: colors.muted }]}>Wind Status & Gusts</Text>
                <IconSymbol name="wind" size={18} color="#0284C7" />
              </View>
              <Text style={[styles.highlightBigVal, { color: colors.foreground }]}>
                18 <Text style={{ fontSize: 13, fontWeight: "600" }}>km/h (SW)</Text>
              </Text>
              <View style={styles.highlightMetaRow}>
                <Text style={[styles.highlightSubText, { color: colors.muted }]}>Peak Gusts: <Text style={{ fontWeight: "700", color: colors.foreground }}>23 km/h</Text></Text>
                <Text style={[styles.highlightSubText, { color: colors.muted }]}>Moderate Breeze</Text>
              </View>
            </View>

            {/* Card 4: Humidity & Dew Point */}
            <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.highlightTop}>
                <Text style={[styles.highlightTitle, { color: colors.muted }]}>Humidity & Dew Point</Text>
                <IconSymbol name="drop.fill" size={18} color="#0284C7" />
              </View>
              <Text style={[styles.highlightBigVal, { color: colors.foreground }]}>
                61% <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted }}>Dew Point: {dewPoint}°C</Text>
              </Text>
              <Text style={[styles.highlightSubText, { color: colors.muted, marginTop: 4 }]}>
                Atmospheric moisture level is high, increasing perceived thermal index.
              </Text>
            </View>

            {/* Card 5: Solar Cycle (Sunrise/Sunset) */}
            <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.highlightTop}>
                <Text style={[styles.highlightTitle, { color: colors.muted }]}>Solar Cycle (Sunrise/Sunset)</Text>
                <IconSymbol name="sun.max.fill" size={18} color="#F59E0B" />
              </View>
              <View style={styles.solarRow}>
                <Text style={[styles.solarText, { color: colors.foreground }]}>↑ Sunrise <Text style={{ fontWeight: "800" }}>05:48 AM</Text></Text>
                <Text style={[styles.solarText, { color: colors.foreground }]}>↓ Sunset <Text style={{ fontWeight: "800" }}>06:14 PM</Text></Text>
              </View>
              <Text style={[styles.highlightSubText, { color: colors.muted, marginTop: 4 }]}>
                Total Daylight: 12h 26m
              </Text>
            </View>

            {/* Card 6: Air Quality Index (AQI) */}
            <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.highlightTop}>
                <Text style={[styles.highlightTitle, { color: colors.muted }]}>Air Quality Index (AQI)</Text>
                <IconSymbol name="leaf.fill" size={18} color="#10B981" />
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 2 }}>
                <Text style={[styles.highlightBigVal, { color: colors.foreground }]}>65</Text>
                <View style={styles.aqiPill}>
                  <Text style={styles.aqiPillText}>Moderate</Text>
                </View>
              </View>
              <Text style={[styles.highlightSubText, { color: colors.muted, marginTop: 4 }]}>
                Barometric Pressure: <Text style={{ fontWeight: "700", color: colors.foreground }}>1006 hPa</Text> (Steady)
              </Text>
            </View>"""

new_highlights = """            {/* Card 2: UV Radiation Index */}
            <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.highlightTop}>
                <Text style={[styles.highlightTitle, { color: colors.muted }]}>UV Radiation Index</Text>
                <IconSymbol name="sun.max.fill" size={18} color="#F59E0B" />
              </View>
              <Text style={[styles.highlightBigVal, { color: colors.foreground }]}>
                {dynamicUv.val} <Text style={{ fontSize: 14, fontWeight: "800", color: dynamicUv.color }}>{dynamicUv.label}</Text>
              </Text>
              <View style={[styles.gaugeTrackSmall, { backgroundColor: colors.border }]}>
                <View style={[styles.gaugeFillSmall, { width: dynamicUv.pct, backgroundColor: dynamicUv.color }]} />
              </View>
              <Text style={[styles.highlightSubText, { color: colors.muted }]}>
                Solar radiation modeled for latitude {location.latitude.toFixed(2)}°N.
              </Text>
            </View>

            {/* Card 3: Wind Status & Gusts */}
            <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.highlightTop}>
                <Text style={[styles.highlightTitle, { color: colors.muted }]}>Wind Status & Gusts</Text>
                <IconSymbol name="wind" size={18} color="#0284C7" />
              </View>
              <Text style={[styles.highlightBigVal, { color: colors.foreground }]}>
                {windSpeed} <Text style={{ fontSize: 13, fontWeight: "600" }}>km/h</Text>
              </Text>
              <View style={styles.highlightMetaRow}>
                <Text style={[styles.highlightSubText, { color: colors.muted }]}>Peak Gusts: <Text style={{ fontWeight: "700", color: colors.foreground }}>{Math.round(windSpeed * 1.35)} km/h</Text></Text>
                <Text style={[styles.highlightSubText, { color: colors.muted }]}>{windSpeed > 30 ? "Strong Breeze" : "Moderate Breeze"}</Text>
              </View>
            </View>

            {/* Card 4: Humidity & Dew Point */}
            <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.highlightTop}>
                <Text style={[styles.highlightTitle, { color: colors.muted }]}>Humidity & Dew Point</Text>
                <IconSymbol name="drop.fill" size={18} color="#0284C7" />
              </View>
              <Text style={[styles.highlightBigVal, { color: colors.foreground }]}>
                {humidity}% <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted }}>Dew Point: {dewPoint}°C</Text>
              </Text>
              <Text style={[styles.highlightSubText, { color: colors.muted, marginTop: 4 }]}>
                Atmospheric moisture at {humidity}% relative humidity.
              </Text>
            </View>

            {/* Card 5: Solar Cycle (Sunrise/Sunset) */}
            <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.highlightTop}>
                <Text style={[styles.highlightTitle, { color: colors.muted }]}>Solar Cycle (Sunrise/Sunset)</Text>
                <IconSymbol name="sun.max.fill" size={18} color="#F59E0B" />
              </View>
              <View style={styles.solarRow}>
                <Text style={[styles.solarText, { color: colors.foreground }]}>↑ Sunrise <Text style={{ fontWeight: "800" }}>{solarCycle.sunrise}</Text></Text>
                <Text style={[styles.solarText, { color: colors.foreground }]}>↓ Sunset <Text style={{ fontWeight: "800" }}>{solarCycle.sunset}</Text></Text>
              </View>
              <Text style={[styles.highlightSubText, { color: colors.muted, marginTop: 4 }]}>
                Total Daylight: {solarCycle.daylight}
              </Text>
            </View>

            {/* Card 6: Air Quality Index (AQI) */}
            <View style={[styles.highlightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.highlightTop}>
                <Text style={[styles.highlightTitle, { color: colors.muted }]}>Air Quality Index (AQI)</Text>
                <IconSymbol name="leaf.fill" size={18} color={dynamicAqi.color} />
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 2 }}>
                <Text style={[styles.highlightBigVal, { color: colors.foreground }]}>{dynamicAqi.val}</Text>
                <View style={[styles.aqiPill, { backgroundColor: `${dynamicAqi.color}22` }]}>
                  <Text style={[styles.aqiPillText, { color: dynamicAqi.color }]}>{dynamicAqi.label}</Text>
                </View>
              </View>
              <Text style={[styles.highlightSubText, { color: colors.muted, marginTop: 4 }]}>
                Barometric Pressure: <Text style={{ fontWeight: "700", color: colors.foreground }}>{pressure} hPa</Text>
              </Text>
            </View>"""

if old_highlights in text:
    text = text.replace(old_highlights, new_highlights)
    print("Updated Highlights JSX")
else:
    print("Highlights JSX not matched")

# 3. Update Active Hazards Near You Markup
old_hazards_jsx = """          {/* Hazard item box */}
          <Pressable
            onPress={() => router.push("/hazards" as any)}
            style={[styles.hazardItemBox, { backgroundColor: colors.background, borderColor: colors.border }]}
          >
            <View style={styles.hazardItemTop}>
              <View style={styles.warningTag}>
                <Text style={styles.warningTagText}>WARNING</Text>
              </View>
              <Text style={[styles.hazardTitleText, { color: colors.foreground }]} numberOfLines={1}>
                Seismic Watch: M5.4 Earthquake Epicenter Relaxation
              </Text>
              <Text style={{ fontSize: 16, color: colors.muted }}>➔</Text>
            </View>
            <Text style={[styles.hazardSubDesc, { color: colors.muted }]} numberOfLines={1}>
              Seismic Watch: M5.4 Earthquake Epicenter Relaxation
            </Text>
            <Text style={[styles.hazardDistanceText, { color: colors.muted }]}>
              📍 1672.6 km away &bull; Status: <Text style={{ color: "#059669", fontWeight: "700" }}>monitoring</Text>
            </Text>
          </Pressable>"""

new_hazards_jsx = """          {/* Hazard item box */}
          <Pressable
            onPress={() => router.push("/hazards" as any)}
            style={[styles.hazardItemBox, { backgroundColor: colors.background, borderColor: colors.border }]}
          >
            <View style={styles.hazardItemTop}>
              <View style={[styles.warningTag, { backgroundColor: nearestHazard.severity === "CRITICAL" ? "#EF4444" : "#F59E0B" }]}>
                <Text style={styles.warningTagText}>{nearestHazard.severity || "ADVISORY"}</Text>
              </View>
              <Text style={[styles.hazardTitleText, { color: colors.foreground }]} numberOfLines={1}>
                {nearestHazard.title}
              </Text>
              <Text style={{ fontSize: 16, color: colors.muted }}>➔</Text>
            </View>
            <Text style={[styles.hazardSubDesc, { color: colors.muted }]} numberOfLines={1}>
              {nearestHazard.description}
            </Text>
            <Text style={[styles.hazardDistanceText, { color: colors.muted }]}>
              📍 {nearestHazard.distanceKm > 0 ? `${nearestHazard.distanceKm} km away` : "Local Grid Zone"} &bull; Status: <Text style={{ color: "#059669", fontWeight: "700" }}>active</Text>
            </Text>
          </Pressable>"""

if old_hazards_jsx in text:
    text = text.replace(old_hazards_jsx, new_hazards_jsx)
    print("Updated Hazards Near You JSX")
else:
    print("Hazards Near You JSX not matched")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(text)

print("Saved all updates")
