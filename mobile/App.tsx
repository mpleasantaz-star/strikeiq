import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
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

type AppSection = "patterns" | "addPattern" | "balls" | "spares" | "shots" | "chat";
type PatternType = "house" | "sport" | "challenge" | "pba" | "custom";
type Handedness = "right" | "left";

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

type Ball = {
  id: string;
  name: string;
  cover: string;
  surface: string;
  layout: string;
  motion: string;
  notes: string;
  createdAt: string;
};

type SpareLog = {
  id: string;
  date: string;
  leave: string;
  attempts: number;
  makes: number;
  ball: string;
  notes: string;
};

type ShotLog = {
  id: string;
  date: string;
  patternSlug: string;
  ball: string;
  target: string;
  breakpoint: string;
  result: string;
  adjustment: string;
  notes: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "coach";
  text: string;
};

type MobileData = {
  generated_at: string;
  patterns: Pattern[];
  pattern_types: { pattern_type: PatternType; label: string; pattern_count: number }[];
};

const data = mobileData as MobileData;
const logo = require("./assets/strikeiq-logo-lockup.png");
const backendBaseUrl = String(
  (globalThis as { process?: { env?: { EXPO_PUBLIC_API_BASE_URL?: string } } }).process?.env?.EXPO_PUBLIC_API_BASE_URL ?? "",
).replace(/\/$/, "");
const storageKeys = {
  patterns: "strikeiq.customPatterns",
  balls: "strikeiq.balls",
  spares: "strikeiq.spares",
  shots: "strikeiq.shots",
  chat: "strikeiq.chat",
};

const emptyPattern = {
  name: "",
  length: "",
  ratio: "",
  difficulty: "3",
  summary: "",
  strategy: "",
};

const emptyBall = {
  name: "",
  cover: "",
  surface: "",
  layout: "",
  motion: "",
  notes: "",
};

const emptySpare = {
  leave: "",
  attempts: "1",
  makes: "0",
  ball: "",
  notes: "",
};

const emptyShot = {
  ball: "",
  target: "",
  breakpoint: "",
  result: "",
  adjustment: "",
  notes: "",
};

