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

type AppSection = "home" | "patterns" | "addPattern" | "balls" | "spares" | "shots" | "chat" | "sync";
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

type MobileSyncPayload = {
  customPatterns: Pattern[];
  balls: Ball[];
  spares: SpareLog[];
  shots: ShotLog[];
  chat: ChatMessage[];
};

type MobileSyncResponse = {
  payload: MobileSyncPayload;
  updated_at: string | null;
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

async function postMobileSync(payload: MobileSyncPayload) {
  if (!backendBaseUrl) {
    throw new Error("Backend URL is not configured");
  }

  const response = await fetch(`${backendBaseUrl}/api/mobile-sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload }),
  });
  const data = (await response.json()) as { payload?: MobileSyncPayload; updated_at?: string | null; error?: string };
  if (!response.ok || !data.payload) {
    throw new Error(data.error || "Sync upload failed");
  }
  return { payload: data.payload, updated_at: data.updated_at ?? null } satisfies MobileSyncResponse;
}

async function getMobileSync() {
  if (!backendBaseUrl) {
    throw new Error("Backend URL is not configured");
  }

  const response = await fetch(`${backendBaseUrl}/api/mobile-sync`);
  const data = (await response.json()) as { payload?: MobileSyncPayload; updated_at?: string | null; error?: string };
  if (!response.ok || !data.payload) {
    throw new Error(data.error || "Sync download failed");
  }
  return { payload: data.payload, updated_at: data.updated_at ?? null } satisfies MobileSyncResponse;
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginName, setLoginName] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [section, setSection] = useState<AppSection>("home");
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
  const [syncStatus, setSyncStatus] = useState("");
  const [editingPatternSlug, setEditingPatternSlug] = useState<string | null>(null);
  const [editingBallId, setEditingBallId] = useState<string | null>(null);
  const [editingSpareId, setEditingSpareId] = useState<string | null>(null);
  const [editingShotId, setEditingShotId] = useState<string | null>(null);

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
      slug: editingPatternSlug ?? `custom-${slugify(patternForm.name)}-${Date.now()}`,
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
    setCustomPatterns((current) =>
      editingPatternSlug
        ? current.map((item) => (item.slug === editingPatternSlug ? pattern : item))
        : [pattern, ...current],
    );
    setSelectedSlug(pattern.slug);
    setPatternForm(emptyPattern);
    setEditingPatternSlug(null);
    setSection("patterns");
  }

  function editPattern(pattern: Pattern) {
    setPatternForm({
      name: pattern.name,
      length: String(pattern.length_ft),
      ratio: pattern.ratio ?? "",
      difficulty: String(pattern.difficulty),
      summary: pattern.summary,
      strategy: pattern.play_strategy,
    });
    setEditingPatternSlug(pattern.slug);
    setSection("addPattern");
  }

  function deletePattern(slug: string) {
    setCustomPatterns((current) => current.filter((pattern) => pattern.slug !== slug));
    if (selectedSlug === slug) {
      setSelectedSlug(data.patterns[0]?.slug ?? "");
    }
  }

  function saveBall() {
    if (!ballForm.name.trim()) return;
    const ball: Ball = {
        id: nowId(),
        name: ballForm.name.trim(),
        cover: ballForm.cover.trim(),
        surface: ballForm.surface.trim(),
        layout: ballForm.layout.trim(),
        motion: ballForm.motion.trim(),
        notes: ballForm.notes.trim(),
        createdAt: today(),
    };
    setBalls((current) =>
      editingBallId
        ? current.map((item) => (item.id === editingBallId ? { ...ball, id: item.id, createdAt: item.createdAt } : item))
        : [ball, ...current],
    );
    setBallForm(emptyBall);
    setEditingBallId(null);
  }

  function editBall(ball: Ball) {
    setBallForm({
      name: ball.name,
      cover: ball.cover,
      surface: ball.surface,
      layout: ball.layout,
      motion: ball.motion,
      notes: ball.notes,
    });
    setEditingBallId(ball.id);
  }

  function deleteBall(id: string) {
    setBalls((current) => current.filter((ball) => ball.id !== id));
  }

  function saveSpare() {
    if (!spareForm.leave.trim()) return;
    const attempts = Math.max(1, numberFromText(spareForm.attempts, 1));
    const makes = Math.min(attempts, Math.max(0, numberFromText(spareForm.makes, 0)));
    const spare: SpareLog = {
        id: nowId(),
        date: today(),
        leave: spareForm.leave.trim(),
        attempts,
        makes,
        ball: spareForm.ball.trim(),
        notes: spareForm.notes.trim(),
    };
    setSpares((current) =>
      editingSpareId
        ? current.map((item) => (item.id === editingSpareId ? { ...spare, id: item.id, date: item.date } : item))
        : [spare, ...current],
    );
    setSpareForm(emptySpare);
    setEditingSpareId(null);
  }

  function editSpare(spare: SpareLog) {
    setSpareForm({
      leave: spare.leave,
      attempts: String(spare.attempts),
      makes: String(spare.makes),
      ball: spare.ball,
      notes: spare.notes,
    });
    setEditingSpareId(spare.id);
  }

  function deleteSpare(id: string) {
    setSpares((current) => current.filter((spare) => spare.id !== id));
  }

  function saveShot() {
    if (!selectedPattern || !shotForm.result.trim()) return;
    const shot: ShotLog = {
        id: nowId(),
        date: today(),
        patternSlug: selectedPattern.slug,
        ball: shotForm.ball.trim(),
        target: shotForm.target.trim(),
        breakpoint: shotForm.breakpoint.trim(),
        result: shotForm.result.trim(),
        adjustment: shotForm.adjustment.trim(),
        notes: shotForm.notes.trim(),
    };
    setShots((current) =>
      editingShotId
        ? current.map((item) => (item.id === editingShotId ? { ...shot, id: item.id, date: item.date } : item))
        : [shot, ...current],
    );
    setShotForm(emptyShot);
    setEditingShotId(null);
  }

  function editShot(shot: ShotLog) {
    setSelectedSlug(shot.patternSlug);
    setShotForm({
      ball: shot.ball,
      target: shot.target,
      breakpoint: shot.breakpoint,
      result: shot.result,
      adjustment: shot.adjustment,
      notes: shot.notes,
    });
    setEditingShotId(shot.id);
  }

  function deleteShot(id: string) {
    setShots((current) => current.filter((shot) => shot.id !== id));
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

  function currentSyncPayload(): MobileSyncPayload {
    return {
      customPatterns,
      balls,
      spares,
      shots,
      chat,
    };
  }

  async function uploadMobileData() {
    setSyncStatus(backendBaseUrl ? "Uploading app data..." : "Set EXPO_PUBLIC_API_BASE_URL before syncing.");
    try {
      const result = await postMobileSync(currentSyncPayload());
      setSyncStatus(`Uploaded to backend${result.updated_at ? ` at ${result.updated_at}` : ""}.`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Upload failed";
      setSyncStatus(detail);
    }
  }

  async function downloadMobileData() {
    setSyncStatus(backendBaseUrl ? "Downloading app data..." : "Set EXPO_PUBLIC_API_BASE_URL before syncing.");
    try {
      const result = await getMobileSync();
      setCustomPatterns(result.payload.customPatterns ?? []);
      setBalls(result.payload.balls ?? []);
      setSpares(result.payload.spares ?? []);
      setShots(result.payload.shots ?? []);
      setChat(result.payload.chat?.length ? result.payload.chat : chat);
      setSyncStatus(`Downloaded from backend${result.updated_at ? ` at ${result.updated_at}` : ""}.`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Download failed";
      setSyncStatus(detail);
    }
  }

  function handleLogin() {
    if (!loginName.trim()) {
      setLoginError("Enter your name or email to continue.");
      return;
    }

    if (loginPin.trim() && loginPin.trim().length < 4) {
      setLoginError("PIN must be at least 4 digits, or leave it blank for now.");
      return;
    }

    setLoginError("");
    setIsLoggedIn(true);
    setSection("home");
  }

  function openProject(nextSection: AppSection) {
    setSection(nextSection);
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.loginScreen}>
          <View style={styles.loginPanel}>
            <Image source={logo} resizeMode="contain" style={styles.loginLogo} />
            <Text style={styles.eyebrow}>Bowl smarter. Strike more.</Text>
            <Text style={styles.loginTitle}>Log In</Text>
            <Text style={styles.loginSubtitle}>Access your StrikeIQ projects, tracking tools, and lane-coach workspace.</Text>
            <Field label="Name or email" value={loginName} onChangeText={setLoginName} placeholder="michael@example.com" />
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>PIN</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={setLoginPin}
                placeholder="Optional local PIN"
                placeholderTextColor="#78848f"
                secureTextEntry
                style={styles.input}
                value={loginPin}
              />
            </View>
            {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}
            <Pressable accessibilityRole="button" onPress={handleLogin} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Enter StrikeIQ</Text>
            </Pressable>
            <Text style={styles.statusText}>This is a local app login. Cloud accounts can be added later.</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
              Lane-play references, starting lines, equipment reads, bowler notes, and tracking tools in one focused dashboard.
            </Text>
          </View>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatNumber}>{allPatterns.length}</Text>
            <Text style={styles.headerStatLabel}>patterns</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setIsLoggedIn(false);
              setLoginPin("");
            }}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </Pressable>
        </View>

        <View style={styles.navBar}>
          <View style={styles.navGrid}>
            <Chip label="Home" selected={section === "home"} onPress={() => setSection("home")} />
            <Chip label="Patterns" selected={section === "patterns"} onPress={() => setSection("patterns")} />
            <Chip label="Add Pattern" selected={section === "addPattern"} onPress={() => setSection("addPattern")} />
            <Chip label="Balls" selected={section === "balls"} onPress={() => setSection("balls")} />
            <Chip label="Spares" selected={section === "spares"} onPress={() => setSection("spares")} />
            <Chip label="Shots" selected={section === "shots"} onPress={() => setSection("shots")} />
            <Chip label="Chat" selected={section === "chat"} onPress={() => setSection("chat")} />
            <Chip label="Sync" selected={section === "sync"} onPress={() => setSection("sync")} />
          </View>
        </View>

        {section === "home" ? (
          <View style={styles.layout}>
            <View style={styles.formPanel}>
              <Text style={styles.detailTitle}>Project Hub</Text>
              <Text style={styles.detailSubtitle}>
                Welcome{loginName.trim() ? `, ${loginName.trim()}` : ""}. Open a project below to work in that area.
              </Text>
            </View>

            <View style={styles.projectGrid}>
              <Pressable accessibilityRole="button" onPress={() => openProject("patterns")} style={styles.projectCard}>
                <Text style={styles.projectTitle}>Oil Pattern Library</Text>
                <Text style={styles.projectMeta}>{allPatterns.length} patterns</Text>
                <Text style={styles.projectDescription}>Search pattern strategy, lane reads, equipment notes, and source links.</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => openProject("addPattern")} style={styles.projectCard}>
                <Text style={styles.projectTitle}>Add Oil Pattern</Text>
                <Text style={styles.projectMeta}>{customPatterns.length} custom</Text>
                <Text style={styles.projectDescription}>Create and manage your own pattern records.</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => openProject("balls")} style={styles.projectCard}>
                <Text style={styles.projectTitle}>Bowling Ball Database</Text>
                <Text style={styles.projectMeta}>{balls.length} balls</Text>
                <Text style={styles.projectDescription}>Track cover, surface, layout, motion, and notes.</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => openProject("spares")} style={styles.projectCard}>
                <Text style={styles.projectTitle}>Spare Count Log</Text>
                <Text style={styles.projectMeta}>{spareStats.rate}% conversion</Text>
                <Text style={styles.projectDescription}>Log spare leaves, attempts, makes, and spare-ball choices.</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => openProject("shots")} style={styles.projectCard}>
                <Text style={styles.projectTitle}>Shot Tracker</Text>
                <Text style={styles.projectMeta}>{shots.length} shots</Text>
                <Text style={styles.projectDescription}>Record target, breakpoint, result, and adjustment history.</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => openProject("chat")} style={styles.projectCard}>
                <Text style={styles.projectTitle}>AI Lane Coach</Text>
                <Text style={styles.projectMeta}>{backendBaseUrl ? "backend ready" : "local fallback"}</Text>
                <Text style={styles.projectDescription}>Ask for ball choice, line choice, spare trends, and adjustments.</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => openProject("sync")} style={styles.projectCard}>
                <Text style={styles.projectTitle}>Sync</Text>
                <Text style={styles.projectMeta}>{backendBaseUrl ? "connected" : "not configured"}</Text>
                <Text style={styles.projectDescription}>Upload or download app-created records through the backend.</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

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
                  {pattern.organization === "User-defined" ? (
                    <View style={styles.actionRow}>
                      <Pressable accessibilityRole="button" onPress={() => editPattern(pattern)} style={styles.smallButton}>
                        <Text style={styles.smallButtonText}>Edit</Text>
                      </Pressable>
                      <Pressable accessibilityRole="button" onPress={() => deletePattern(pattern.slug)} style={styles.dangerButton}>
                        <Text style={styles.dangerButtonText}>Delete</Text>
                      </Pressable>
                    </View>
                  ) : null}
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
              <Text style={styles.detailTitle}>{editingPatternSlug ? "Edit Oil Pattern" : "Add Oil Pattern"}</Text>
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
                <Text style={styles.primaryButtonText}>{editingPatternSlug ? "Update Pattern" : "Save Pattern"}</Text>
              </Pressable>
              {editingPatternSlug ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setEditingPatternSlug(null);
                    setPatternForm(emptyPattern);
                  }}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>Cancel Edit</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}

        {section === "balls" ? (
          <View style={styles.layout}>
            <View style={styles.formPanel}>
              <Text style={styles.detailTitle}>{editingBallId ? "Edit Bowling Ball" : "Bowling Ball Database"}</Text>
              <Field label="Ball name" value={ballForm.name} onChangeText={(name) => setBallForm({ ...ballForm, name })} />
              <Field label="Cover" value={ballForm.cover} onChangeText={(cover) => setBallForm({ ...ballForm, cover })} />
              <Field label="Surface" value={ballForm.surface} onChangeText={(surface) => setBallForm({ ...ballForm, surface })} />
              <Field label="Layout" value={ballForm.layout} onChangeText={(layout) => setBallForm({ ...ballForm, layout })} />
              <Field label="Motion" value={ballForm.motion} onChangeText={(motion) => setBallForm({ ...ballForm, motion })} />
              <Field label="Notes" multiline value={ballForm.notes} onChangeText={(notes) => setBallForm({ ...ballForm, notes })} />
              <Pressable accessibilityRole="button" onPress={saveBall} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>{editingBallId ? "Update Ball" : "Save Ball"}</Text>
              </Pressable>
              {editingBallId ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setEditingBallId(null);
                    setBallForm(emptyBall);
                  }}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>Cancel Edit</Text>
                </Pressable>
              ) : null}
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
                <View style={styles.actionRow}>
                  <Pressable accessibilityRole="button" onPress={() => editBall(ball)} style={styles.smallButton}>
                    <Text style={styles.smallButtonText}>Edit</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => deleteBall(ball.id)} style={styles.dangerButton}>
                    <Text style={styles.dangerButtonText}>Delete</Text>
                  </Pressable>
                </View>
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
              <Text style={styles.detailTitle}>{editingSpareId ? "Edit Spare Log" : "Spare Count Log"}</Text>
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
                <Text style={styles.primaryButtonText}>{editingSpareId ? "Update Spare" : "Log Spare"}</Text>
              </Pressable>
              {editingSpareId ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setEditingSpareId(null);
                    setSpareForm(emptySpare);
                  }}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>Cancel Edit</Text>
                </Pressable>
              ) : null}
            </View>
            {spares.map((spare) => (
              <View key={spare.id} style={styles.patternCard}>
                <Text style={styles.patternName}>{spare.leave}</Text>
                <Text style={styles.patternMeta}>
                  {spare.makes}/{spare.attempts} on {spare.date} | {spare.ball || "Ball not set"}
                </Text>
                {spare.notes ? <Text style={styles.bodyText}>{spare.notes}</Text> : null}
                <View style={styles.actionRow}>
                  <Pressable accessibilityRole="button" onPress={() => editSpare(spare)} style={styles.smallButton}>
                    <Text style={styles.smallButtonText}>Edit</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" onPress={() => deleteSpare(spare.id)} style={styles.dangerButton}>
                    <Text style={styles.dangerButtonText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {section === "shots" ? (
          <View style={styles.layout}>
            <View style={styles.formPanel}>
              <Text style={styles.detailTitle}>{editingShotId ? "Edit Shot" : "Shot Tracker"}</Text>
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
                <Text style={styles.primaryButtonText}>{editingShotId ? "Update Shot" : "Log Shot"}</Text>
              </Pressable>
              {editingShotId ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setEditingShotId(null);
                    setShotForm(emptyShot);
                  }}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>Cancel Edit</Text>
                </Pressable>
              ) : null}
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
                  <View style={styles.actionRow}>
                    <Pressable accessibilityRole="button" onPress={() => editShot(shot)} style={styles.smallButton}>
                      <Text style={styles.smallButtonText}>Edit</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" onPress={() => deleteShot(shot.id)} style={styles.dangerButton}>
                      <Text style={styles.dangerButtonText}>Delete</Text>
                    </Pressable>
                  </View>
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
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setChat([]);
                  setChatStatus("Chat history cleared on this device.");
                }}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Clear Chat</Text>
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

        {section === "sync" ? (
          <View style={styles.layout}>
            <View style={styles.formPanel}>
              <Text style={styles.detailTitle}>Sync App Data</Text>
              <Text style={styles.detailSubtitle}>
                Source code goes to GitHub with git commits. Bowling logs created in Expo Go sync to your Python backend.
              </Text>
              <View style={styles.statsGrid}>
                <InfoRow label="Custom Patterns" value={customPatterns.length} />
                <InfoRow label="Balls" value={balls.length} />
                <InfoRow label="Spares" value={spares.length} />
                <InfoRow label="Shots" value={shots.length} />
                <InfoRow label="Chat Messages" value={chat.length} />
              </View>
              <Pressable accessibilityRole="button" onPress={uploadMobileData} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Upload To Backend</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={downloadMobileData} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Download From Backend</Text>
              </Pressable>
              <Text style={styles.statusText}>
                {backendBaseUrl ? `Backend: ${backendBaseUrl}` : "Backend not configured. Set EXPO_PUBLIC_API_BASE_URL."}
              </Text>
              {syncStatus ? <Text style={styles.statusText}>{syncStatus}</Text> : null}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#05070a",
  },
  screen: {
    flex: 1,
    backgroundColor: "#05070a",
  },
  content: {
    paddingBottom: 32,
  },
  loginScreen: {
    flex: 1,
    backgroundColor: "#05070a",
    justifyContent: "center",
    padding: 18,
  },
  loginPanel: {
    backgroundColor: "rgba(16, 24, 39, 0.92)",
    borderColor: "rgba(76, 201, 240, 0.28)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  loginLogo: {
    height: 58,
    width: 190,
  },
  loginTitle: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  loginSubtitle: {
    color: "#a7b0c0",
    fontSize: 15,
    lineHeight: 22,
  },
  header: {
    alignItems: "center",
    backgroundColor: "#05070a",
    borderBottomColor: "rgba(76, 201, 240, 0.18)",
    borderBottomWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
  },
  logo: {
    height: 48,
    width: 170,
  },
  headerText: {
    flex: 1,
    gap: 6,
    minWidth: 190,
  },
  eyebrow: {
    color: "#4cc9f0",
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
    lineHeight: 34,
    textTransform: "uppercase",
  },
  subtitle: {
    color: "#a7b0c0",
    fontSize: 15,
    lineHeight: 21,
  },
  headerStat: {
    alignItems: "center",
    backgroundColor: "rgba(26, 34, 51, 0.78)",
    borderColor: "rgba(76, 201, 240, 0.34)",
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 104,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerStatNumber: {
    color: "#4cc9f0",
    fontSize: 26,
    fontWeight: "900",
  },
  headerStatLabel: {
    color: "#a7b0c0",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  logoutButton: {
    alignItems: "center",
    backgroundColor: "rgba(26, 34, 51, 0.78)",
    borderColor: "rgba(76, 201, 240, 0.34)",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  logoutButtonText: {
    color: "#4cc9f0",
    fontSize: 13,
    fontWeight: "900",
  },
  navBar: {
    backgroundColor: "#05070a",
    borderBottomColor: "rgba(76, 201, 240, 0.18)",
    borderBottomWidth: 1,
    padding: 12,
  },
  navGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  searchPanel: {
    backgroundColor: "rgba(16, 24, 39, 0.88)",
    borderColor: "rgba(76, 201, 240, 0.18)",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  input: {
    backgroundColor: "#05070a",
    borderColor: "rgba(76, 201, 240, 0.26)",
    borderRadius: 8,
    borderWidth: 1,
    color: "#ffffff",
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
    color: "#a7b0c0",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  chipRow: {
    gap: 8,
    paddingRight: 14,
  },
  chip: {
    alignItems: "center",
    backgroundColor: "rgba(26, 34, 51, 0.74)",
    borderColor: "rgba(76, 201, 240, 0.28)",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: "center",
    minWidth: 86,
    paddingHorizontal: 12,
  },
  chipSelected: {
    backgroundColor: "#0a84ff",
    borderColor: "#4cc9f0",
  },
  chipText: {
    color: "#ffffff",
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
  projectGrid: {
    gap: 12,
  },
  projectCard: {
    backgroundColor: "rgba(16, 24, 39, 0.88)",
    borderColor: "rgba(76, 201, 240, 0.18)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  projectTitle: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  projectMeta: {
    color: "#4cc9f0",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  projectDescription: {
    color: "#a7b0c0",
    fontSize: 14,
    lineHeight: 20,
  },
  formPanel: {
    backgroundColor: "rgba(16, 24, 39, 0.88)",
    borderColor: "rgba(76, 201, 240, 0.18)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4,
    textTransform: "uppercase",
  },
  patternCard: {
    backgroundColor: "rgba(16, 24, 39, 0.88)",
    borderColor: "rgba(76, 201, 240, 0.18)",
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    gap: 7,
  },
  patternCardSelected: {
    borderColor: "#4cc9f0",
    borderWidth: 2,
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  patternName: {
    color: "#ffffff",
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
  },
  lengthBadge: {
    backgroundColor: "rgba(10, 132, 255, 0.18)",
    borderRadius: 6,
    color: "#4cc9f0",
    fontSize: 13,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  patternMeta: {
    color: "#a7b0c0",
    fontSize: 13,
    lineHeight: 18,
  },
  patternSummary: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 20,
  },
  moreText: {
    color: "#a7b0c0",
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  detailColumn: {
    backgroundColor: "rgba(16, 24, 39, 0.88)",
    borderColor: "rgba(76, 201, 240, 0.18)",
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
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0,
  },
  detailSubtitle: {
    color: "#a7b0c0",
    fontSize: 14,
    lineHeight: 20,
  },
  sourceButton: {
    backgroundColor: "#0a84ff",
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
    backgroundColor: "#0a84ff",
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
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "rgba(26, 34, 51, 0.78)",
    borderColor: "#4cc9f0",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: "#4cc9f0",
    fontSize: 15,
    fontWeight: "900",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  smallButton: {
    alignItems: "center",
    backgroundColor: "rgba(10, 132, 255, 0.18)",
    borderColor: "rgba(76, 201, 240, 0.34)",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  smallButtonText: {
    color: "#4cc9f0",
    fontSize: 13,
    fontWeight: "900",
  },
  dangerButton: {
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.14)",
    borderColor: "rgba(239, 68, 68, 0.42)",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  dangerButtonText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "900",
  },
  statusText: {
    color: "#a7b0c0",
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  detailSummary: {
    color: "#ffffff",
    fontSize: 16,
    lineHeight: 23,
  },
  statsGrid: {
    backgroundColor: "rgba(26, 34, 51, 0.72)",
    borderColor: "rgba(76, 201, 240, 0.18)",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  infoRow: {
    borderBottomColor: "rgba(76, 201, 240, 0.12)",
    borderBottomWidth: 1,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoLabel: {
    color: "#a7b0c0",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  infoValue: {
    color: "#ffffff",
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
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 22,
  },
  lane: {
    backgroundColor: "#101827",
    borderColor: "rgba(76, 201, 240, 0.34)",
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
    backgroundColor: "rgba(245, 158, 11, 0.92)",
    height: 2,
    left: 0,
    position: "absolute",
    right: 0,
    top: "52%",
  },
  laneLabel: {
    backgroundColor: "rgba(5, 7, 10, 0.75)",
    borderRadius: 5,
    color: "#ffffff",
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
    backgroundColor: "rgba(26, 34, 51, 0.74)",
    borderColor: "rgba(76, 201, 240, 0.18)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  laneFallbackTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
  laneFallbackText: {
    color: "#a7b0c0",
    fontSize: 14,
    lineHeight: 20,
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chatBubble: {
    backgroundColor: "rgba(16, 24, 39, 0.88)",
    borderColor: "rgba(76, 201, 240, 0.18)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  userBubble: {
    borderColor: "#4cc9f0",
  },
});
