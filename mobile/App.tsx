import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

const logo = require("./assets/strikeiq-logo-lockup.png");

const configuredWebUrl = String(
  (
    globalThis as {
      process?: { env?: { EXPO_PUBLIC_WEB_APP_URL?: string; EXPO_PUBLIC_API_BASE_URL?: string } };
    }
  ).process?.env?.EXPO_PUBLIC_WEB_APP_URL ??
    (globalThis as { process?: { env?: { EXPO_PUBLIC_API_BASE_URL?: string } } }).process?.env?.EXPO_PUBLIC_API_BASE_URL ??
    "",
).replace(/\/$/, "");

function normalizeUrl(value: string) {
  const trimmed = value.trim().replace(/\/$/, "");
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `http://${trimmed}`;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nameOrEmail, setNameOrEmail] = useState("");
  const [pin, setPin] = useState("");
  const [webUrlInput, setWebUrlInput] = useState(configuredWebUrl);
  const [activeWebUrl, setActiveWebUrl] = useState(configuredWebUrl);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const normalizedWebUrl = useMemo(() => normalizeUrl(activeWebUrl), [activeWebUrl]);

  function handleLogin() {
    const nextUrl = normalizeUrl(webUrlInput);
    if (!nameOrEmail.trim()) {
      setError("Enter your name or email.");
      return;
    }
    if (pin.trim() && pin.trim().length < 4) {
      setError("PIN must be at least 4 digits, or leave it blank.");
      return;
    }
    if (!nextUrl) {
      setError("Enter the web app URL from your backend, such as http://192.168.1.207:8000.");
      return;
    }

    setError("");
    setActiveWebUrl(nextUrl);
    setIsLoggedIn(true);
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.loginScreen}>
          <View style={styles.loginPanel}>
            <Image source={logo} resizeMode="contain" style={styles.logo} />
            <Text style={styles.eyebrow}>Bowl smarter. Strike more.</Text>
            <Text style={styles.title}>Log In</Text>
            <Text style={styles.subtitle}>Open the same StrikeIQ web dashboard you see in Codex, inside Expo Go.</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Name or email</Text>
              <TextInput
                autoCapitalize="none"
                onChangeText={setNameOrEmail}
                placeholder="michael@example.com"
                placeholderTextColor="#6f7b8c"
                style={styles.input}
                value={nameOrEmail}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>PIN</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={setPin}
                placeholder="Optional local PIN"
                placeholderTextColor="#6f7b8c"
                secureTextEntry
                style={styles.input}
                value={pin}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Web app URL</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setWebUrlInput}
                placeholder="http://YOUR_WIFI_IP:8000"
                placeholderTextColor="#6f7b8c"
                style={styles.input}
                value={webUrlInput}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable accessibilityRole="button" onPress={handleLogin} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Open StrikeIQ</Text>
            </Pressable>

            <Text style={styles.helperText}>
              Start `app.py` with `HOST=0.0.0.0`, then use your computer's Wi-Fi IP address here.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.webHeader}>
        <Image source={logo} resizeMode="contain" style={styles.headerLogo} />
        <View style={styles.headerText}>
          <Text style={styles.webTitle}>StrikeIQ</Text>
          <Text numberOfLines={1} style={styles.webUrl}>
            {normalizedWebUrl}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setReloadKey((value) => value + 1);
            setIsLoading(true);
          }}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>Reload</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setIsLoggedIn(false);
            setPin("");
          }}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>Log Out</Text>
        </Pressable>
      </View>

      <View style={styles.webContainer}>
        <WebView
          key={`${normalizedWebUrl}-${reloadKey}`}
          source={{ uri: normalizedWebUrl }}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          allowsBackForwardNavigationGestures
          startInLoadingState
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={(event) => {
            setError(event.nativeEvent.description);
            setIsLoading(false);
          }}
          renderLoading={() => (
            <View style={styles.loadingPanel}>
              <ActivityIndicator color="#4cc9f0" />
              <Text style={styles.helperText}>Loading StrikeIQ web dashboard...</Text>
            </View>
          )}
          style={styles.webView}
        />
        {isLoading ? (
          <View pointerEvents="none" style={styles.loadingBar}>
            <ActivityIndicator color="#4cc9f0" size="small" />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#05070a",
  },
  loginScreen: {
    flex: 1,
    justifyContent: "center",
    padding: 18,
  },
  loginPanel: {
    backgroundColor: "rgba(16, 24, 39, 0.94)",
    borderColor: "rgba(76, 201, 240, 0.28)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  logo: {
    height: 58,
    width: 190,
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
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  subtitle: {
    color: "#a7b0c0",
    fontSize: 15,
    lineHeight: 22,
  },
  field: {
    gap: 6,
  },
  label: {
    color: "#a7b0c0",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
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
  helperText: {
    color: "#a7b0c0",
    fontSize: 13,
    lineHeight: 19,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  webHeader: {
    alignItems: "center",
    backgroundColor: "#05070a",
    borderBottomColor: "rgba(76, 201, 240, 0.18)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  headerLogo: {
    height: 34,
    width: 112,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  webTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  webUrl: {
    color: "#a7b0c0",
    fontSize: 11,
  },
  headerButton: {
    alignItems: "center",
    backgroundColor: "rgba(26, 34, 51, 0.78)",
    borderColor: "rgba(76, 201, 240, 0.34)",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: 9,
  },
  headerButtonText: {
    color: "#4cc9f0",
    fontSize: 12,
    fontWeight: "900",
  },
  webContainer: {
    flex: 1,
    backgroundColor: "#05070a",
  },
  webView: {
    flex: 1,
    backgroundColor: "#05070a",
  },
  loadingPanel: {
    alignItems: "center",
    backgroundColor: "#05070a",
    bottom: 0,
    gap: 12,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  loadingBar: {
    alignItems: "center",
    backgroundColor: "rgba(5, 7, 10, 0.78)",
    borderColor: "rgba(76, 201, 240, 0.18)",
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    position: "absolute",
    right: 12,
    top: 12,
  },
});