function nowId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function numberFromText(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function slugify(value: string) {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `custom-${Date.now()}`;
}

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

function coachReply(input: string, pattern: Pattern | undefined, balls: Ball[], shots: ShotLog[], spares: SpareLog[]) {
  const lower = input.toLowerCase();
  const recentShot = shots[0];
  const bestBall = balls.find((ball) => lower.includes(ball.name.toLowerCase())) ?? balls[0];
  const spareRate =
    spares.length === 0
      ? null
      : Math.round((spares.reduce((sum, item) => sum + item.makes, 0) / Math.max(1, spares.reduce((sum, item) => sum + item.attempts, 0))) * 100);

  if (!pattern) {
    return "Pick a pattern first, then ask about line choice, ball choice, or adjustment. I can use your arsenal, spare log, and recent shots.";
  }

  if (lower.includes("spare")) {
    return `Your spare log is at ${spareRate ?? 0}% overall. On ${pattern.name}, keep spare shots separate from strike-line transition notes so ball changes do not hide spare misses.`;
  }

  if (lower.includes("ball") || lower.includes("arsenal")) {
    const ballText = bestBall
      ? `${bestBall.name} gives you a ${bestBall.motion || bestBall.cover || "known"} look. Surface is ${bestBall.surface || "not set yet"}.`
      : "Add at least one bowling ball so I can compare surface, cover, and motion.";
    return `${ballText} For ${pattern.name}, the app note says: ${pattern.recommended_equipment}`;
  }

  if (lower.includes("move") || lower.includes("adjust") || lower.includes("miss")) {
    const last = recentShot
      ? `Your last shot was ${recentShot.result || "logged"} with target ${recentShot.target || "not set"} and breakpoint ${recentShot.breakpoint || "not set"}.`
      : "No shots are logged yet.";
    return `${last} Pattern guidance: ${pattern.common_adjustments}`;
  }

  return `${pattern.name}: start from the ${pattern.pattern_type} plan and watch breakpoint shape. Right side: ${pattern.suggested_line_right} Left side: ${pattern.suggested_line_left}`;
}

async function fetchAiCoachReply(
  question: string,
  pattern: Pattern | undefined,
  balls: Ball[],
  shots: ShotLog[],
  spares: SpareLog[],
) {
  if (!backendBaseUrl) {
    throw new Error("Backend URL is not configured");
  }

  const response = await fetch(`${backendBaseUrl}/api/coach/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      pattern,
      balls,
      shots,
      spares,
    }),
  });
  const data = (await response.json()) as { reply?: string; error?: string };
  if (!response.ok || !data.reply) {
    throw new Error(data.error || "AI coach request failed");
  }
  return data.reply;
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

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#78848f"
        style={[styles.input, multiline && styles.textArea]}
        value={value}
      />
    </View>
  );
}

function LaneVisual({ zones }: { zones: Zone[] }) {
  if (!zones.length) {
    return (
      <View style={styles.laneFallback}>
        <Text style={styles.laneFallbackTitle}>Graph pending</Text>
        <Text style={styles.laneFallbackText}>This pattern needs source graph review before oil zones are shown.</Text>
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
            style={[styles.zone, { left, top, width, height, backgroundColor: `rgba(22, 118, 164, ${opacity})` }]}
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
  const [section, setSection] = useState<AppSection>("patterns");
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState<PatternType | "all">("all");
  const [selectedSlug, setSelectedSlug] = useState(data.patterns[0]?.slug ?? "");
  const [handedness, setHandedness] = useState<Handedness>("right");
  const [customPatterns, setCustomPatterns] = useState<Pattern[]>([]);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [spares, setSpares] = useState<SpareLog[]>([]);
  const [shots, setShots] = useState<ShotLog[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "coach",
      text: "Ask about line choice, ball choice, spare trends, or shot adjustments. I use the selected pattern and your local logs.",
    },
  ]);
  const [patternForm, setPatternForm] = useState(emptyPattern);
  const [ballForm, setBallForm] = useState(emptyBall);
  const [spareForm, setSpareForm] = useState(emptySpare);
  const [shotForm, setShotForm] = useState(emptyShot);
  const [chatInput, setChatInput] = useState("");
  const [chatStatus, setChatStatus] = useState("");

  useEffect(() => {
    async function loadSavedData() {
      const [savedPatterns, savedBalls, savedSpares, savedShots, savedChat] = await Promise.all([
        AsyncStorage.getItem(storageKeys.patterns),
        AsyncStorage.getItem(storageKeys.balls),
        AsyncStorage.getItem(storageKeys.spares),
        AsyncStorage.getItem(storageKeys.shots),
        AsyncStorage.getItem(storageKeys.chat),
      ]);
      if (savedPatterns) setCustomPatterns(JSON.parse(savedPatterns) as Pattern[]);
      if (savedBalls) setBalls(JSON.parse(savedBalls) as Ball[]);
      if (savedSpares) setSpares(JSON.parse(savedSpares) as SpareLog[]);
      if (savedShots) setShots(JSON.parse(savedShots) as ShotLog[]);
      if (savedChat) setChat(JSON.parse(savedChat) as ChatMessage[]);
    }
    loadSavedData().catch(() => undefined);
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(storageKeys.patterns, JSON.stringify(customPatterns)).catch(() => undefined);
  }, [customPatterns]);

  useEffect(() => {
    AsyncStorage.setItem(storageKeys.balls, JSON.stringify(balls)).catch(() => undefined);
  }, [balls]);

  useEffect(() => {
    AsyncStorage.setItem(storageKeys.spares, JSON.stringify(spares)).catch(() => undefined);
  }, [spares]);

  useEffect(() => {
    AsyncStorage.setItem(storageKeys.shots, JSON.stringify(shots)).catch(() => undefined);
  }, [shots]);

  useEffect(() => {
    AsyncStorage.setItem(storageKeys.chat, JSON.stringify(chat)).catch(() => undefined);
  }, [chat]);

  const allPatterns = useMemo(() => [...customPatterns, ...data.patterns], [customPatterns]);

  const selectedPattern = allPatterns.find((pattern) => pattern.slug === selectedSlug) ?? allPatterns[0];

  const filteredPatterns = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return allPatterns.filter((pattern) => {
      const matchesType = selectedType === "all" || pattern.pattern_type === selectedType;
      const matchesQuery =
        !normalized ||
        pattern.name.toLowerCase().includes(normalized) ||
        pattern.summary.toLowerCase().includes(normalized) ||
        pattern.tags.some((tag) => tag.toLowerCase().includes(normalized));
      return matchesType && matchesQuery;
    });
  }, [allPatterns, query, selectedType]);

  const spareStats = useMemo(() => {
    const attempts = spares.reduce((sum, item) => sum + item.attempts, 0);
    const makes = spares.reduce((sum, item) => sum + item.makes, 0);
    return { attempts, makes, rate: attempts ? Math.round((makes / attempts) * 100) : 0 };
  }, [spares]);

  function savePattern() {
    if (!patternForm.name.trim()) return;
    const pattern: Pattern = {
      slug: `custom-${slugify(patternForm.name)}-${Date.now()}`,
      name: patternForm.name.trim(),
      organization: "User-defined",
      pattern_type: "custom",
      length_ft: numberFromText(patternForm.length, 40),
      volume_ml: null,
      ratio: patternForm.ratio.trim() || "User-defined",
      difficulty: Math.min(5, Math.max(1, numberFromText(patternForm.difficulty, 3))),
      summary: patternForm.summary.trim() || "Custom oil pattern.",
      play_strategy: patternForm.strategy.trim() || "Build a strategy from practice shots and transition notes.",
      ball_motion: "User tracked",
      suggested_line_right: "Set after practice shots.",
      suggested_line_left: "Set after practice shots.",
      recommended_equipment: "Use the ball database to compare benchmark, urethane, and shiny options.",
      common_adjustments: "Track misses in Shot Tracker and move from the logged breakpoint response.",
      source_note: "Created on device.",
      tags: ["custom"],
      zones: [],
      lane_intelligence: null,
      play_profile: null,
      transitions: [],
      equipment_options: [],
      external_refs: [],
    };
    setCustomPatterns((current) => [pattern, ...current]);
    setSelectedSlug(pattern.slug);
    setPatternForm(emptyPattern);
    setSection("patterns");
  }

  function saveBall() {
    if (!ballForm.name.trim()) return;
    setBalls((current) => [
      {
        id: nowId(),
        name: ballForm.name.trim(),
        cover: ballForm.cover.trim(),
        surface: ballForm.surface.trim(),
        layout: ballForm.layout.trim(),
        motion: ballForm.motion.trim(),
        notes: ballForm.notes.trim(),
        createdAt: today(),
      },
      ...current,
    ]);
    setBallForm(emptyBall);
  }

  function saveSpare() {
    if (!spareForm.leave.trim()) return;
    const attempts = Math.max(1, numberFromText(spareForm.attempts, 1));
    const makes = Math.min(attempts, Math.max(0, numberFromText(spareForm.makes, 0)));
    setSpares((current) => [
      {
        id: nowId(),
        date: today(),
        leave: spareForm.leave.trim(),
        attempts,
        makes,
        ball: spareForm.ball.trim(),
        notes: spareForm.notes.trim(),
      },
      ...current,
    ]);
    setSpareForm(emptySpare);
  }

  function saveShot() {
    if (!selectedPattern || !shotForm.result.trim()) return;
    setShots((current) => [
      {
        id: nowId(),
        date: today(),
        patternSlug: selectedPattern.slug,
        ball: shotForm.ball.trim(),
        target: shotForm.target.trim(),
        breakpoint: shotForm.breakpoint.trim(),
        result: shotForm.result.trim(),
        adjustment: shotForm.adjustment.trim(),
        notes: shotForm.notes.trim(),
      },
      ...current,
    ]);
    setShotForm(emptyShot);
  }

  async function sendChat() {
    const text = chatInput.trim();
    if (!text) return;
    const userMessage: ChatMessage = { id: nowId(), role: "user", text };
    setChat((current) => [userMessage, ...current].slice(0, 40));
    setChatInput("");
    setChatStatus(backendBaseUrl ? "Asking AI coach..." : "Using local coach. Set EXPO_PUBLIC_API_BASE_URL to enable AI.");

    try {
      const reply = await fetchAiCoachReply(text, selectedPattern, balls, shots, spares);
      const coachMessage: ChatMessage = { id: nowId(), role: "coach", text: reply };
      setChat((current) => [coachMessage, ...current].slice(0, 40));
      setChatStatus("AI coach connected.");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Backend request failed";
      const coachMessage: ChatMessage = {
        id: nowId(),
        role: "coach",
        text: `${coachReply(text, selectedPattern, balls, shots, spares)}\n\nLocal fallback used: ${detail}`,
      };
      setChat((current) => [coachMessage, ...current]);
      setChatStatus("Local fallback used.");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Image source={logo} resizeMode="contain" style={styles.logo} />
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Bowling Intelligence</Text>
            <Text style={styles.title}>StrikeIQ</Text>
            <Text style={styles.subtitle}>
              Patterns, arsenal notes, spares, shot tracking, and lane-coach chat in one Expo app.
            </Text>
          </View>
        </View>

        <View style={styles.navBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <Chip label="Patterns" selected={section === "patterns"} onPress={() => setSection("patterns")} />
            <Chip label="Add Pattern" selected={section === "addPattern"} onPress={() => setSection("addPattern")} />
            <Chip label="Balls" selected={section === "balls"} onPress={() => setSection("balls")} />
            <Chip label="Spares" selected={section === "spares"} onPress={() => setSection("spares")} />
            <Chip label="Shots" selected={section === "shots"} onPress={() => setSection("shots")} />
            <Chip label="Chat" selected={section === "chat"} onPress={() => setSection("chat")} />
          </ScrollView>
        </View>

        {section === "patterns" ? (
          <View style={styles.layout}>
            <View style={styles.searchPanel}>
              <TextInput
                accessibilityLabel="Search oil patterns"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setQuery}
                placeholder="Search name, tag, or strategy"
                placeholderTextColor="#78848f"
                style={styles.input}
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

                <Text style={styles.sectionTitle}>Equipment</Text>
                <Text style={styles.bodyText}>{selectedPattern.recommended_equipment}</Text>

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
        ) : null}

        {section === "addPattern" ? (
          <View style={styles.layout}>
            <View style={styles.formPanel}>
              <Text style={styles.detailTitle}>Add Oil Pattern</Text>
              <Field label="Pattern name" value={patternForm.name} onChangeText={(name) => setPatternForm({ ...patternForm, name })} />
              <Field
                label="Length"
                keyboardType="numeric"
                value={patternForm.length}
                onChangeText={(length) => setPatternForm({ ...patternForm, length })}
                placeholder="40"
              />
              <Field label="Ratio" value={patternForm.ratio} onChangeText={(ratio) => setPatternForm({ ...patternForm, ratio })} />
              <Field
                label="Difficulty 1-5"
                keyboardType="numeric"
                value={patternForm.difficulty}
                onChangeText={(difficulty) => setPatternForm({ ...patternForm, difficulty })}
              />
              <Field
                label="Summary"
                multiline
                value={patternForm.summary}
                onChangeText={(summary) => setPatternForm({ ...patternForm, summary })}
              />
              <Field
                label="Strategy"
                multiline
                value={patternForm.strategy}
                onChangeText={(strategy) => setPatternForm({ ...patternForm, strategy })}
              />
              <Pressable accessibilityRole="button" onPress={savePattern} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Save Pattern</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {section === "balls" ? (
          <View style={styles.layout}>
            <View style={styles.formPanel}>
              <Text style={styles.detailTitle}>Bowling Ball Database</Text>
              <Field label="Ball name" value={ballForm.name} onChangeText={(name) => setBallForm({ ...ballForm, name })} />
              <Field label="Cover" value={ballForm.cover} onChangeText={(cover) => setBallForm({ ...ballForm, cover })} />
              <Field label="Surface" value={ballForm.surface} onChangeText={(surface) => setBallForm({ ...ballForm, surface })} />
              <Field label="Layout" value={ballForm.layout} onChangeText={(layout) => setBallForm({ ...ballForm, layout })} />
              <Field label="Motion" value={ballForm.motion} onChangeText={(motion) => setBallForm({ ...ballForm, motion })} />
              <Field label="Notes" multiline value={ballForm.notes} onChangeText={(notes) => setBallForm({ ...ballForm, notes })} />
              <Pressable accessibilityRole="button" onPress={saveBall} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Save Ball</Text>
              </Pressable>
            </View>
            {balls.map((ball) => (
              <View key={ball.id} style={styles.patternCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.patternName}>{ball.name}</Text>
                  <Text style={styles.lengthBadge}>{ball.surface || "surface"}</Text>
                </View>
                <Text style={styles.patternMeta}>{ball.cover || "Cover not set"} | {ball.layout || "Layout not set"}</Text>
                <Text style={styles.patternSummary}>{ball.motion || "Motion not set"}</Text>
                {ball.notes ? <Text style={styles.bodyText}>{ball.notes}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {section === "spares" ? (
          <View style={styles.layout}>
            <View style={styles.statsGrid}>
              <InfoRow label="Attempts" value={spareStats.attempts} />
              <InfoRow label="Makes" value={spareStats.makes} />
              <InfoRow label="Conversion" value={`${spareStats.rate}%`} />
            </View>
            <View style={styles.formPanel}>
              <Text style={styles.detailTitle}>Spare Count Log</Text>
              <Field label="Leave" value={spareForm.leave} onChangeText={(leave) => setSpareForm({ ...spareForm, leave })} placeholder="10 pin" />
              <Field
                label="Attempts"
                keyboardType="numeric"
                value={spareForm.attempts}
                onChangeText={(attempts) => setSpareForm({ ...spareForm, attempts })}
              />
              <Field
                label="Makes"
                keyboardType="numeric"
                value={spareForm.makes}
                onChangeText={(makes) => setSpareForm({ ...spareForm, makes })}
              />
              <Field label="Ball" value={spareForm.ball} onChangeText={(ball) => setSpareForm({ ...spareForm, ball })} />
              <Field label="Notes" multiline value={spareForm.notes} onChangeText={(notes) => setSpareForm({ ...spareForm, notes })} />
              <Pressable accessibilityRole="button" onPress={saveSpare} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Log Spare</Text>
              </Pressable>
            </View>
            {spares.map((spare) => (
              <View key={spare.id} style={styles.patternCard}>
                <Text style={styles.patternName}>{spare.leave}</Text>
                <Text style={styles.patternMeta}>
                  {spare.makes}/{spare.attempts} on {spare.date} | {spare.ball || "Ball not set"}
                </Text>
                {spare.notes ? <Text style={styles.bodyText}>{spare.notes}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {section === "shots" ? (
          <View style={styles.layout}>
            <View style={styles.formPanel}>
              <Text style={styles.detailTitle}>Shot Tracker</Text>
              <Text style={styles.detailSubtitle}>Current pattern: {selectedPattern?.name ?? "None"}</Text>
              <Field label="Ball" value={shotForm.ball} onChangeText={(ball) => setShotForm({ ...shotForm, ball })} />
              <Field label="Target" value={shotForm.target} onChangeText={(target) => setShotForm({ ...shotForm, target })} placeholder="15 at arrows" />
              <Field
                label="Breakpoint"
                value={shotForm.breakpoint}
                onChangeText={(breakpoint) => setShotForm({ ...shotForm, breakpoint })}
                placeholder="8 downlane"
              />
              <Field label="Result" value={shotForm.result} onChangeText={(result) => setShotForm({ ...shotForm, result })} placeholder="high, light, strike" />
              <Field
                label="Adjustment"
                value={shotForm.adjustment}
                onChangeText={(adjustment) => setShotForm({ ...shotForm, adjustment })}
                placeholder="2 left with feet"
              />
              <Field label="Notes" multiline value={shotForm.notes} onChangeText={(notes) => setShotForm({ ...shotForm, notes })} />
              <Pressable accessibilityRole="button" onPress={saveShot} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Log Shot</Text>
              </Pressable>
            </View>
            {shots.map((shot) => {
              const pattern = allPatterns.find((item) => item.slug === shot.patternSlug);
              return (
                <View key={shot.id} style={styles.patternCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.patternName}>{shot.result}</Text>
                    <Text style={styles.lengthBadge}>{shot.date}</Text>
                  </View>
                  <Text style={styles.patternMeta}>{pattern?.name ?? "Pattern"} | {shot.ball || "Ball not set"}</Text>
                  <Text style={styles.patternSummary}>
                    Target {shot.target || "not set"} | Breakpoint {shot.breakpoint || "not set"}
                  </Text>
                  {shot.adjustment ? <Text style={styles.bodyText}>Adjustment: {shot.adjustment}</Text> : null}
                  {shot.notes ? <Text style={styles.bodyText}>{shot.notes}</Text> : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {section === "chat" ? (
          <View style={styles.layout}>
            <View style={styles.formPanel}>
              <Text style={styles.detailTitle}>Lane Coach Chat</Text>
              <Text style={styles.detailSubtitle}>Current pattern: {selectedPattern?.name ?? "None selected"}</Text>
              <Field
                label="Question"
                multiline
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="What ball should I start with?"
              />
              <Pressable accessibilityRole="button" onPress={sendChat} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Ask Coach</Text>
              </Pressable>
              <Text style={styles.statusText}>
                {backendBaseUrl ? `Backend: ${backendBaseUrl}` : "Backend not configured. Local coach fallback is active."}
              </Text>
              {chatStatus ? <Text style={styles.statusText}>{chatStatus}</Text> : null}
            </View>
            {chat.map((message) => (
              <View key={message.id} style={[styles.chatBubble, message.role === "user" && styles.userBubble]}>
                <Text style={styles.infoLabel}>{message.role === "user" ? "You" : "Coach"}</Text>
                <Text style={styles.bodyText}>{message.text}</Text>
              </View>
            ))}
          </View>
        ) : null}
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
  navBar: {
    backgroundColor: "#ffffff",
    borderBottomColor: "#d4dde4",
    borderBottomWidth: 1,
    padding: 12,
  },
  searchPanel: {
    backgroundColor: "#ffffff",
    borderColor: "#d7e0e6",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  input: {
    backgroundColor: "#f4f7f9",
    borderColor: "#cbd6de",
    borderRadius: 8,
    borderWidth: 1,
    color: "#101820",
    fontSize: 16,
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 92,
    textAlignVertical: "top",
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    color: "#253440",
    fontSize: 13,
    fontWeight: "900",
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
  formPanel: {
    backgroundColor: "#ffffff",
    borderColor: "#d7e0e6",
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16,
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
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#126b8f",
    borderRadius: 8,
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  statusText: {
    color: "#51616d",
    fontSize: 13,
    lineHeight: 18,
  },
  detailSummary: {
    color: "#253440",
    fontSize: 16,
    lineHeight: 23,
  },
  statsGrid: {
    backgroundColor: "#ffffff",
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
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chatBubble: {
    backgroundColor: "#ffffff",
    borderColor: "#d7e0e6",
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  userBubble: {
    borderColor: "#126b8f",
  },
});
