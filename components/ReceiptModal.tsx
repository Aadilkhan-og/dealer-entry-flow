import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
  onNewRecord: () => void;
  customerName: string;
  phoneNumber: string;
  aadhaarNumber: string;
  imei: string;
  phoneImageUri: string | null;
  receiptPdfUri: string | null;
  timestamp: string;
}

export function ReceiptModal({
  visible,
  onClose,
  onNewRecord,
  customerName,
  phoneNumber,
  aadhaarNumber,
  imei,
  phoneImageUri,
  receiptPdfUri,
  timestamp,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === "dark";
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    if (!receiptPdfUri) return;
    if (Platform.OS === "web") {
      alert("Sharing is only available on mobile devices.");
      return;
    }
    try {
      setSharing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        alert("Sharing is not available on this device.");
        return;
      }
      await Sharing.shareAsync(receiptPdfUri, {
        mimeType: "application/pdf",
        dialogTitle: `Receipt — ${customerName}`,
        UTI: "com.adobe.pdf",
      });
    } catch (e) {
      console.error("Share error:", e);
    } finally {
      setSharing(false);
    }
  }

  const s = StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0),
      maxHeight: "94%",
      overflow: "hidden",
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginTop: 12,
      marginBottom: 0,
    },
    successHeader: {
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 18,
      alignItems: "center",
    },
    checkRing: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.successLight,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    successTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.foreground,
      letterSpacing: -0.3,
    },
    successSub: {
      fontSize: 13,
      color: colors.mutedForeground,
      textAlign: "center",
      marginTop: 4,
      lineHeight: 19,
    },
    scroll: { paddingHorizontal: 16 },
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius + 2,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    cardAccent: { height: 3, backgroundColor: colors.primary },
    cardBody: { padding: 16 },
    row: {
      flexDirection: "row",
      gap: 16,
      marginBottom: 12,
    },
    rowLast: {
      flexDirection: "row",
      gap: 16,
    },
    field: { flex: 1 },
    label: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 3,
    },
    value: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.foreground,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 10,
    },
    phoneImage: {
      width: "100%",
      height: 170,
      borderRadius: 10,
      marginTop: 10,
      backgroundColor: colors.muted,
    },
    actions: {
      paddingHorizontal: 16,
      paddingTop: 6,
      gap: 10,
    },
    shareBtn: {
      borderRadius: colors.radius + 2,
      overflow: "hidden",
    },
    shareBtnInner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 17,
      paddingHorizontal: 20,
    },
    shareBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
    newBtn: {
      backgroundColor: colors.secondary,
      borderRadius: colors.radius + 2,
      paddingVertical: 15,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    newBtnText: {
      color: colors.secondaryForeground,
      fontSize: 15,
      fontWeight: "700",
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Animated.View entering={FadeIn.duration(200)} style={s.backdrop}>
        <Animated.View
          entering={FadeInUp.springify().damping(20)}
          style={s.sheet}
        >
          <View style={s.handle} />

          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={s.successHeader}
          >
            <View style={s.checkRing}>
              <Feather name="check" size={30} color={colors.success} />
            </View>
            <Text style={s.successTitle}>Record Saved!</Text>
            <Text style={s.successSub}>
              Purchase saved successfully.{"\n"}Share the receipt below.
            </Text>
          </Animated.View>

          <ScrollView
            style={s.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View entering={FadeInDown.delay(150).springify()}>
              <View style={s.card}>
                <View style={s.cardAccent} />
                <View style={s.cardBody}>
                  <View style={s.row}>
                    <View style={s.field}>
                      <Text style={s.label}>Customer</Text>
                      <Text style={s.value}>{customerName}</Text>
                    </View>
                    <View style={s.field}>
                      <Text style={s.label}>Phone</Text>
                      <Text style={s.value}>{phoneNumber}</Text>
                    </View>
                  </View>
                  <View style={s.divider} />
                  <View style={s.row}>
                    <View style={s.field}>
                      <Text style={s.label}>Aadhaar</Text>
                      <Text style={s.value}>{aadhaarNumber || "—"}</Text>
                    </View>
                  </View>
                  <View style={s.rowLast}>
                    <View style={s.field}>
                      <Text style={s.label}>IMEI</Text>
                      <Text style={s.value}>{imei}</Text>
                    </View>
                    <View style={s.field}>
                      <Text style={s.label}>Date</Text>
                      <Text style={[s.value, { fontSize: 12 }]}>{timestamp}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>

            {phoneImageUri && (
              <Animated.View
                entering={FadeInDown.delay(200).springify()}
              >
                <View style={s.card}>
                  <View style={[s.cardAccent, { backgroundColor: "#F59E0B" }]} />
                  <View style={s.cardBody}>
                    <Text style={s.label}>Device Photo</Text>
                    <Image
                      source={{ uri: phoneImageUri }}
                      style={s.phoneImage}
                      resizeMode="cover"
                    />
                  </View>
                </View>
              </Animated.View>
            )}

            <View style={{ height: 8 }} />
          </ScrollView>

          <Animated.View
            entering={FadeInDown.delay(250).springify()}
            style={s.actions}
          >
            <Pressable
              style={[s.shareBtn, (sharing || !receiptPdfUri) && { opacity: 0.7 }]}
              onPress={handleShare}
              disabled={sharing || !receiptPdfUri}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.shareBtnInner}
              >
                {sharing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Feather name="share-2" size={18} color="#fff" />
                )}
                <Text style={s.shareBtnText}>
                  {sharing ? "Preparing..." : "Share via WhatsApp / Email"}
                </Text>
              </LinearGradient>
            </Pressable>
            <Pressable style={s.newBtn} onPress={onNewRecord}>
              <Text style={s.newBtnText}>+ New Record</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
