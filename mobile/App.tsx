import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type DimensionValue,
} from "react-native";

import mobileData from "./src/data/patterns.json";

type PatternType = "house" | "sport" | "challenge" | "pba" | "custom";

type Zone = {
  board_start: number;
  board_end: number;
  distance_start_ft: number;
  distance_end_ft: number;
  oil_level: number;
  note: string;
};

type Pattern = {
  slug: string;
  name: string;
  organization: string | null;
  pattern_type: PatternType;
  length_ft: number;
  volume_ml: number | null;
  ratio: string | null;
  difficulty: number;
  summary: string;
  play_strategy: string;
  ball_motion: string;
  suggested_line_right: string;
  suggested_line_left: string;
  recommended_equipment: string;
  common_adjustments: string;
  source_note: string;
  tags: string[];
  zones: Zone[];
  lane_intelligence: null | {
    oil_shape: string;
    volume_class: string;
    friction_expectation: string;
    scoring_pace: string;
    target_window_right: string;
    target_window_left: string;
    breakpoint_window: string;
    miss_risk: string;
    first_move_trigger: string;
    surface_guidance: string;
    practice_focus: string;
  };
  play_profile: null | {
    rule_of_31_board: number;
    breakpoint_range: string;
    ideal_axis_rotation: string;
    friction_response: string;
    speed_control: string;
    spare_priority: string;
  };
  transitions: {
    phase_name: string;
    frame_window: string;
    what_to_watch: string;
    move_strategy: string;
    ball_change: string;
  }[];
  equipment_options: {
    bowler_style: string;
    ball_type: string;
    surface: string;
    when_to_use: string;
  }[];
  external_refs: {
    source_name: string;
    pattern_page_url: string | null;
    pdf_url: string | null;
    download_url: string | null;
    kosi_url: string | null;
    search_url: string | null;
  }[];
};

type MobileData = {
  generated_at: string;
  patterns: Pattern[];
  pattern_types: { pattern_type: PatternType; label: string; pattern_count: number }[];
};

const data = mobileData as MobileData;
const logo = require("./assets/strikeiq-logo-lockup.png");

function typeLabel(type: PatternType) {
  return data.pattern_types.find((item) => item.pattern_type === type)?.label ?? type;
}

function difficultyLabel(value: number) {
  if (value <= 2) return "forgiving";
  if (value === 3) return "balanced";
  return "demanding";
}

function sourceUrl(pattern: Pattern) {
  const ref = pattern.external_refs.find(
    (item) => item.pattern_page_url || item.pdf_url || item.download_url || item.kosi_url || item.search_url,
  );
  return ref?.pattern_page_url ?? ref?.pdf_url ?? ref?.download_url ?? ref?.kosi_url ?? ref?.search_url ?? "";
}

function InfoRow({ label, value }: { label: string; value: string | number | null }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value ?? "Pending"}</Text>
    </View>
  );
}

