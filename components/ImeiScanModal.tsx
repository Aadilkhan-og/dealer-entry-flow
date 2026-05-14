import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
  onScanned: (imei: string) => void;
}

type Tab = "scan" | "manual";

export function ImeiScanModal({ visible, onClose, onScanned }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("scan");
  const [manualImei, setManualImei] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  function handleBarcode({ data }: { type: string; data: string }) {
    if (scanned) return;
    const digits = data.replace(/\D/g, "");
    if (digits.length >= 14 && digits.length <= 16) {
      setScanned(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onScanned(digits.slice(0, 15));
      onClose();
    }
  }

  function handleManualSubmit() {
    const digits = manualImei.replace(/\D/g, "");
    if (digits.length !== 15) {
      setManualError("IMEI must be exactly 15 digits.");
      return;
    }
    setManualError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onScanned(digits);
    onClose();
  }

  function handleClose() {
    setScanned(false);
    setManualImei("");
    setManualError(null);
    onClose();
  }

  const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "#000" },
    header: {
      position: "absolute",
      top: insets.top + (Platform.OS === "web" ? 67 : 0),
      left: 0,
      right: 0,
      zIndex: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerTitle: { color: "#fff", fontSize: 17, fontWeight: "600" },
    closeBtn: {
      backgroundColor: "rgba(255,255,255,0.18)",
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    closeText: { color: "#fff", fontSize: 14, fontWeight: "600" },
    camera: { flex: 1 },
    frame: {
      position: "absolute",
      top: "40%",
      left: 24,
      right: 24,
      height: 80,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    hintText: {
      position: "absolute",
      bottom: "30%",
      left: 0,
      right: 0,
      textAlign: "center",
      color: "#fff",
      fontSize: 13,
      opacity: 0.85,
    },
    tabs: {
      position: "absolute",
      bottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 20,
      left: 20,
      right: 20,
      flexDirection: "row",
      backgroundColor: "rgba(0,0,0,0.6)",
      borderRadius: 10,
      padding: 4,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: "center",
    },
    tabActive: { backgroundColor: colors.primary },
    tabText: { color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: "600" },
    tabTextActive: { color: "#fff" },
    manualPanel: {
      flex: 1,
      backgroundColor: "#111928",
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 60,
      paddingHorizontal: 24,
    },
    manualLabel: {
      color: "#9CA3AF",
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      marginBottom: 8,
    },
    manualInput: {
      backgroundColor: "#1F2937",
      color: "#fff",
      fontSize: 22,
      letterSpacing: 2,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1.5,
      borderColor: colors.border,
      marginBottom: 8,
    },
    manualError: { color: "#EF4444", fontSize: 13, marginBottom: 12 },
    submitBtn: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 8,
    },
    submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    permContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#111928",
      padding: 32,
    },
    permText: {
      color: "#fff",
      fontSize: 16,
      textAlign: "center",
      marginBottom: 20,
      lineHeight: 24,
    },
    permBtn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: 28,
      paddingVertical: 14,
    },
    permBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      {activeTab === "manual" ? (
        <View style={s.manualPanel}>
          <View style={s.header}>
            <Text style={s.headerTitle}>Enter IMEI</Text>
            <Pressable style={s.closeBtn} onPress={handleClose}>
              <Text style={s.closeText}>Cancel</Text>
            </Pressable>
          </View>
          <Text style={s.manualLabel}>IMEI Number (15 digits)</Text>
          <TextInput
            style={s.manualInput}
            value={manualImei}
            onChangeText={(t) => {
              setManualImei(t.replace(/\D/g, "").slice(0, 15));
              setManualError(null);
            }}
            keyboardType="number-pad"
            placeholder="000000000000000"
            placeholderTextColor="#4B5563"
            maxLength={15}
            autoFocus
          />
          {manualError && <Text style={s.manualError}>{manualError}</Text>}
          <Pressable style={s.submitBtn} onPress={handleManualSubmit}>
            <Text style={s.submitText}>Confirm IMEI</Text>
          </Pressable>
          <View style={[s.tabs, { bottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 20 }]}>
            <Pressable style={s.tab} onPress={() => setActiveTab("scan")}>
              <Text style={s.tabText}>Scan Barcode</Text>
            </Pressable>
            <Pressable style={[s.tab, s.tabActive]}>
              <Text style={s.tabTextActive}>Manual Entry</Text>
            </Pressable>
          </View>
        </View>
      ) : !permission ? (
        <View style={s.permContainer}>
          <ActivityIndicator color="#fff" size="large" />
        </View>
      ) : !permission.granted ? (
        <View style={s.permContainer}>
          <Text style={s.permText}>
            Camera permission is required to scan the IMEI barcode.
          </Text>
          {permission.canAskAgain ? (
            <Pressable style={s.permBtn} onPress={requestPermission}>
              <Text style={s.permBtnText}>Allow Camera</Text>
            </Pressable>
          ) : (
            <Text style={[s.permText, { opacity: 0.7 }]}>
              Please enable camera in device Settings.
            </Text>
          )}
        </View>
      ) : (
        <View style={s.overlay}>
          <CameraView
            style={s.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: [
                "code128",
                "code39",
                "ean13",
                "ean8",
                "upc_a",
                "qr",
                "datamatrix",
              ],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarcode}
          />
          <View style={s.header}>
            <Text style={s.headerTitle}>Scan IMEI Barcode</Text>
            <Pressable style={s.closeBtn} onPress={handleClose}>
              <Text style={s.closeText}>Cancel</Text>
            </Pressable>
          </View>
          <View style={s.frame} />
          <Text style={s.hintText}>Point at the IMEI barcode on the device</Text>
          <View style={s.tabs}>
            <Pressable style={[s.tab, s.tabActive]}>
              <Text style={s.tabTextActive}>Scan Barcode</Text>
            </Pressable>
            <Pressable style={s.tab} onPress={() => setActiveTab("manual")}>
              <Text style={s.tabText}>Manual Entry</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Modal>
  );
}
