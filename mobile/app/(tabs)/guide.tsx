import { useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppPreferences } from "@/lib/app-preferences";

export default function GuideScreen() {
  const colors = useColors();
  const { dict } = useAppPreferences();

  const guides = useMemo(() => [
    {
      key: "flood",
      title: dict.floodTitle,
      short: dict.flooding,
      icon: "cloud.sun.fill",
      color: "#2479A8",
      answer: dict.floodAnswer,
      doList: [
        "Move valuable items & family to higher ground early",
        "Switch off main electricity breaker and gas valve",
        "Carry drinking water, essential medicines & ID documents",
      ],
      dontList: [
        "Never walk, swim or drive through moving flood water",
        "Do not touch fallen electric wires or submerged poles",
      ],
    },
    {
      key: "cyclone",
      title: dict.cycloneTitle,
      short: "Cyclone",
      icon: "wind",
      color: "#0F5B66",
      answer: dict.cycloneAnswer,
      doList: [
        "Stay strictly indoors away from glass windows",
        "Charge mobile phones, power banks and emergency torches",
        "Listen to official weather bulletins and NDMA alerts",
      ],
      dontList: [
        "Do not venture near the beach, coast or low bridges",
        "Do not spread unverified rumors on social media",
      ],
    },
    {
      key: "earthquake",
      title: dict.earthquakeTitle,
      short: "Earthquake",
      icon: "location.fill",
      color: "#D97706",
      answer: dict.quakeAnswer,
      doList: [
        "DROP to the ground, COVER head under sturdy table",
        "HOLD ON firmly until the shaking completely stops",
        "If outdoors, move to an open area away from buildings",
      ],
      dontList: [
        "Do not use elevators or lifts during or after tremors",
        "Do not rush to crowded staircases in panic",
      ],
    },
    {
      key: "firstAid",
      title: dict.firstAidTitle,
      short: "First Aid",
      icon: "sos.circle.fill",
      color: "#C73535",
      answer: dict.firstAidAnswer,
      doList: [
        "For bleeding: Apply firm continuous pressure with clean cloth",
        "For burns: Cool immediately under clean tap water for 15-20 min",
        "Keep the injured person calm and call emergency dispatch",
      ],
      dontList: [
        "Never apply ice, butter or toothpaste to serious burns",
        "Do not remove deeply embedded objects from wounds",
      ],
    },
    {
      key: "grabBag",
      title: dict.grabBagTitle,
      short: "Grab Bag",
      icon: "book.closed.fill",
      color: "#7D5A3A",
      answer: dict.packAnswer,
      doList: [
        "Pack 3L water per person & ready-to-eat dry foods",
        "Include prescription medicines & first aid kit",
        "Keep bright LED flashlight, power bank, whistle & cash",
      ],
      dontList: [
        "Do not pack heavy unnecessary non-essential items",
        "Do not leave official IDs without waterproof protection",
      ],
    },
  ], [dict]);

  const [activeKey, setActiveKey] = useState("flood");
  const currentGuide = guides.find((g) => g.key === activeKey) || guides[0];

  return (
    <ScreenContainer className="px-5" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[styles.kicker, { color: colors.primary }]}>{dict.offlineHandbook}</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>{dict.survivalGuides}</Text>
        <Text style={[styles.intro, { color: colors.muted }]}>{dict.actionableAdvice}</Text>

        {/* Hazard Selector Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hazards}>
          {guides.map((item) => {
            const isSel = activeKey === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setActiveKey(item.key)}
                style={[
                  styles.hazard,
                  {
                    borderColor: isSel ? item.color : colors.border,
                    backgroundColor: isSel ? item.color + "18" : colors.surface,
                  },
                ]}
              >
                <IconSymbol name={item.icon as any} size={18} color={item.color} />
                <Text style={[styles.hazardText, { color: isSel ? item.color : colors.foreground }]}>
                  {item.short}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Summary Card with Active Language Answer */}
        <View style={[styles.hero, { backgroundColor: currentGuide.color + "12", borderColor: currentGuide.color + "3C" }]}>
          <View style={[styles.heroIcon, { backgroundColor: currentGuide.color }]}>
            <IconSymbol name="info.circle.fill" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>{currentGuide.title}</Text>
            <Text style={[styles.heroCopy, { color: colors.foreground }]}>{currentGuide.answer}</Text>
          </View>
        </View>

        {/* Actionable Dos */}
        <Text style={[styles.section, { color: colors.success }]}>DO (अनुकरणीय)</Text>
        {currentGuide.doList.map((item, idx) => (
          <View key={idx} style={[styles.row, { borderBottomColor: colors.border }]}>
            <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
            <Text style={[styles.rowText, { color: colors.foreground }]}>{item}</Text>
          </View>
        ))}

        {/* Actionable Don'ts */}
        <Text style={[styles.section, { color: colors.error, marginTop: 18 }]}>{"DON'T (निषेध)"}</Text>
        {currentGuide.dontList.map((item, idx) => (
          <View key={idx} style={[styles.row, { borderBottomColor: colors.border }]}>
            <IconSymbol name="xmark.circle.fill" size={20} color={colors.error} />
            <Text style={[styles.rowText, { color: colors.foreground }]}>{item}</Text>
          </View>
        ))}

        {/* Helplines */}
        <Text style={[styles.section, { color: colors.primary, marginTop: 24 }]}>EMERGENCY HELPLINES</Text>
        <Pressable
          onPress={() => Linking.openURL("tel:112")}
          style={[styles.help, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 8 }]}
        >
          <IconSymbol name="phone.fill" size={20} color={colors.error} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.helpTitle, { color: colors.foreground }]}>112 • National Emergency</Text>
            <Text style={[styles.helpSub, { color: colors.muted }]}>Police, Fire & Ambulance response across India</Text>
          </View>
          <IconSymbol name="chevron.right" size={18} color={colors.muted} />
        </Pressable>

        <Pressable
          onPress={() => Linking.openURL("tel:108")}
          style={[styles.help, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 8 }]}
        >
          <IconSymbol name="phone.fill" size={20} color="#1A73E8" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.helpTitle, { color: colors.foreground }]}>108 • Medical Ambulance</Text>
            <Text style={[styles.helpSub, { color: colors.muted }]}>Free emergency medical transportation</Text>
          </View>
          <IconSymbol name="chevron.right" size={18} color={colors.muted} />
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 16, paddingBottom: 36 },
  kicker: { fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  title: { fontSize: 28, fontWeight: "900", marginTop: 4 },
  intro: { fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 16 },
  hazards: { gap: 8, paddingBottom: 4 },
  hazard: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9 },
  hazardText: { fontSize: 11, fontWeight: "800" },
  hero: { flexDirection: "row", gap: 12, padding: 15, borderRadius: 18, borderWidth: 1, marginTop: 16, marginBottom: 20 },
  heroIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  heroTitle: { fontSize: 15, fontWeight: "900", marginBottom: 6 },
  heroCopy: { fontSize: 12, lineHeight: 18 },
  section: { fontSize: 11, fontWeight: "900", letterSpacing: 1.2, marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: 1 },
  rowText: { fontSize: 12.5, fontWeight: "600", flex: 1, lineHeight: 17 },
  help: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 16, borderWidth: 1, padding: 14 },
  helpTitle: { fontSize: 13, fontWeight: "800" },
  helpSub: { fontSize: 11, marginTop: 3 },
});
