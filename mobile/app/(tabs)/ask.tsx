import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppPreferences } from "@/lib/app-preferences";

interface ChatMessage {
  id: string;
  from: "user" | "bot";
  text: string;
  timestamp?: string;
}

export default function AskScreen() {
  const colors = useColors();
  const { t, dict, language } = useAppPreferences();

  const quickQuestions = useMemo(() => [
    { q: dict.packQuestion, a: dict.packAnswer },
    { q: dict.floodQuestion, a: dict.floodAnswer },
    { q: dict.routeQuestion, a: dict.routeAnswer },
    { q: dict.pingQuestion, a: dict.pingAnswer },
    { q: dict.cycloneQuestion, a: dict.cycloneAnswer },
    { q: dict.quakeQuestion, a: dict.quakeAnswer },
    { q: dict.firstAidQuestion, a: dict.firstAidAnswer },
    { q: dict.contactQuestion, a: dict.contactAnswer },
  ], [dict]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: "init", from: "bot", text: dict.botGreeting }
  ]);
  const [input, setInput] = useState("");

  // Update initial message when language changes if user hasn't chatted yet
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length <= 1) {
        return [{ id: "init", from: "bot", text: dict.botGreeting }];
      }
      return prev;
    });
  }, [language, dict.botGreeting]);

  const handleAsk = (questionText: string, directAnswer?: string) => {
    const trimmed = questionText.trim();
    if (!trimmed) return;

    let botReply = directAnswer;

    if (!botReply) {
      // Find matching quick question
      const match = quickQuestions.find(
        (item) => item.q.toLowerCase() === trimmed.toLowerCase()
      );

      if (match) {
        botReply = match.a;
      } else {
        const lower = trimmed.toLowerCase();
        if (lower.includes("pack") || lower.includes("kit") || lower.includes("bag") || lower.includes("सामान") || lower.includes("బ్యాగ్") || lower.includes("பை") || lower.includes("ব্যাগ") || lower.includes("बॅग") || lower.includes("બેગ") || lower.includes("ಬ್ಯಾಗ್") || lower.includes("ബാഗ്")) {
          botReply = dict.packAnswer;
        } else if (lower.includes("flood") || lower.includes("water") || lower.includes("बाढ़") || lower.includes("వరద") || lower.includes("வெள்ளம்") || lower.includes("বন্যা") || lower.includes("पूर") || lower.includes("પૂર") || lower.includes("ಪ್ರವಾಹ") || lower.includes("വെള്ളപ്പൊക്കം") || lower.includes("ਹੜ੍ਹ")) {
          botReply = dict.floodAnswer;
        } else if (lower.includes("cyclone") || lower.includes("storm") || lower.includes("wind") || lower.includes("तूफान") || lower.includes("चक्रवात") || lower.includes("తుఫాను") || lower.includes("புயல்") || lower.includes("ঘূর্ণিঝড়") || lower.includes("चक्रीवादळ") || lower.includes("વાવાઝોડું") || lower.includes("ಚಂಡಮಾರುತ") || lower.includes("ചുഴലിക്കാറ്റ്") || lower.includes("ਤੂਫ਼ਾਨ")) {
          botReply = dict.cycloneAnswer;
        } else if (lower.includes("quake") || lower.includes("earth") || lower.includes("भूकंप") || lower.includes("భూకంపం") || lower.includes("நிலநடுக்கம்") || lower.includes("ভূমিকম্প") || lower.includes("ધરતીકંપ") || lower.includes("ഭൂകമ്പം") || lower.includes("ਭੂਚਾਲ")) {
          botReply = dict.quakeAnswer;
        } else if (lower.includes("route") || lower.includes("shelter") || lower.includes("मार्ग") || lower.includes("రాస్తా") || lower.includes("ఆశ్రయం") || lower.includes("சாலை") || lower.includes("পথ") || lower.includes("રસ્તો") || lower.includes("ರಸ್ತೆ") || lower.includes("റൂട്ട്") || lower.includes("ਰੂਟ")) {
          botReply = dict.routeAnswer;
        } else if (lower.includes("ping") || lower.includes("safe") || lower.includes("सुरक्षित") || lower.includes("క్షేమం") || lower.includes("பாதுகாப்பு") || lower.includes("নিরাপদ") || lower.includes("ਸੁਰੱਖਿਅਤ")) {
          botReply = dict.pingAnswer;
        } else if (lower.includes("burn") || lower.includes("blood") || lower.includes("aid") || lower.includes("घाव") || lower.includes("प्राथमिक") || lower.includes("చికిత్స") || lower.includes("சிகிச்சை") || lower.includes("ਮੁੱਢਲੀ")) {
          botReply = dict.firstAidAnswer;
        } else if (lower.includes("call") || lower.includes("number") || lower.includes("112") || lower.includes("108") || lower.includes("नंबर") || lower.includes("నెంబర్") || lower.includes("எண்") || lower.includes("ਨੰਬਰ")) {
          botReply = dict.contactAnswer;
        } else {
          botReply = dict.fallbackAnswer;
        }
      }
    }

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, from: "user", text: trimmed },
      { id: `b-${Date.now() + 1}`, from: "bot", text: botReply },
    ]);
    setInput("");
  };

  return (
    <ScreenContainer className="px-4" edges={["top", "left", "right"]} activeTab="ask">
      <View style={styles.wrap}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.kicker, { color: colors.primary }]}>{t("aiAssistant")}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{t("askAgiesTitle")}</Text>
          <Text style={[styles.intro, { color: colors.muted }]}>{t("practicalAnswers")}</Text>
        </View>

        {/* Message Thread */}
        <ScrollView
          style={styles.messages}
          contentContainerStyle={styles.messageContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => {
            const isUser = message.from === "user";
            return (
              <View
                key={message.id}
                style={[
                  styles.bubble,
                  isUser
                    ? [styles.userBubble, { backgroundColor: colors.primary }]
                    : [styles.botBubble, { backgroundColor: colors.surface, borderColor: colors.border }],
                ]}
              >
                {!isUser && (
                  <View style={styles.botHeader}>
                    <IconSymbol name="sparkles" size={13} color={colors.primary} />
                    <Text style={[styles.botTag, { color: colors.primary }]}>AGIES AI</Text>
                  </View>
                )}
                <Text
                  style={[
                    styles.bubbleText,
                    { color: isUser ? "#ffffff" : colors.foreground },
                  ]}
                >
                  {message.text}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Quick Question Pills in Active Language */}
        <View style={styles.quickWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRow}
          >
            {quickQuestions.map((item, idx) => (
              <Pressable
                key={idx}
                onPress={() => handleAsk(item.q, item.a)}
                style={({ pressed }) => [
                  styles.quickPill,
                  {
                    borderColor: colors.border,
                    backgroundColor: pressed ? colors.border : colors.surface,
                  },
                ]}
              >
                <IconSymbol name="questionmark.circle.fill" size={12} color={colors.primary} />
                <Text style={[styles.quickText, { color: colors.foreground }]} numberOfLines={1}>
                  {item.q}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Input Bar */}
        <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleAsk(input)}
            returnKeyType="send"
            placeholder={t("askPlaceholder")}
            placeholderTextColor={colors.muted}
            style={[styles.input, { color: colors.foreground }]}
          />
          <Pressable
            onPress={() => handleAsk(input)}
            style={({ pressed }) => [
              styles.send,
              { backgroundColor: colors.primary, opacity: input.trim().length > 0 ? (pressed ? 0.8 : 1) : 0.4 },
            ]}
          >
            <IconSymbol name="paperplane.fill" size={16} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingTop: 12,
    paddingBottom: 10,
  },
  header: {
    marginBottom: 8,
  },
  kicker: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    marginTop: 2,
    letterSpacing: -0.5,
  },
  intro: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  messages: {
    flex: 1,
  },
  messageContent: {
    gap: 10,
    paddingVertical: 8,
  },
  bubble: {
    maxWidth: "88%",
    padding: 13,
    borderRadius: 18,
  },
  userBubble: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  botBubble: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  botHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 5,
  },
  botTag: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "500",
  },
  quickWrapper: {
    paddingVertical: 6,
  },
  quickRow: {
    gap: 8,
    paddingHorizontal: 2,
  },
  quickPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickText: {
    fontSize: 11,
    fontWeight: "700",
    maxWidth: 240,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 8,
  },
  send: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
