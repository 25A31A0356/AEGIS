file_path = r"c:\Users\tst20\.gemini\antigravity-ide\brain\32c05b85-0fb8-47e5-955e-abb2a01ae4e4\scratch\AEGIS\mobile\app\(tabs)\index.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

old_block = """            <Pressable
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
            </Pressable>"""

new_block = """            <Pressable
              onPress={() => setIsLocationModalVisible(true)}
              style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: 0.85 }]}
              accessibilityLabel="Change location"
            >
              <Text style={styles.greetingTitle}>
                Hi {userName}!
              </Text>
              <View style={styles.villageLocationRow}>
                <Text style={styles.villageNameText}>
                  {cleanVillageName || location.label || "Your Area"}
                </Text>
              </View>
              {nearbyPlace ? (
                <Text style={{ fontSize: 12, color: "#065F46", fontWeight: "600", marginTop: 2 }}>
                  Near {nearbyPlace}
                </Text>
              ) : null}
            </Pressable>"""

if old_block in text:
    text = text.replace(old_block, new_block)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(text)
    print("Successfully removed 👋 and CHANGE ✏️ badge while keeping clickable change modal working")
else:
    print("Could not match old_block")
