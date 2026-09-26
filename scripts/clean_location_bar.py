file_path = r"c:\Users\tst20\.gemini\antigravity-ide\brain\32c05b85-0fb8-47e5-955e-abb2a01ae4e4\scratch\AEGIS\mobile\app\(tabs)\index.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

old_card = """        {/* 3. USER GREETING & LOCATION CARD (WITH 1-TAP VILLAGE PICKER) */}
        <View style={styles.cyanGreetingCard}>
          <View style={styles.greetingHeader}>
            <Pressable
              onPress={() => setIsLocationModalVisible(true)}
              style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: 0.85 }]}
              accessibilityLabel="Change location"
            >
              <Text style={styles.greetingTitle}>
                Hi {userName}! 👋
              </Text>
              <View style={styles.villageLocationRow}>
                <Text style={styles.pinIcon}>{locEmoji}</Text>
                <Text style={styles.villageNameText}>
                  {locType}: {cleanVillageName}
                </Text>
                <View style={{ backgroundColor: "#065F4620", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: "800", color: "#065F46" }}>CHANGE ✏️</Text>
                </View>
              </View>
              {nearbyPlace ? (
                <Text style={{ fontSize: 12, color: "#065F46", fontWeight: "600", marginTop: 2 }}>
                  Near {nearbyPlace}
                </Text>
              ) : null}
            </Pressable>

            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              {/* Search Village Button */}
              <Pressable
                onPress={() => setIsLocationModalVisible(true)}
                style={({ pressed }) => [
                  styles.mintLocationBtn,
                  { backgroundColor: "#CCFBF1", borderColor: "#99F6E4" },
                  pressed && styles.pressed,
                ]}
                accessibilityLabel="Search Village"
              >
                <IconSymbol name="magnifyingglass" size={20} color="#0D9488" />
              </Pressable>

              {/* Voice Announcement / Speak Location Button */}
              <Pressable
                onPress={() => speakAegisLocation(location.speechText || `Your location is ${cleanVillageName}, ${locType}.`)}
                style={({ pressed }) => [
                  styles.mintLocationBtn,
                  { backgroundColor: "#CCFBF1", borderColor: "#99F6E4" },
                  pressed && styles.pressed,
                ]}
                accessibilityLabel="Speak Location"
              >
                <IconSymbol name="speaker.wave.2.fill" size={22} color="#0D9488" />
              </Pressable>

              {/* Mint Location Target Refresh Button */}
              <Pressable
                onPress={handleLocationRefresh}
                disabled={isRefreshing}
                style={({ pressed }) => [
                  styles.mintLocationBtn,
                  pressed && styles.pressed,
                ]}
                accessibilityLabel="Refresh Location"
              >
                {isRefreshing ? (
                  <ActivityIndicator size="small" color="#059669" />
                ) : (
                  <IconSymbol name="location.fill" size={24} color="#059669" />
                )}
              </Pressable>
            </View>
          </View>
        </View>"""

new_card = """        {/* 3. USER GREETING & LOCATION CARD (CLEAN LOCATION BAR) */}
        <View style={styles.cyanGreetingCard}>
          <View style={styles.greetingHeader}>
            <Pressable
              onPress={() => setIsLocationModalVisible(true)}
              style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: 0.85 }]}
              accessibilityLabel="Change location"
            >
              <Text style={styles.greetingTitle}>
                Hi {userName}! 👋
              </Text>
              <View style={styles.villageLocationRow}>
                <Text style={styles.villageNameText}>
                  {cleanVillageName || location.label || "Your Area"}
                </Text>
                <View style={{ backgroundColor: "#065F4620", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: "800", color: "#065F46" }}>CHANGE ✏️</Text>
                </View>
              </View>
              {nearbyPlace ? (
                <Text style={{ fontSize: 12, color: "#065F46", fontWeight: "600", marginTop: 2 }}>
                  Near {nearbyPlace}
                </Text>
              ) : null}
            </Pressable>

            {/* Single Clean Location GPS Refresh Button */}
            <Pressable
              onPress={handleLocationRefresh}
              disabled={isRefreshing}
              style={({ pressed }) => [
                styles.mintLocationBtn,
                pressed && styles.pressed,
              ]}
              accessibilityLabel="Refresh Location"
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : (
                <IconSymbol name="location.fill" size={24} color="#059669" />
              )}
            </Pressable>
          </View>
        </View>"""

if old_card in text:
    text = text.replace(old_card, new_card)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(text)
    print("Successfully cleaned location bar and removed extra boxes and District prefix")
else:
    print("Could not match old_card exactly")