function Chip({ label, selected = false, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function LaneVisual({ zones }: { zones: Zone[] }) {
  if (!zones.length) {
    return (
      <View style={styles.laneFallback}>
        <Text style={styles.laneFallbackTitle}>Graph pending</Text>
        <Text style={styles.laneFallbackText}>This catalog pattern needs source graph review before oil zones are shown.</Text>
      </View>
    );
  }

  return (
    <View style={styles.lane}>
      {zones.map((zone, index) => {
        const left = `${((zone.board_start - 1) / 40) * 100}%` as DimensionValue;
        const width = `${((zone.board_end - zone.board_start + 1) / 40) * 100}%` as DimensionValue;
        const top = `${(zone.distance_start_ft / 60) * 100}%` as DimensionValue;
        const height = `${Math.max(((zone.distance_end_ft - zone.distance_start_ft) / 60) * 100, 6)}%` as DimensionValue;
        const opacity = Math.max(0.18, Math.min(zone.oil_level / 100, 0.9));
        return (
          <View
            key={`${zone.board_start}-${zone.distance_start_ft}-${index}`}
            style={[
              styles.zone,
              {
                left,
                top,
                width,
                height,
                backgroundColor: `rgba(22, 118, 164, ${opacity})`,
              },
            ]}
          />
        );
      })}
      <View style={styles.breakpointLine} />
      <Text style={styles.laneLabel}>foul line</Text>
      <Text style={[styles.laneLabel, styles.pinDeckLabel]}>pins</Text>
    </View>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState<PatternType | "all">("all");
  const [selectedSlug, setSelectedSlug] = useState(data.patterns[0]?.slug ?? "");
  const [handedness, setHandedness] = useState<"right" | "left">("right");

  const filteredPatterns = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.patterns.filter((pattern) => {
      const matchesType = selectedType === "all" || pattern.pattern_type === selectedType;
      const matchesQuery =
        !normalized ||
        pattern.name.toLowerCase().includes(normalized) ||
        pattern.summary.toLowerCase().includes(normalized) ||
        pattern.tags.some((tag) => tag.toLowerCase().includes(normalized));
      return matchesType && matchesQuery;
    });
  }, [query, selectedType]);

  const selectedPattern =
    data.patterns.find((pattern) => pattern.slug === selectedSlug) ?? filteredPatterns[0] ?? data.patterns[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Image source={logo} resizeMode="contain" style={styles.logo} />
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Oil Pattern Intelligence</Text>
            <Text style={styles.title}>Pattern Library</Text>
            <Text style={styles.subtitle}>
              {data.patterns.length} bowling oil patterns bundled for Expo Go on iOS and Android.
            </Text>
          </View>
        </View>

        <View style={styles.searchPanel}>
          <TextInput
            accessibilityLabel="Search oil patterns"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder="Search name, tag, or strategy"
            placeholderTextColor="#78848f"
            style={styles.searchInput}
            value={query}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <Chip label="All" selected={selectedType === "all"} onPress={() => setSelectedType("all")} />
            {data.pattern_types.map((item) => (
              <Chip
                key={item.pattern_type}
                label={`${item.label} ${item.pattern_count}`}
                selected={selectedType === item.pattern_type}
                onPress={() => setSelectedType(item.pattern_type)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.layout}>
          <View style={styles.listColumn}>
            <Text style={styles.sectionTitle}>{filteredPatterns.length} matches</Text>
            {filteredPatterns.slice(0, 80).map((pattern) => (
              <Pressable
                accessibilityRole="button"
                key={pattern.slug}
                onPress={() => setSelectedSlug(pattern.slug)}
                style={[styles.patternCard, selectedPattern?.slug === pattern.slug && styles.patternCardSelected]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.patternName}>{pattern.name}</Text>
                  <Text style={styles.lengthBadge}>{pattern.length_ft} ft</Text>
                </View>
                <Text style={styles.patternMeta}>
                  {typeLabel(pattern.pattern_type)} | {pattern.organization ?? "Reference pattern"} | difficulty{" "}
                  {pattern.difficulty}
                </Text>
                <Text numberOfLines={2} style={styles.patternSummary}>
                  {pattern.summary}
                </Text>
              </Pressable>
            ))}
            {filteredPatterns.length > 80 ? (
              <Text style={styles.moreText}>Showing first 80 results. Narrow the search for a shorter list.</Text>
            ) : null}
          </View>

          {selectedPattern ? (
            <View style={styles.detailColumn}>
              <View style={styles.detailHeader}>
                <View style={styles.detailTitleBlock}>
                  <Text style={styles.detailTitle}>{selectedPattern.name}</Text>
                  <Text style={styles.detailSubtitle}>
                    {typeLabel(selectedPattern.pattern_type)} | {selectedPattern.length_ft} ft |{" "}
                    {difficultyLabel(selectedPattern.difficulty)}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    const url = sourceUrl(selectedPattern);
                    if (url) Linking.openURL(url);
                  }}
                  style={styles.sourceButton}
                >
                  <Text style={styles.sourceButtonText}>Source</Text>
                </Pressable>
              </View>

              <Text style={styles.detailSummary}>{selectedPattern.summary}</Text>

              <View style={styles.statsGrid}>
                <InfoRow label="Volume" value={selectedPattern.volume_ml ? `${selectedPattern.volume_ml} ml` : null} />
                <InfoRow label="Ratio" value={selectedPattern.ratio} />
                <InfoRow label="Motion" value={selectedPattern.ball_motion} />
              </View>

              <View style={styles.handednessRow}>
                <Text style={styles.sectionTitle}>Starting Line</Text>
                <View style={styles.segmented}>
                  <Chip label="Right" selected={handedness === "right"} onPress={() => setHandedness("right")} />
                  <Chip label="Left" selected={handedness === "left"} onPress={() => setHandedness("left")} />
                </View>
              </View>
              <Text style={styles.bodyText}>
                {handedness === "right" ? selectedPattern.suggested_line_right : selectedPattern.suggested_line_left}
              </Text>

              <Text style={styles.sectionTitle}>Lane Read</Text>
              <LaneVisual zones={selectedPattern.zones} />

              <Text style={styles.sectionTitle}>Strategy</Text>
              <Text style={styles.bodyText}>{selectedPattern.play_strategy}</Text>
              <Text style={styles.bodyText}>{selectedPattern.common_adjustments}</Text>

              {selectedPattern.lane_intelligence ? (
                <View style={styles.insightBlock}>
                  <InfoRow label="Target" value={selectedPattern.lane_intelligence.breakpoint_window} />
                  <InfoRow label="First Move" value={selectedPattern.lane_intelligence.first_move_trigger} />
                  <InfoRow label="Surface" value={selectedPattern.lane_intelligence.surface_guidance} />
                </View>
              ) : null}

              <Text style={styles.sectionTitle}>Equipment</Text>
              <Text style={styles.bodyText}>{selectedPattern.recommended_equipment}</Text>
              {selectedPattern.equipment_options.slice(0, 3).map((option) => (
                <View key={`${option.bowler_style}-${option.ball_type}`} style={styles.optionRow}>
                  <Text style={styles.optionTitle}>{option.bowler_style}</Text>
                  <Text style={styles.optionText}>
                    {option.ball_type} | {option.surface}
                  </Text>
                  <Text style={styles.optionText}>{option.when_to_use}</Text>
                </View>
              ))}

              {selectedPattern.tags.length ? (
                <>
                  <Text style={styles.sectionTitle}>Tags</Text>
                  <View style={styles.tagWrap}>
                    {selectedPattern.tags.map((tag) => (
                      <Chip key={tag} label={tag} />
                    ))}
                  </View>
                </>
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#08141d",
  },
  screen: {
    flex: 1,
    backgroundColor: "#eef2f4",
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: "#08141d",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    gap: 16,
  },
  logo: {
    height: 44,
    width: 160,
  },
  headerText: {
    gap: 6,
  },
  eyebrow: {
    color: "#e0b653",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0,
  },
  subtitle: {
    color: "#c8d4dc",
    fontSize: 15,
    lineHeight: 21,
  },
  searchPanel: {
    backgroundColor: "#ffffff",
    borderBottomColor: "#d4dde4",
    borderBottomWidth: 1,
    padding: 14,
    gap: 12,
  },
  searchInput: {
    backgroundColor: "#f4f7f9",
    borderColor: "#cbd6de",
    borderRadius: 8,
    borderWidth: 1,
    color: "#101820",
    fontSize: 16,
    height: 46,
    paddingHorizontal: 14,
  },
  chipRow: {
    gap: 8,
    paddingRight: 14,
  },
  chip: {
    alignItems: "center",
    borderColor: "#cbd6de",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  chipSelected: {
    backgroundColor: "#126b8f",
    borderColor: "#126b8f",
  },
  chipText: {
    color: "#253440",
    fontSize: 13,
    fontWeight: "700",
  },
  chipTextSelected: {
    color: "#ffffff",
  },
  layout: {
    gap: 14,
    padding: 14,
  },
  listColumn: {
    gap: 10,
  },
  sectionTitle: {
    color: "#15222c",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4,
  },
  patternCard: {
    backgroundColor: "#ffffff",
    borderColor: "#d7e0e6",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    gap: 7,
  },
  patternCardSelected: {
    borderColor: "#126b8f",
    borderWidth: 2,
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  patternName: {
    color: "#101820",
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
  },
  lengthBadge: {
    backgroundColor: "#e7f0f4",
    borderRadius: 6,
    color: "#126b8f",
    fontSize: 13,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  patternMeta: {
    color: "#51616d",
    fontSize: 13,
    lineHeight: 18,
  },
  patternSummary: {
    color: "#253440",
    fontSize: 14,
    lineHeight: 20,
  },
  moreText: {
    color: "#51616d",
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  detailColumn: {
    backgroundColor: "#ffffff",
    borderColor: "#d7e0e6",
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  detailHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  detailTitleBlock: {
    flex: 1,
    gap: 4,
  },
  detailTitle: {
    color: "#101820",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0,
  },
  detailSubtitle: {
    color: "#51616d",
    fontSize: 14,
    lineHeight: 20,
  },
  sourceButton: {
    backgroundColor: "#d9573f",
    borderRadius: 8,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  sourceButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  detailSummary: {
    color: "#253440",
    fontSize: 16,
    lineHeight: 23,
  },
  statsGrid: {
    borderColor: "#d7e0e6",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  infoRow: {
    borderBottomColor: "#e4ebef",
    borderBottomWidth: 1,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoLabel: {
    color: "#62727d",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  infoValue: {
    color: "#101820",
    fontSize: 14,
    lineHeight: 20,
  },
  handednessRow: {
    gap: 10,
  },
  segmented: {
    flexDirection: "row",
    gap: 8,
  },
  bodyText: {
    color: "#253440",
    fontSize: 15,
    lineHeight: 22,
  },
  lane: {
    backgroundColor: "#d9b579",
    borderColor: "#b98747",
    borderRadius: 8,
    borderWidth: 1,
    height: 360,
    overflow: "hidden",
    position: "relative",
  },
  zone: {
    position: "absolute",
  },
  breakpointLine: {
    backgroundColor: "rgba(217, 87, 63, 0.85)",
    height: 2,
    left: 0,
    position: "absolute",
    right: 0,
    top: "52%",
  },
  laneLabel: {
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderRadius: 5,
    color: "#3e2b16",
    fontSize: 11,
    fontWeight: "900",
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    position: "absolute",
    textTransform: "uppercase",
    top: 8,
  },
  pinDeckLabel: {
    bottom: 8,
    top: undefined,
  },
  laneFallback: {
    backgroundColor: "#f4f7f9",
    borderColor: "#cbd6de",
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  laneFallbackTitle: {
    color: "#101820",
    fontSize: 16,
    fontWeight: "900",
  },
  laneFallbackText: {
    color: "#51616d",
    fontSize: 14,
    lineHeight: 20,
  },
  insightBlock: {
    backgroundColor: "#f4f7f9",
    borderColor: "#d7e0e6",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  optionRow: {
    borderColor: "#e4ebef",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  optionTitle: {
    color: "#101820",
    fontSize: 14,
    fontWeight: "900",
  },
  optionText: {
    color: "#51616d",
    fontSize: 14,
    lineHeight: 20,
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
