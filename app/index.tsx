import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AadhaarScanModal } from "@/components/AadhaarScanModal";
import { ImeiScanModal } from "@/components/ImeiScanModal";
import { ReceiptModal } from "@/components/ReceiptModal";
import { useColors } from "@/hooks/useColors";
import { ensureAnonymousSession } from "@/lib/supabase";
import { savePurchaseRecord } from "@/services/databaseService";
import { generateReceiptPDF } from "@/services/pdfService";
import { uploadPhoneImage, uploadReceiptPDF } from "@/services/uploadService";
import { useDealerStore } from "@/store/useDealerStore";

function AnimatedButton({
  onPress,
  disabled,
  children,
  style,
}: {
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  style?: object | object[];
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Pressable
      onPressIn={() => {
        if (!disabled) scale.value = withSpring(0.96, { damping: 15 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15 });
      }}
      onPress={onPress}
      disabled={disabled}
    >
      <Animated.View style={[style, animStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = useColorScheme() === "dark";

  const {
    customerName, setCustomerName,
    phoneNumber, setPhoneNumber,
    aadhaarNumber, setAadhaarNumber,
    imei, setImei,
    phoneImageUri, setPhoneImageUri,
    receiptPdfUri, setReceiptPdfUri,
    setSavedRecordId,
    isSubmitting, setIsSubmitting,
    error, setError,
    showReceipt, setShowReceipt,
    reset,
  } = useDealerStore();

  const [aadhaarModalVisible, setAadhaarModalVisible] = useState(false);
  const [imeiModalVisible, setImeiModalVisible] = useState(false);
  const [timestamp, setTimestamp] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    ensureAnonymousSession().catch(() => {});
  }, []);

  async function handlePickImage() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      setError("Camera permission denied. Enable it in device Settings.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setPhoneImageUri(result.assets[0].uri);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  async function handleSubmit() {
    if (!customerName.trim()) { setError("Customer name is required."); return; }
    if (!phoneNumber.trim()) { setError("Phone number is required."); return; }
    if (!imei.trim()) { setError("IMEI number is required."); return; }
    if (!phoneImageUri) { setError("Phone photo is required."); return; }

    setError(null);
    setIsSubmitting(true);

    try {
      const recordId =
        Date.now().toString() + Math.random().toString(36).slice(2, 8);
      const ts = new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      setTimestamp(ts);

      const [imageUrl, pdfUri] = await Promise.all([
        uploadPhoneImage(phoneImageUri, recordId),
        generateReceiptPDF({
          customerName, phoneNumber, aadhaarNumber, imei, phoneImageUri, timestamp: ts,
        }),
      ]);

      const receiptUrl = await uploadReceiptPDF(pdfUri, recordId);
      const dbId = await savePurchaseRecord({
        customer_name: customerName,
        phone_number: phoneNumber,
        aadhaar_number: aadhaarNumber,
        imei,
        image_url: imageUrl,
        receipt_url: receiptUrl,
      });

      setReceiptPdfUri(pdfUri);
      setSavedRecordId(dbId);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowReceipt(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleNewRecord() {
    reset();
    setShowReceipt(false);
  }

  const canSubmit =
    !!customerName.trim() && !!phoneNumber.trim() && !!imei.trim() && !!phoneImageUri && !isSubmitting;

  const cardShadow = Platform.select({
    ios: {
      shadowColor: isDark ? "#000" : "#4F46E5",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.07,
      shadowRadius: 12,
    },
    android: { elevation: isDark ? 4 : 2 },
    default: {},
  });

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
      paddingBottom: 22,
      paddingHorizontal: 20,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerBrand: {
      fontSize: 24,
      fontWeight: "800",
      color: "#fff",
      letterSpacing: -0.5,
    },
    headerSub: {
      fontSize: 12,
      color: "rgba(255,255,255,0.65)",
      marginTop: 3,
    },
    historyBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(255,255,255,0.15)",
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
    },
    historyBtnText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "600",
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 110,
      gap: 12,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius + 2,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      ...cardShadow,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 16,
    },
    cardDot: {
      width: 4,
      height: 20,
      borderRadius: 2,
      backgroundColor: colors.primary,
    },
    cardTitle: {
      fontSize: 11,
      fontWeight: "800",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.mutedForeground,
      marginBottom: 7,
      marginTop: 2,
    },
    input: {
      backgroundColor: colors.muted,
      borderRadius: colors.radius,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
      color: colors.foreground,
      borderWidth: 1.5,
      borderColor: colors.input,
    },
    inputFocused: {
      borderColor: colors.primary,
      backgroundColor: colors.card,
    },
    gap: { height: 10 },
    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: colors.radius,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    actionBtnDefault: {
      backgroundColor: colors.primaryLight,
      borderWidth: 1.5,
      borderColor: isDark ? colors.border : "#C7D2FE",
    },
    actionBtnFilled: {
      backgroundColor: colors.successLight,
      borderWidth: 1.5,
      borderColor: isDark ? colors.success + "44" : "#6EE7B7",
    },
    actionBtnText: {
      fontSize: 14,
      fontWeight: "700",
      flex: 1,
    },
    actionBtnTextDefault: { color: colors.primary },
    actionBtnTextFilled: { color: colors.successForeground },
    scannedBox: {
      backgroundColor: colors.muted,
      borderRadius: colors.radius,
      padding: 12,
      marginTop: 10,
      gap: 6,
    },
    scannedItem: {},
    scannedLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    scannedValue: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.foreground,
      marginTop: 1,
    },
    dividerH: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
    capturedImage: {
      width: "100%",
      height: 170,
      borderRadius: colors.radius,
      marginTop: 12,
      backgroundColor: colors.muted,
    },
    retakeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 8,
      alignSelf: "flex-start",
    },
    retakeText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: "600",
    },
    errorBanner: {
      backgroundColor: isDark ? "#2D1515" : "#FEF2F2",
      borderRadius: colors.radius,
      padding: 14,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      borderWidth: 1,
      borderColor: isDark ? "#4B1515" : "#FECACA",
    },
    errorText: {
      flex: 1,
      color: isDark ? "#FCA5A5" : "#991B1B",
      fontSize: 13,
      lineHeight: 19,
    },
    submitBtn: {
      borderRadius: colors.radius + 2,
      paddingVertical: 18,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      overflow: "hidden",
    },
    submitBtnDisabled: {
      backgroundColor: colors.muted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    submitText: {
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 0.2,
    },
    submitTextActive: { color: "#fff" },
    submitTextDisabled: { color: colors.mutedForeground },
  });

  return (
    <View style={s.container}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.header}
      >
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerBrand}>DealerFlow</Text>
            <Text style={s.headerSub}>Used Phone Purchase Entry</Text>
          </View>
          <AnimatedButton onPress={() => router.push("/history" as never)} style={s.historyBtn}>
            <Feather name="list" size={15} color="#fff" />
            <Text style={s.historyBtnText}>History</Text>
          </AnimatedButton>
        </View>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Customer Details */}
        <Animated.View entering={FadeInDown.delay(0).springify().damping(16)}>
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.cardDot} />
              <Text style={s.cardTitle}>Customer Details</Text>
            </View>

            <Text style={s.fieldLabel}>Full Name *</Text>
            <TextInput
              style={[s.input, focusedField === "name" && s.inputFocused]}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Enter customer name"
              placeholderTextColor={colors.mutedForeground}
              onFocus={() => setFocusedField("name")}
              onBlur={() => setFocusedField(null)}
              returnKeyType="next"
              autoCapitalize="words"
            />

            <View style={s.gap} />

            <Text style={s.fieldLabel}>Phone Number *</Text>
            <TextInput
              style={[s.input, focusedField === "phone" && s.inputFocused]}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="+91 98765 43210"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
              onFocus={() => setFocusedField("phone")}
              onBlur={() => setFocusedField(null)}
              returnKeyType="done"
            />
          </View>
        </Animated.View>

        {/* Aadhaar Card */}
        <Animated.View entering={FadeInDown.delay(80).springify().damping(16)}>
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={[s.cardDot, { backgroundColor: "#7C3AED" }]} />
              <Text style={s.cardTitle}>Aadhaar Card</Text>
            </View>

            <AnimatedButton
              onPress={() => setAadhaarModalVisible(true)}
              style={[s.actionBtn, aadhaarNumber ? s.actionBtnFilled : s.actionBtnDefault]}
            >
              <Feather
                name={aadhaarNumber ? "check-circle" : "credit-card"}
                size={18}
                color={aadhaarNumber ? colors.success : colors.primary}
              />
              <Text
                style={[
                  s.actionBtnText,
                  aadhaarNumber ? s.actionBtnTextFilled : s.actionBtnTextDefault,
                ]}
              >
                {aadhaarNumber ? "Aadhaar Scanned ✓" : "Scan Aadhaar Card"}
              </Text>
              {aadhaarNumber && (
                <Feather name="refresh-cw" size={15} color={colors.success} />
              )}
            </AnimatedButton>

            {aadhaarNumber ? (
              <View style={s.scannedBox}>
                {customerName ? (
                  <>
                    <View style={s.scannedItem}>
                      <Text style={s.scannedLabel}>OCR Name</Text>
                      <Text style={s.scannedValue}>{customerName}</Text>
                    </View>
                    <View style={s.dividerH} />
                  </>
                ) : null}
                <View style={s.scannedItem}>
                  <Text style={s.scannedLabel}>Aadhaar Number</Text>
                  <Text style={s.scannedValue}>{aadhaarNumber}</Text>
                </View>
              </View>
            ) : null}

            <Text style={[s.fieldLabel, { marginTop: 12 }]}>Manual entry</Text>
            <TextInput
              style={[s.input, focusedField === "aadhaar" && s.inputFocused]}
              value={aadhaarNumber}
              onChangeText={setAadhaarNumber}
              placeholder="XXXX XXXX XXXX"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              maxLength={14}
              onFocus={() => setFocusedField("aadhaar")}
              onBlur={() => setFocusedField(null)}
            />
          </View>
        </Animated.View>

        {/* IMEI */}
        <Animated.View entering={FadeInDown.delay(160).springify().damping(16)}>
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={[s.cardDot, { backgroundColor: "#0EA5E9" }]} />
              <Text style={s.cardTitle}>IMEI Number *</Text>
            </View>

            <AnimatedButton
              onPress={() => setImeiModalVisible(true)}
              style={[s.actionBtn, imei ? s.actionBtnFilled : s.actionBtnDefault]}
            >
              <Feather
                name={imei ? "check-circle" : "maximize"}
                size={18}
                color={imei ? colors.success : colors.primary}
              />
              <Text
                style={[
                  s.actionBtnText,
                  imei ? s.actionBtnTextFilled : s.actionBtnTextDefault,
                ]}
              >
                {imei ? "IMEI Scanned ✓" : "Scan IMEI Barcode"}
              </Text>
              {imei && <Feather name="refresh-cw" size={15} color={colors.success} />}
            </AnimatedButton>

            {imei ? (
              <View style={s.scannedBox}>
                <Text style={s.scannedLabel}>IMEI</Text>
                <Text style={s.scannedValue}>{imei}</Text>
              </View>
            ) : null}

            <Text style={[s.fieldLabel, { marginTop: 12 }]}>Manual entry</Text>
            <TextInput
              style={[s.input, focusedField === "imei" && s.inputFocused]}
              value={imei}
              onChangeText={(t) => setImei(t.replace(/\D/g, "").slice(0, 15))}
              placeholder="15-digit IMEI number"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              maxLength={15}
              onFocus={() => setFocusedField("imei")}
              onBlur={() => setFocusedField(null)}
            />
          </View>
        </Animated.View>

        {/* Phone Image */}
        <Animated.View entering={FadeInDown.delay(240).springify().damping(16)}>
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={[s.cardDot, { backgroundColor: "#F59E0B" }]} />
              <Text style={s.cardTitle}>Device Photo *</Text>
            </View>

            <AnimatedButton
              onPress={handlePickImage}
              style={[s.actionBtn, phoneImageUri ? s.actionBtnFilled : s.actionBtnDefault]}
            >
              <Feather
                name={phoneImageUri ? "check-circle" : "camera"}
                size={18}
                color={phoneImageUri ? colors.success : colors.primary}
              />
              <Text
                style={[
                  s.actionBtnText,
                  phoneImageUri ? s.actionBtnTextFilled : s.actionBtnTextDefault,
                ]}
              >
                {phoneImageUri ? "Photo Captured ✓" : "Capture Device Photo"}
              </Text>
            </AnimatedButton>

            {phoneImageUri && (
              <>
                <Image
                  source={{ uri: phoneImageUri }}
                  style={s.capturedImage}
                  resizeMode="cover"
                />
                <Pressable style={s.retakeRow} onPress={handlePickImage}>
                  <Feather name="refresh-cw" size={13} color={colors.primary} />
                  <Text style={s.retakeText}>Retake</Text>
                </Pressable>
              </>
            )}
          </View>
        </Animated.View>

        {/* Error */}
        {error && (
          <Animated.View entering={FadeInDown.springify()}>
            <View style={s.errorBanner}>
              <Feather name="alert-circle" size={16} color={isDark ? "#FCA5A5" : "#991B1B"} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          </Animated.View>
        )}

        {/* Submit */}
        <Animated.View entering={FadeInDown.delay(320).springify().damping(16)}>
          {canSubmit ? (
            <AnimatedButton
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={s.submitBtn}
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  s.submitBtn,
                  { width: "100%", margin: 0 },
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Feather name="save" size={18} color="#fff" />
                )}
                <Text style={[s.submitText, s.submitTextActive]}>
                  {isSubmitting ? "Saving Record..." : "Save & Generate Receipt"}
                </Text>
              </LinearGradient>
            </AnimatedButton>
          ) : (
            <View style={[s.submitBtn, s.submitBtnDisabled]}>
              <Feather name="lock" size={16} color={colors.mutedForeground} />
              <Text style={[s.submitText, s.submitTextDisabled]}>
                Complete all fields to save
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <AadhaarScanModal
        visible={aadhaarModalVisible}
        onClose={() => setAadhaarModalVisible(false)}
        onScanned={(name, aadhaar) => {
          if (name && !customerName) setCustomerName(name);
          if (aadhaar) setAadhaarNumber(aadhaar);
        }}
      />

      <ImeiScanModal
        visible={imeiModalVisible}
        onClose={() => setImeiModalVisible(false)}
        onScanned={(scannedImei) => setImei(scannedImei)}
      />

      <ReceiptModal
        visible={showReceipt}
        onClose={() => setShowReceipt(false)}
        onNewRecord={handleNewRecord}
        customerName={customerName}
        phoneNumber={phoneNumber}
        aadhaarNumber={aadhaarNumber}
        imei={imei}
        phoneImageUri={phoneImageUri}
        receiptPdfUri={receiptPdfUri}
        timestamp={timestamp}
      />
    </View>
  );
}
