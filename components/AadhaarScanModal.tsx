import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { extractAadhaarInfo } from "@/services/ocrService";

interface Props {
  visible: boolean;
  onClose: () => void;
  onScanned: (name: string, aadhaarNumber: string) => void;
}

export function AadhaarScanModal({ visible, onClose, onScanned }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  async function handleCapture() {
    if (!cameraRef.current || processing) return;
    setErrorMsg(null);
    setProcessing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });
      if (!photo?.base64) throw new Error("Camera failed to capture image.");
      const result = await extractAadhaarInfo(photo.base64);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onScanned(result.name, result.aadhaarNumber);
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "OCR failed. Try again.";
      setErrorMsg(msg);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setProcessing(false);
    }
  }

  const s = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "#000",
    },
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
    headerTitle: {
      color: "#fff",
      fontSize: 17,
      fontWeight: "600",
    },
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
      top: "30%",
      left: 24,
      right: 24,
      height: 180,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.primary,
      backgroundColor: "transparent",
    },
    hintText: {
      position: "absolute",
      bottom: "28%",
      left: 0,
      right: 0,
      textAlign: "center",
      color: "#fff",
      fontSize: 13,
      opacity: 0.85,
    },
    errorBanner: {
      position: "absolute",
      bottom: "22%",
      left: 20,
      right: 20,
      backgroundColor: "#DC2626",
      borderRadius: 8,
      padding: 10,
    },
    errorText: { color: "#fff", fontSize: 13, textAlign: "center" },
    captureRow: {
      position: "absolute",
      bottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 24,
      left: 0,
      right: 0,
      alignItems: "center",
    },
    captureBtn: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 4,
      borderColor: "rgba(255,255,255,0.5)",
    },
    captureBtnDisabled: { opacity: 0.5 },
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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {!permission ? (
        <View style={s.permContainer}>
          <ActivityIndicator color="#fff" size="large" />
        </View>
      ) : !permission.granted ? (
        <View style={s.permContainer}>
          <Text style={s.permText}>
            Camera permission is required to scan the Aadhaar card.
          </Text>
          {permission.canAskAgain ? (
            <Pressable style={s.permBtn} onPress={requestPermission}>
              <Text style={s.permBtnText}>Allow Camera</Text>
            </Pressable>
          ) : (
            <Text style={[s.permText, { opacity: 0.7 }]}>
              Please enable camera access in device Settings.
            </Text>
          )}
        </View>
      ) : (
        <View style={s.overlay}>
          <CameraView ref={cameraRef} style={s.camera} facing="back" />
          <View style={s.header}>
            <Text style={s.headerTitle}>Scan Aadhaar Card</Text>
            <Pressable style={s.closeBtn} onPress={onClose}>
              <Text style={s.closeText}>Cancel</Text>
            </Pressable>
          </View>
          <View style={s.frame} />
          <Text style={s.hintText}>
            Align the Aadhaar card within the frame
          </Text>
          {errorMsg && (
            <View style={s.errorBanner}>
              <Text style={s.errorText}>{errorMsg}</Text>
            </View>
          )}
          <View style={s.captureRow}>
            <Pressable
              style={[s.captureBtn, processing && s.captureBtnDisabled]}
              onPress={handleCapture}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: "#fff",
                  }}
                />
              )}
            </Pressable>
          </View>
        </View>
      )}
    </Modal>
  );
}
