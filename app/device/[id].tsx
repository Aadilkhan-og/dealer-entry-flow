import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import {
  deletePurchaseRecord,
  getPurchaseRecord,
  PurchaseRecordRow,
  updatePurchaseRecord,
} from "@/services/databaseService";

export default function DeviceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [record, setRecord] = useState<PurchaseRecordRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Editable fields
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [imei, setImei] = useState("");

  useEffect(() => {
    loadRecord();
  }, [id]);

  async function loadRecord() {
    try {
      setLoading(true);
      const data = await getPurchaseRecord(id);
      setRecord(data);
      setCustomerName(data.customer_name);
      setPhoneNumber(data.phone_number);
      setAadhaarNumber(data.aadhaar_number);
      setImei(data.imei);
    } catch (e) {
      Alert.alert("Error", "Failed to load record");
      router.back();
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      await updatePurchaseRecord(id, {
        customer_name: customerName,
        phone_number: phoneNumber,
        aadhaar_number: aadhaarNumber,
        imei,
      });
      setRecord((prev) =>
        prev
          ? { ...prev, customer_name: customerName, phone_number: phoneNumber, aadhaar_number: aadhaarNumber, imei }
          : prev
      );
      setEditing(false);
    } catch (e) {
      Alert.alert("Error", "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      "Delete Record",
      `Are you sure you want to delete ${record?.customer_name}'s record? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await deletePurchaseRecord(id);
              router.back();
            } catch (e) {
              Alert.alert("Error", "Failed to delete record");
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  const shadow = Platform.select({
    ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12 },
    android: { elevation: 4 },
    default: {},
  });

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 8, paddingBottom: 24, paddingHorizontal: 20 }}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable onPress={() => router.back()} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </Pressable>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>Device Details</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {!editing && (
              <Pressable onPress={() => setEditing(true)} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
                <Feather name="edit-2" size={18} color="#fff" />
              </Pressable>
            )}
            <Pressable onPress={handleDelete} disabled={deleting} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(220,38,38,0.3)", alignItems: "center", justifyContent: "center" }}>
              {deleting ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="trash-2" size={18} color="#fff" />}
            </Pressable>
          </View>
        </Animated.View>

        {/* Avatar */}
        <Animated.View entering={ZoomIn.delay(200).duration(400)} style={{ alignItems: "center", marginTop: 20 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
            <Text style={{ fontSize: 28, fontWeight: "800", color: "#fff" }}>
              {(record?.customer_name?.[0] ?? "?").toUpperCase()}
            </Text>
          </View>
          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>{record?.customer_name}</Text>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 2 }}>
            {new Date(record!.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </Text>
        </Animated.View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {/* Fields */}
        {[
          { label: "Customer Name", icon: "user", value: customerName, setter: setCustomerName, key: "name" },
          { label: "Phone Number", icon: "smartphone", value: phoneNumber, setter: setPhoneNumber, key: "phone" },
          { label: "Aadhaar Number", icon: "credit-card", value: aadhaarNumber, setter: setAadhaarNumber, key: "aadhaar" },
          { label: "IMEI", icon: "hash", value: imei, setter: setImei, key: "imei" },
        ].map(({ label, icon, value, setter, key }, idx) => (
          <Animated.View key={key} entering={FadeInDown.delay(idx * 80).duration(400)}>
            <View style={[{ backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.border }, shadow]}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: editing ? 10 : 4 }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                  <Feather name={icon as any} size={16} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.mutedForeground, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</Text>
              </View>
              {editing ? (
                <TextInput
                  value={value}
                  onChangeText={setter}
                  style={{ fontSize: 15, color: colors.foreground, borderBottomWidth: 1.5, borderBottomColor: colors.primary, paddingVertical: 4, paddingLeft: 2 }}
                  placeholderTextColor={colors.mutedForeground}
                />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginLeft: 42 }}>{value || "—"}</Text>
              )}
            </View>
          </Animated.View>
        ))}

        {/* Links */}
        {!editing && (
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={{ gap: 12 }}>
            {record?.image_url ? (
              <View style={[{ backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center" }, shadow]}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                  <Feather name="image" size={16} color={colors.primary} />
                </View>
                <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: colors.foreground }}>Phone Image</Text>
                <Feather name="check-circle" size={18} color={colors.success} />
              </View>
            ) : null}
            {record?.receipt_url ? (
              <View style={[{ backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center" }, shadow]}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                  <Feather name="file-text" size={16} color={colors.primary} />
                </View>
                <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: colors.foreground }}>Receipt PDF</Text>
                <Feather name="check-circle" size={18} color={colors.success} />
              </View>
            ) : null}
          </Animated.View>
        )}

        {/* Save / Cancel buttons when editing */}
        {editing && (
          <Animated.View entering={FadeInUp.duration(300)} style={{ flexDirection: "row", gap: 12, marginTop: 10 }}>
            <Pressable onPress={() => setEditing(false)} style={{ flex: 1, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, alignItems: "center" }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.mutedForeground }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSave} disabled={saving} style={{ flex: 2, overflow: "hidden", borderRadius: 14 }}>
              <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ padding: 16, alignItems: "center" }}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Save Changes</Text>}
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
