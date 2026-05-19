import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOutLeft,
  Layout,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import {
  deletePurchaseRecord,
  getPurchaseRecords,
  PurchaseRecordRow,
} from "@/services/databaseService";

function RecordCard({
  item,
  index,
  onPress,
  onDelete,
}: {
  item: PurchaseRecordRow;
  index: number;
  onPress: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();

  const cardShadow = Platform.select({
    ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 10 },
    android: { elevation: 3 },
    default: {},
  });

  const date = new Date(item.created_at).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const initials = item.customer_name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const s = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius + 2,
      marginHorizontal: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      ...cardShadow,
    },
    accent: {
      height: 3,
      backgroundColor: colors.primary,
    },
    body: { padding: 16 },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    name: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.foreground,
      flex: 1,
    },
    dateBadge: {
      backgroundColor: colors.primaryLight,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    dateText: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: "600",
    },
    row: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 6,
    },
    field: { flex: 1 },
    label: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    value: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.foreground,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 10,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    receiptBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: colors.successLight,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    receiptText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.successForeground,
    },
    noReceiptText: {
      fontSize: 11,
      color: colors.mutedForeground,
    },
  });

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify().damping(16)}
      exiting={FadeOutLeft.duration(300)}
      layout={Layout.springify()}
      style={{ marginHorizontal: 16, marginBottom: 12 }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{
          backgroundColor: colors.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
          opacity: pressed ? 0.92 : 1,
        }, cardShadow]}
      >
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 3 }} />
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>{initials}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }} numberOfLines={1}>{item.customer_name}</Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 1 }}>{date}</Text>
            </View>
            <Pressable onPress={onDelete} hitSlop={10} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(220,38,38,0.1)", alignItems: "center", justifyContent: "center" }}>
              <Feather name="trash-2" size={15} color={colors.destructive} />
            </Pressable>
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
            {[{ icon: "smartphone", label: "Phone", value: item.phone_number }, { icon: "hash", label: "IMEI", value: item.imei }].map(({ icon, label, value }) => (
              <View key={label} style={{ flex: 1, backgroundColor: colors.muted, borderRadius: 10, padding: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 }}>
                  <Feather name={icon as any} size={11} color={colors.mutedForeground} />
                  <Text style={{ fontSize: 10, fontWeight: "700", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground }} numberOfLines={1}>{value || "—"}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {item.receipt_url ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.successLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Feather name="check-circle" size={11} color={colors.success} />
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.successForeground }}>Receipt saved</Text>
              </View>
            ) : (
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>No receipt</Text>
            )}
            <View style={{ flex: 1 }} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "600" }}>View Details</Text>
              <Feather name="chevron-right" size={13} color={colors.primary} />
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function EmptyState({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <Animated.View
      entering={FadeInUp.delay(100).springify()}
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 80,
        paddingHorizontal: 40,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: colors.primaryLight,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Feather name="inbox" size={32} color={colors.primary} />
      </View>
      <Text
        style={{
          fontSize: 17,
          fontWeight: "700",
          color: colors.foreground,
          marginBottom: 6,
        }}
      >
        No records yet
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: colors.mutedForeground,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        Purchase records you save will appear here.
      </Text>
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = useColorScheme() === "dark";

  const [records, setRecords] = useState<PurchaseRecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const loadRecords = useCallback(async () => {
    try {
      const data = await getPurchaseRecords();
      setRecords(data);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load records.");
    }
  }, []);

  useEffect(() => {
    loadRecords().finally(() => setLoading(false));
  }, [loadRecords]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadRecords();
    setRefreshing(false);
  }

  function handleDelete(item: PurchaseRecordRow) {
    Alert.alert(
      "Delete Record",
      `Delete ${item.customer_name}'s record? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePurchaseRecord(item.id);
              setRecords((prev) => prev.filter((r) => r.id !== item.id));
            } catch {
              Alert.alert("Error", "Failed to delete record.");
            }
          },
        },
      ]
    );
 }

  const filtered = search.trim()
    ? records.filter(
        (r) =>
          r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
          r.phone_number.includes(search) ||
          r.imei.includes(search)
      )
    : records;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
      paddingBottom: 20,
      paddingHorizontal: 20,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(255,255,255,0.15)",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: "#fff",
      letterSpacing: -0.3,
      flex: 1,
    },
    countBadge: {
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    countText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "700",
    },
    searchWrap: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 6,
    },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      paddingHorizontal: 14,
      paddingVertical: 11,
      gap: 10,
      borderWidth: 1.5,
      borderColor: searchFocused ? colors.primary : colors.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.foreground,
      padding: 0,
    },
    errorBanner: {
      margin: 16,
      backgroundColor: isDark ? "#2D1515" : "#FEF2F2",
      borderRadius: colors.radius,
      padding: 14,
      flexDirection: "row",
      gap: 10,
      borderWidth: 1,
      borderColor: isDark ? "#4B1515" : "#FECACA",
    },
    errorText: {
      flex: 1,
      color: isDark ? "#FCA5A5" : "#991B1B",
      fontSize: 13,
    },
    listContent: {
      paddingTop: 6,
      paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 20,
    },
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
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={18} color="#fff" />
          </Pressable>
          <Text style={s.headerTitle}>Purchase History</Text>
          {!loading && (
            <View style={s.countBadge}>
              <Text style={s.countText}>{filtered.length}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Feather name="search" size={16} color={searchFocused ? colors.primary : colors.mutedForeground} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, phone or IMEI..."
            placeholderTextColor={colors.mutedForeground}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={s.errorBanner}>
          <Feather name="alert-circle" size={16} color={isDark ? "#FCA5A5" : "#991B1B"} />
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            s.listContent,
            filtered.length === 0 && { flex: 1 },
          ]}
          renderItem={({ item, index }) => (
            <RecordCard
              item={item}
              index={index}
              onPress={() => router.push(`/device/${item.id}` as any)}
              onDelete={() => handleDelete(item)}
            />
          )}
          ListEmptyComponent={<EmptyState colors={colors} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
