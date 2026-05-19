import * as THREE from "/vendor/three.module.js";

const state = {
  patterns: [],
  balls: [],
  spares: { spares: [], attempts: 0, makes: 0, rate: 0 },
  spareSessions: [],
  spareSession: null,
  shots: [],
  chat: [],
  communityPosts: [],
  chatChannel: "# video-feedback",
  selectedSlug: null,
  laneVisual: null,
  handedness: "right",
  targetPath: null,
  project: "hub",
  userName: "",
  profile: null,
  subscriptionTier: "free",
  ballFilters: { search: "", condition: "all", cover: "all" },
};

const elements = {
  loginScreen: document.querySelector("#login-screen"),
  loginForm: document.querySelector("#login-form"),
  loginEmail: document.querySelector("#login-email"),
  loginPassword: document.querySelector("#login-password"),
  authTitle: document.querySelector("#auth-title"),
  authSubtitle: document.querySelector("#auth-subtitle"),
  authSubmit: document.querySelector("#auth-submit"),
  authToggle: document.querySelector("#auth-toggle"),
  loginError: document.querySelector("#login-error"),
  profileScreen: document.querySelector("#profile-screen"),
  profileForm: document.querySelector("#profile-form"),
  profileName: document.querySelector("#profile-name"),
  profileCenter: document.querySelector("#profile-center"),
  findHomeCenters: document.querySelector("#find-home-centers"),
  nearbyHomeCenters: document.querySelector("#nearby-home-centers"),
  homeCenterStatus: document.querySelector("#home-center-status"),
  homeCenterOptions: document.querySelector("#home-center-options"),
  profileHandedness: document.querySelector("#profile-handedness"),
  profileDelivery: document.querySelector("#profile-delivery"),
  profileStyle: document.querySelector("#profile-style"),
  profileLevel: document.querySelector("#profile-level"),
  profileSpeed: document.querySelector("#profile-speed"),
  profileRevRate: document.querySelector("#profile-rev-rate"),
  profileBallWeight: document.querySelector("#profile-ball-weight"),
  profileAverage: document.querySelector("#profile-average"),
  profileGoals: document.querySelector("#profile-goals"),
  profileError: document.querySelector("#profile-error"),
  appShell: document.querySelector("#app-shell"),
  logout: document.querySelector("#logout-button"),
  tierLabel: document.querySelector("#tier-label"),
  tierDetail: document.querySelector("#tier-detail"),
  upgradeButton: document.querySelector("#upgrade-button"),
  projectHub: document.querySelector("#project-hub"),
  patternWorkspace: document.querySelector("#pattern-workspace"),
  toolWorkspace: document.querySelector("#tool-workspace"),
  toolEyebrow: document.querySelector("#tool-eyebrow"),
  toolTitle: document.querySelector("#tool-title"),
  toolDescription: document.querySelector("#tool-description"),
  toolContent: document.querySelector("#tool-content"),
  homeGreeting: document.querySelector("#home-greeting"),
  homeSubcopy: document.querySelector("#home-subcopy"),
  homeTier: document.querySelector("#home-tier"),
  homeProfile: document.querySelector("#home-profile"),
  homeFocus: document.querySelector("#home-focus"),
  homeProfileDetails: document.querySelector("#home-profile-details"),
  homeWorkspaceCount: document.querySelector("#home-workspace-count"),
  homeBallCount: document.querySelector("#home-ball-count"),
  homeSpareRate: document.querySelector("#home-spare-rate"),
  homeShotCount: document.querySelector("#home-shot-count"),
  homeNextActions: document.querySelector("#home-next-actions"),
  homeRecent: document.querySelector("#home-recent"),
  source: document.querySelector("#source-filter"),
  type: document.querySelector("#type-filter"),
  length: document.querySelector("#length-filter"),
  difficulty: document.querySelector("#difficulty-filter"),
  tag: document.querySelector("#tag-filter"),
  reset: document.querySelector("#reset-filters"),
  patterns: document.querySelector("#patterns"),
  detail: document.querySelector("#pattern-detail"),
  syncSummary: document.querySelector("#sync-summary"),
  syncState: document.querySelector("#sync-state"),
  runSync: document.querySelector("#run-sync"),
  importSummary: document.querySelector("#import-summary"),
  importState: document.querySelector("#import-state"),
  catalogSummary: document.querySelector("#catalog-summary"),
  catalogState: document.querySelector("#catalog-state"),
};

let authMode = "create";

const storageKeys = {
  accountEmail: "strikeiq.accountEmail",
  profile: "strikeiq.profile",
  subscriptionTier: "strikeiq.subscriptionTier",
};

const proProjects = new Set(["sync"]);
const homeWorkspaceCount = 5;
const chatChannels = [
  ["# general", "Main discussion for the community"],
  ["# lane-talk", "Moves, transition, and shape changes"],
  ["# arsenal-help", "What ball to throw and when"],
  ["# video-feedback", "Post clips and request feedback"],
  ["# my-sessions", "Your saved shot history"],
];
const spareFrameLabels = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "10a", "10b"];
const spareBoards = Array.from({ length: 41 }, (_, index) => String(index));
const spareSpeeds = Array.from({ length: 90 }, (_, index) => (10 + index / 10).toFixed(1));
const bowlingCenters = [
  { name: "AMF Peoria Lanes", address: "Peoria, AZ", lat: 33.581, lon: -112.239 },
  { name: "Bowlero Glendale", address: "17210 N 59th Ave, Glendale, AZ 85308", lat: 33.641, lon: -112.186 },
  { name: "AMF Union Hills Lanes", address: "Phoenix, AZ", lat: 33.654, lon: -112.132 },
  { name: "AMF Desert Hills Lanes", address: "Phoenix, AZ", lat: 33.64, lon: -112.02 },
  { name: "Let it Roll Bowl", address: "8925 N 12th St, Phoenix, AZ 85020", lat: 33.566, lon: -112.056 },
  { name: "Bowlero Christown", address: "Phoenix, AZ", lat: 33.523, lon: -112.099 },
  { name: "Lucky Strike North Scottsdale", address: "Scottsdale, AZ", lat: 33.622, lon: -111.925 },
  { name: "Bowlero Via Linda", address: "Scottsdale, AZ", lat: 33.569, lon: -111.89 },
  { name: "Bowlero Old Town", address: "Scottsdale, AZ", lat: 33.494, lon: -111.926 },
  { name: "AMF Tempe Village Lanes", address: "Tempe, AZ", lat: 33.378, lon: -111.91 },
  { name: "AMF Mesa Lanes", address: "Mesa, AZ", lat: 33.392, lon: -111.84 },
  { name: "AMF Chandler Lanes", address: "Chandler, AZ", lat: 33.333, lon: -111.842 },
  { name: "AMF McRay Plaza Lanes", address: "Chandler, AZ", lat: 33.319, lon: -111.91 },
];

const projectDetails = {
  "add-pattern": {
    eyebrow: "Custom Pattern",
    title: "Add Oil Pattern",
    description: "Create custom pattern records here. The current backend already supports user notes; full custom pattern persistence is the next backend endpoint.",
    content: `
      <form id="custom-pattern-form" class="note-form project-form">
        <div class="form-row">
          <label>Pattern name<input name="name" placeholder="My league shot" required></label>
          <label>Length<input name="length_ft" inputmode="numeric" placeholder="40" required></label>
        </div>
        <div class="form-row">
          <label>Ratio<input name="ratio" placeholder="House, sport, or custom ratio"></label>
          <label>Difficulty<input name="difficulty" inputmode="numeric" placeholder="3"></label>
        </div>
        <label>Summary<textarea name="summary" placeholder="Short description of the pattern"></textarea></label>
        <label>Strategy<textarea name="play_strategy" placeholder="Starting line, breakpoint, surface, and adjustment notes"></textarea></label>
        <div class="form-row">
          <label>Right line<input name="suggested_line_right" placeholder="12 at arrows to 8"></label>
          <label>Left line<input name="suggested_line_left" placeholder="28 at arrows to 32"></label>
        </div>
        <label>Equipment<textarea name="recommended_equipment" placeholder="Benchmark, urethane, surface, or ball change notes"></textarea></label>
        <button type="submit">Save Pattern</button>
        <p id="custom-pattern-status" class="empty-state"></p>
      </form>
    `,
  },
  balls: {
    eyebrow: "Arsenal",
    title: "Ball Database",
    description: "Browse the seeded ball catalog, filter by lane use, and add custom arsenal pieces that browser and Expo share.",
    content: `
      <section class="ball-catalog-tools" aria-label="Ball catalog filters">
        <label>Search catalog<input id="ball-search" type="search" placeholder="Storm, Hammer, Phaze, urethane"></label>
        <label>Lane use
          <select id="ball-condition-filter">
            <option value="all">All conditions</option>
            <option value="Fresh heavy oil">Fresh heavy oil</option>
            <option value="Medium house shot">Medium house shot</option>
            <option value="Transition">Transition</option>
            <option value="Dry lanes">Dry lanes</option>
            <option value="Spares">Spares</option>
          </select>
        </label>
        <label>Cover
          <select id="ball-cover-filter">
            <option value="all">All covers</option>
            <option value="Reactive solid">Reactive solid</option>
            <option value="Reactive hybrid">Reactive hybrid</option>
            <option value="Reactive pearl">Reactive pearl</option>
            <option value="Urethane">Urethane</option>
            <option value="Plastic">Plastic</option>
          </select>
        </label>
      </section>
      <div id="ball-summary" class="project-metric"></div>
      <form id="ball-form" class="note-form project-form">
        <div class="form-row">
          <label>Brand<input name="brand" placeholder="Storm, Hammer, Motiv"></label>
          <label>Ball name<input name="name" placeholder="Benchmark solid" required></label>
        </div>
        <div class="form-row">
          <label>Cover<input name="cover" placeholder="Reactive solid"></label>
          <label>Core<input name="core" placeholder="Symmetric, asymmetric"></label>
        </div>
        <div class="form-row">
          <label>Surface<input name="surface" placeholder="3000, 2000, polish"></label>
          <label>Layout<input name="layout" placeholder="Pin up, control, etc."></label>
        </div>
        <div class="form-row">
          <label>RG<input name="rg" inputmode="decimal" placeholder="2.48"></label>
          <label>Differential<input name="differential" inputmode="decimal" placeholder="0.051"></label>
        </div>
        <div class="form-row">
          <label>Lane use<input name="condition" placeholder="Medium house shot"></label>
          <label>Strength<input name="strength" inputmode="numeric" placeholder="7"></label>
        </div>
        <label>Motion<textarea name="motion" placeholder="Early, smooth, angular, controllable"></textarea></label>
        <label>Research URL<input name="research_url" placeholder="https://manufacturer.com/ball"></label>
        <label>Notes<textarea name="notes" placeholder="When to use it, lane shape, misses"></textarea></label>
        <button type="submit">Save Ball</button>
      </form>
      <div id="ball-list" class="project-list"></div>
    `,
  },
  spares: {
    eyebrow: "Scoring",
    title: "Scoring",
    description: "Track games, frames, strikes, spares, speed, ball changes, and quick conversion notes.",
    content: `
      <section class="spare-session-panel">
        <div class="form-row">
          <label>Session date<input id="spare-session-date" type="date"></label>
          <label>Bowling alley<input id="spare-session-alley" placeholder="Center name"></label>
        </div>
        <div id="spare-session-summary" class="project-metric"></div>
        <div id="spare-session-games" class="spare-games"></div>
        <div class="project-actions">
          <button type="button" id="save-spare-session">Save Session</button>
          <button type="button" id="reset-spare-session">Reset Session</button>
        </div>
        <p id="spare-session-status" class="empty-state"></p>
      </section>
      <form id="spare-form" class="note-form project-form">
        <h3>Quick Spare Conversion Log</h3>
        <div class="form-row">
          <label>Leave<input name="leave" placeholder="10 pin" required></label>
          <label>Ball<input name="ball" placeholder="Spare ball"></label>
        </div>
        <div class="form-row">
          <label>Attempts<input name="attempts" inputmode="numeric" placeholder="5" required></label>
          <label>Makes<input name="makes" inputmode="numeric" placeholder="4" required></label>
        </div>
        <label>Notes<textarea name="notes" placeholder="Miss direction, target, setup"></textarea></label>
        <button type="submit">Log Spare</button>
      </form>
      <div id="spare-summary" class="project-metric"></div>
      <h3>Saved Sessions</h3>
      <div id="spare-session-list" class="project-list"></div>
      <h3>Quick Logs</h3>
      <div id="spare-list" class="project-list"></div>
    `,
  },
  shots: {
    eyebrow: "Lane Tracking",
    title: "Lane Tracker",
    description: "Track sessions, targets, misses, leaves, and next moves.",
    content: `
      <form id="shot-form" class="note-form project-form">
        <div class="form-row">
          <label>Date<input type="date" name="session_date" id="lane-session-date"></label>
          <label>Center<input name="lane_center" id="lane-session-center" placeholder="Home center"></label>
        </div>
        <div class="form-row">
          <label>Lane<input name="lane_number" placeholder="Pair 7-8 / lane 12"></label>
          <label>Game<input type="number" name="game_number" min="1" max="20" placeholder="1"></label>
          <label>Frame<input name="frame_number" placeholder="1-10"></label>
        </div>
        <div class="form-row">
          <label>Ball<input name="ball" list="lane-ball-options" placeholder="Benchmark solid"></label>
          <label>Lane Condition
            <select name="lane_condition">
              <option value="">Select condition</option>
              <option>Fresh</option>
              <option>Transition</option>
              <option>Burn</option>
              <option>Carrydown</option>
              <option>Unknown</option>
            </select>
          </label>
        </div>
        <datalist id="lane-ball-options"></datalist>
        <div class="form-row">
          <label>Feet Board<input name="feet_board" placeholder="22"></label>
          <label>Arrows Board<input name="arrows_board" placeholder="12"></label>
          <label>Breakpoint<input name="breakpoint" placeholder="8 downlane"></label>
        </div>
        <div class="form-row">
          <label>Ball Speed<input name="ball_speed" placeholder="16.5 mph"></label>
          <label>Result<input name="result" placeholder="Strike, high, light" required></label>
        </div>
        <div class="form-row">
          <label>Miss Direction
            <select name="miss_direction">
              <option value="">Select miss</option>
              <option>Flush</option>
              <option>High</option>
              <option>Light</option>
              <option>Left</option>
              <option>Right</option>
              <option>Early hook</option>
              <option>Through breakpoint</option>
            </select>
          </label>
          <label>Leave<input name="leave_pin" placeholder="10 pin, 2-8, split"></label>
        </div>
        <input type="hidden" name="pattern_slug" id="shot-pattern-slug">
        <label>Adjustment<textarea name="adjustment" placeholder="2 left with feet, slower speed, ball change"></textarea></label>
        <label>Next Move<textarea name="next_move" placeholder="Move feet, change ball, change speed, change target"></textarea></label>
        <label>Notes<textarea name="notes" placeholder="Reaction, carry, lane read, confidence"></textarea></label>
        <button type="submit">Log Shot</button>
      </form>
      <div id="lane-summary" class="project-metric"></div>
      <div id="shot-list" class="project-list"></div>
    `,
  },
  chat: {
    eyebrow: "Friends",
    title: "Friends",
    description: "Chat with friends, post video feedback, and keep AI coaching nearby.",
    content: `
      <div class="chat-workspace">
        <aside class="chat-sidebar">
          <strong>Friends</strong>
          <p>Bowling chat, video feedback, coaching, and lane talk.</p>
          <div id="chat-channel-list" class="chat-channel-list"></div>
        </aside>
        <section class="chat-feed">
          <div class="chat-section-heading">
            <div>
              <p class="eyebrow">Video Feedback</p>
              <h3 id="active-channel-title"># video-feedback</h3>
            </div>
          </div>
          <form id="community-post-form" class="note-form project-form">
            <div class="form-row">
              <label>Channel<select name="channel" id="community-channel"></select></label>
              <label>Video title<input name="title" placeholder="League shot 1" required></label>
            </div>
            <div class="form-row">
              <label>Shot type<input name="shot_type" placeholder="League / Practice / Tournament / Spare"></label>
              <label>Video link<input name="video_url" placeholder="Paste YouTube, Drive, or Hudl link"></label>
            </div>
            <label>Feedback request<textarea name="feedback_request" placeholder="What feedback do you want?"></textarea></label>
            <button type="submit">Post Video Feedback</button>
            <p id="community-post-status" class="empty-state"></p>
          </form>
          <div id="community-feed" class="community-feed"></div>
        </section>
        <aside class="coach-panel">
          <p class="eyebrow">AI Coach</p>
          <h3>Lane Coach</h3>
          <form id="coach-form" class="note-form project-form">
            <label>Question<textarea name="question" placeholder="What should I adjust after going high?" required></textarea></label>
            <button type="submit">Ask Coach</button>
            <p id="coach-status" class="empty-state"></p>
          </form>
          <div id="chat-list" class="project-list"></div>
        </aside>
      </div>
    `,
  },
  sync: {
    eyebrow: "Admin",
    title: "Sync / Admin Tools",
    description: "Use the existing sidebar tools for source sync, import review, and catalog coverage.",
    content: `
      <div class="project-actions">
        <button type="button" data-project="patterns">Open Pattern Dashboard</button>
      </div>
      <p class="empty-state">Source Sync, Import Review, and Catalog Coverage are available in the pattern dashboard sidebar.</p>
    `,
  },
  upgrade: {
    eyebrow: "StrikeIQ Pro",
    title: "Unlock Pro Tools",
    description: "The app now has free and Pro access rules. Real App Store and Google Play payments can connect later when the app screens are stable.",
    content: `
      <div class="paywall-panel">
        <div>
          <h3>Free</h3>
          <p>Account setup, oil pattern library, add oil pattern, bowling ball database, spare log, and shot tracker.</p>
        </div>
        <div>
          <h3>Pro</h3>
          <p>AI coaching, sync/admin tools, and future cloud features for advanced tracking and reports.</p>
        </div>
      </div>
      <div class="project-actions">
        <button type="button" data-subscription-tier="pro">Enable Pro Preview</button>
        <button type="button" data-subscription-tier="free">Return To Free</button>
      </div>
      <p class="empty-state">This is a local development preview. Production payments should come from Apple In-App Purchase and Google Play Billing, usually through RevenueCat or a similar entitlement backend.</p>
    `,
  },
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function savedProfile() {
  try {
    return JSON.parse(window.localStorage.getItem(storageKeys.profile) || "null");
  } catch {
    return null;
  }
}

function savedSubscriptionTier() {
  return window.localStorage.getItem(storageKeys.subscriptionTier) === "pro" ? "pro" : "free";
}

function milesBetween(lat1, lon1, lat2, lon2) {
  const earthRadiusMiles = 3958.8;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function renderHomeCenterOptions(centers, statusText) {
  if (!elements.nearbyHomeCenters || !elements.homeCenterOptions) return;
  elements.nearbyHomeCenters.innerHTML = centers.length
    ? `<option value="">Select a nearby center</option>${centers
        .map((center) => {
          const distance = Number.isFinite(center.distance) ? ` - ${center.distance.toFixed(1)} mi` : "";
          return `<option value="${escapeHtml(center.name)}">${escapeHtml(center.name)}${distance}</option>`;
        })
        .join("")}`
    : `<option value="">No nearby centers found</option>`;
  elements.homeCenterOptions.innerHTML = centers
    .map((center) => `<option value="${escapeHtml(center.name)}">${escapeHtml(center.address)}</option>`)
    .join("");
  if (elements.homeCenterStatus) {
    elements.homeCenterStatus.textContent = statusText;
  }
}

function findNearbyHomeCenters() {
  if (!navigator.geolocation) {
    renderHomeCenterOptions(bowlingCenters.slice(0, 8), "Location is not available here. Showing saved Arizona centers.");
    return;
  }

  elements.findHomeCenters.disabled = true;
  elements.homeCenterStatus.textContent = "Requesting location permission...";
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      const centers = bowlingCenters
        .map((center) => ({
          ...center,
          distance: milesBetween(latitude, longitude, center.lat, center.lon),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 8);
      renderHomeCenterOptions(centers, "Closest bowling centers populated from your current location.");
      elements.findHomeCenters.disabled = false;
    },
    () => {
      renderHomeCenterOptions(bowlingCenters.slice(0, 8), "Location permission was not available. Showing saved Arizona centers.");
      elements.findHomeCenters.disabled = false;
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
  );
}

function titleFromSlug(value) {
  return String(value || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.replace(/^\w/, (letter) => letter.toUpperCase()))
    .join(" ");
}

function profileCompletion(profile) {
  const keys = [
    "displayName",
    "homeCenter",
    "handedness",
    "delivery",
    "bowlerStyle",
    "skillLevel",
    "ballSpeed",
    "revRate",
    "ballWeight",
    "leagueAverage",
    "goals",
  ];
  const completed = keys.filter((key) => String(profile?.[key] || "").trim()).length;
  return Math.round((completed / keys.length) * 100);
}

function hasProAccess() {
  return state.subscriptionTier === "pro";
}

function projectRequiresPro(project) {
  return proProjects.has(project);
}

function setSubscriptionTier(tier) {
  state.subscriptionTier = tier === "pro" ? "pro" : "free";
  window.localStorage.setItem(storageKeys.subscriptionTier, state.subscriptionTier);
  renderAccessState();
  renderHomeDashboard();
  if (projectRequiresPro(state.project)) {
    renderToolProject(state.project);
  }
}

function renderAccessState() {
  const isPro = hasProAccess();
  elements.tierLabel.textContent = isPro ? "Pro" : "Free";
  elements.tierDetail.textContent = isPro ? "Pro tools unlocked" : "Core tools unlocked";
  elements.upgradeButton.textContent = isPro ? "Manage" : "Upgrade";

  document.querySelectorAll("[data-tier='pro']").forEach((item) => {
    item.classList.toggle("is-locked", !isPro);
    item.setAttribute("aria-label", `${item.textContent.trim()} ${isPro ? "unlocked" : "locked, Pro"}`);
  });

  document.querySelectorAll("[data-project-nav]").forEach((button) => {
    const locked = projectRequiresPro(button.dataset.projectNav) && !isPro;
    button.classList.toggle("is-locked", locked);
    if (locked) {
      button.setAttribute("aria-label", `${button.textContent.trim()} locked, Pro`);
    } else {
      button.removeAttribute("aria-label");
    }
  });
}

function showLoginScreen() {
  elements.loginScreen.classList.remove("is-hidden");
  elements.profileScreen.classList.add("is-hidden");
  elements.appShell.classList.add("is-hidden");
}

function showProfileScreen() {
  const profile = savedProfile();
  elements.profileName.value = profile?.displayName || state.userName.split("@")[0] || "";
  elements.profileCenter.value = profile?.homeCenter || "";
  elements.profileHandedness.value = profile?.handedness || "right";
  elements.profileDelivery.value = profile?.delivery || "one-handed";
  elements.profileStyle.value = profile?.bowlerStyle || "balanced";
  elements.profileLevel.value = profile?.skillLevel || "league";
  elements.profileSpeed.value = profile?.ballSpeed || "";
  elements.profileRevRate.value = profile?.revRate || "";
  elements.profileBallWeight.value = profile?.ballWeight || "";
  elements.profileAverage.value = profile?.leagueAverage || "";
  elements.profileGoals.value = profile?.goals || "";
  elements.profileError.textContent = "";
  elements.loginScreen.classList.add("is-hidden");
  elements.profileScreen.classList.remove("is-hidden");
  elements.appShell.classList.add("is-hidden");
  renderHomeCenterOptions(bowlingCenters.slice(0, 8), "Use location to populate nearby bowling centers.");
}

function showAppShell() {
  elements.loginScreen.classList.add("is-hidden");
  elements.profileScreen.classList.add("is-hidden");
  elements.appShell.classList.remove("is-hidden");
  renderAccessState();
  renderHomeDashboard();
  setProject("hub");
}

function requireLogin() {
  const savedEmail = window.localStorage.getItem(storageKeys.accountEmail);
  if (savedEmail) {
    state.userName = savedEmail;
    state.profile = savedProfile();
    state.subscriptionTier = savedSubscriptionTier();
    if (state.profile) {
      showAppShell();
    } else {
      showProfileScreen();
    }
  } else {
    showLoginScreen();
  }
}

function setAuthMode(nextMode) {
  authMode = nextMode;
  const isCreate = authMode === "create";
  elements.authTitle.textContent = isCreate ? "Create Account" : "Log In";
  elements.authSubtitle.textContent = isCreate
    ? "Set up your StrikeIQ account to open the project hub, lane-play tools, and tracking workspace."
    : "Log back in to your StrikeIQ project hub.";
  elements.authSubmit.textContent = isCreate ? "Create Account" : "Log In";
  elements.authToggle.textContent = isCreate ? "Already have an account? Log in" : "Need an account? Create one";
  elements.loginPassword.autocomplete = isCreate ? "new-password" : "current-password";
  elements.loginError.textContent = "";
}

function handleLogin(event) {
  event.preventDefault();
  const email = elements.loginEmail.value.trim().toLowerCase();
  const password = elements.loginPassword.value;

  if (!email) {
    elements.loginError.textContent = "Email address is required.";
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    elements.loginError.textContent = "Enter a valid email address.";
    return;
  }

  if (!password) {
    elements.loginError.textContent = "Password is required.";
    return;
  }

  if (password.length < 6) {
    elements.loginError.textContent = "Password must be at least 6 characters.";
    return;
  }

  if (authMode === "login") {
    const savedEmail = window.localStorage.getItem(storageKeys.accountEmail);
    if (savedEmail && savedEmail !== email) {
      elements.loginError.textContent = "No local account found for that email. Create an account first.";
      return;
    }
  }

  window.localStorage.setItem(storageKeys.accountEmail, email);
  state.userName = email;
  state.subscriptionTier = savedSubscriptionTier();
  elements.loginError.textContent = "";
  state.profile = savedProfile();
  if (authMode === "create" || !state.profile) {
    showProfileScreen();
  } else {
    showAppShell();
  }
}

function handleProfileSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const profile = formPayload(form);
  Object.keys(profile).forEach((key) => {
    profile[key] = String(profile[key] || "").trim();
  });

  if (!profile.displayName) {
    elements.profileError.textContent = "Display name is required.";
    return;
  }

  state.profile = profile;
  state.handedness = profile.handedness === "left" ? "left" : "right";
  window.localStorage.setItem(storageKeys.profile, JSON.stringify(profile));
  renderHomeDashboard();
  showAppShell();
}

function handleLogout() {
  state.userName = "";
  state.profile = null;
  elements.loginPassword.value = "";
  showLoginScreen();
  setAuthMode("login");
}

function setProject(project) {
  state.project = project;
  elements.projectHub.classList.toggle("is-hidden", project !== "hub");
  elements.patternWorkspace.classList.toggle("is-hidden", project !== "patterns");
  elements.toolWorkspace.classList.toggle("is-hidden", project === "hub" || project === "patterns");

  document.querySelectorAll("[data-project-nav]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.projectNav === project);
  });

  if (project === "patterns") {
    return;
  }

  if (project !== "hub") {
    renderToolProject(project);
  }
}

function selectedPatternSummary() {
  const pattern = state.patterns.find((item) => item.slug === state.selectedSlug);
  if (!pattern) return null;
  return {
    slug: pattern.slug,
    name: pattern.name,
    pattern_type: pattern.pattern_type,
    length_ft: pattern.length_ft,
    ratio: pattern.ratio,
    difficulty: pattern.difficulty,
    summary: pattern.summary,
    suggested_line_right: pattern.suggested_line_right,
    suggested_line_left: pattern.suggested_line_left,
    recommended_equipment: pattern.recommended_equipment,
    common_adjustments: pattern.common_adjustments,
  };
}

function renderToolProject(project) {
  const details = projectDetails[project];
  if (!details) return;
  elements.toolEyebrow.textContent = details.eyebrow;
  elements.toolTitle.textContent = details.title;
  elements.toolDescription.textContent = details.description;
  elements.toolContent.innerHTML = projectRequiresPro(project) && !hasProAccess() ? renderLockedProject(details) : details.content;
  hydrateToolProject(project);
}

function renderLockedProject(details) {
  return `
    <div class="paywall-locked">
      <span>Pro</span>
      <h3>${escapeHtml(details.title)} Is A Pro Tool</h3>
      <p>${escapeHtml(details.description)}</p>
      <button type="button" data-project="upgrade">View Upgrade Options</button>
    </div>
  `;
}

function renderHomeDashboard() {
  if (!elements.homeGreeting) return;

  const profile = state.profile || savedProfile() || {};
  const displayName = profile.displayName || state.userName.split("@")[0] || "Bowler";
  const handedness = profile.handedness === "left" ? "Left handed" : "Right handed";
  const skill = titleFromSlug(profile.skillLevel || "league");
  const delivery = titleFromSlug(profile.delivery || "one-handed");
  const style = titleFromSlug(profile.bowlerStyle || "balanced");
  const completion = profileCompletion(profile);
  const ballCount = state.balls.length;
  const spareRate = Number(state.spares.rate || 0);
  const shotCount = state.shots.length;
  const isPro = hasProAccess();

  elements.homeGreeting.textContent = `Welcome, ${displayName}`;
  elements.homeSubcopy.textContent = `${skill} bowler | ${handedness} | ${delivery} | ${profile.homeCenter || "Home center not set"}`;
  elements.homeTier.textContent = isPro ? "Pro" : "Free";
  elements.homeProfile.textContent = `${displayName}'s StrikeIQ home`;
  if (elements.homeProfileDetails) {
    const detailItems = [
      `${completion}% profile`,
      style,
      profile.ballWeight,
      profile.ballSpeed && `${profile.ballSpeed} speed`,
      profile.revRate && `${profile.revRate} rev rate`,
      profile.leagueAverage && `${profile.leagueAverage} avg`,
    ].filter(Boolean);
    elements.homeProfileDetails.innerHTML = detailItems
      .map((item) => `<span>${escapeHtml(item)}</span>`)
      .join("");
  }
  elements.homeWorkspaceCount.textContent = homeWorkspaceCount;
  elements.homeBallCount.textContent = ballCount;
  elements.homeSpareRate.textContent = `${spareRate}%`;
  elements.homeShotCount.textContent = shotCount;

  let focus = "Start by opening a section below.";
  if (completion < 80) {
    focus = "Finish your bowler profile so StrikeIQ can tune ball, pattern, spare, and AI recommendations.";
  } else if (!ballCount) {
    focus = "Build your ball database first so lane tracking and coaching can use your ball data.";
  } else if (!shotCount) {
    focus = "Open Lane Tracker to start building lane transition history.";
  } else if (!Number(state.spares.attempts || 0)) {
    focus = "Open Scoring so StrikeIQ can track conversion pressure points.";
  } else if (!isPro) {
    focus = "Core tracking is active. Friends keeps chat and feedback in one place.";
  } else {
    focus = "Your tracking base is active. Use Friends after logging lane data.";
  }
  elements.homeFocus.textContent = focus;

  const nextActions = [
    {
      project: "shots",
      title: "Lane Tracker",
      text: "Capture ball, target, breakpoint, result, and next move.",
    },
    {
      project: "balls",
      title: "Ball Database",
      text: "Create the ball data used by tracking and coaching.",
    },
    {
      project: "spares",
      title: "Scoring",
      text: "Track frames, strikes, spares, speed, and scores.",
    },
    {
      project: "chat",
      title: "Friends",
      text: "Use chat, video feedback, and coaching conversations.",
    },
  ];

  elements.homeNextActions.innerHTML = nextActions
    .map(
      (action) => `
        <button type="button" data-project="${escapeHtml(action.project)}">
          <strong>${escapeHtml(action.title)}</strong>
          <span>${escapeHtml(action.text)}</span>
        </button>
      `
    )
    .join("");

  const recentItems = [
    ...state.shots.slice(0, 2).map((shot) => ({
      label: "Shot",
      title: shot.result || "Shot logged",
      detail: [shot.pattern_name, shot.ball, shot.target].filter(Boolean).join(" | ") || "Shot details saved",
    })),
    ...(state.spares.spares || []).slice(0, 2).map((spare) => ({
      label: "Spare",
      title: spare.leave || "Spare logged",
      detail: `${spare.makes}/${spare.attempts} made${spare.ball ? ` | ${spare.ball}` : ""}`,
    })),
    ...state.balls.slice(0, 2).map((ball) => ({
      label: "Ball",
      title: [ball.brand, ball.name].filter(Boolean).join(" ") || "Ball saved",
      detail: [ball.cover, ball.surface, ball.condition].filter(Boolean).join(" | ") || "Arsenal entry",
    })),
  ].slice(0, 4);

  elements.homeRecent.innerHTML = recentItems.length
    ? recentItems
        .map(
          (item) => `
            <article>
              <span>${escapeHtml(item.label)}</span>
              <strong>${escapeHtml(item.title)}</strong>
              <p>${escapeHtml(item.detail)}</p>
            </article>
          `
        )
        .join("")
    : `<p class="empty-state">No activity yet. Add a ball, log a spare, or track a shot to build this feed.</p>`;
}

async function hydrateToolProject(project) {
  if (projectRequiresPro(project) && !hasProAccess()) {
    return;
  }

  if (project === "balls") {
    await loadBalls();
    document.querySelector("#ball-search")?.addEventListener("input", (event) => {
      state.ballFilters.search = event.target.value;
      renderBallDatabase();
    });
    document.querySelector("#ball-condition-filter")?.addEventListener("change", (event) => {
      state.ballFilters.condition = event.target.value;
      renderBallDatabase();
    });
    document.querySelector("#ball-cover-filter")?.addEventListener("change", (event) => {
      state.ballFilters.cover = event.target.value;
      renderBallDatabase();
    });
  } else if (project === "spares") {
    await loadSpares();
  } else if (project === "shots") {
    await loadBalls();
    hydrateLaneTrackerForm();
    await loadShots();
  } else if (project === "chat") {
    await loadCommunityPosts();
  } else if (project === "add-pattern") {
    const status = document.querySelector("#custom-pattern-status");
    if (status) status.textContent = "Saved patterns are stored for Lane Tracker context.";
  }
}

function formPayload(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function hydrateLaneTrackerForm() {
  const dateInput = document.querySelector("#lane-session-date");
  if (dateInput && !dateInput.value) {
    dateInput.value = todayIsoDate();
  }
  const centerInput = document.querySelector("#lane-session-center");
  if (centerInput && !centerInput.value && state.profile?.homeCenter) {
    centerInput.value = state.profile.homeCenter;
  }
  const ballOptions = document.querySelector("#lane-ball-options");
  if (ballOptions) {
    ballOptions.innerHTML = state.balls
      .map((ball) => `<option value="${escapeHtml([ball.brand, ball.name].filter(Boolean).join(" "))}"></option>`)
      .join("");
  }
}

function renderProjectList(containerId, items, emptyText, renderItem) {
  const container = document.querySelector(containerId);
  if (!container) return;
  container.innerHTML = items.length ? items.map(renderItem).join("") : `<p class="empty-state">${emptyText}</p>`;
}

async function loadBalls() {
  state.balls = await api("/api/balls");
  renderHomeDashboard();
  renderBallDatabase();
}

function ballMatchesFilters(ball) {
  const query = state.ballFilters.search.trim().toLowerCase();
  const searchable = [
    ball.brand,
    ball.name,
    ball.cover,
    ball.core,
    ball.surface,
    ball.condition,
    ball.motion,
    ball.notes,
  ].filter(Boolean).join(" ").toLowerCase();
  const matchesSearch = !query || searchable.includes(query);
  const matchesCondition = state.ballFilters.condition === "all" || ball.condition === state.ballFilters.condition;
  const matchesCover = state.ballFilters.cover === "all" || ball.cover === state.ballFilters.cover;
  return matchesSearch && matchesCondition && matchesCover;
}

function renderBallDatabase() {
  const filteredBalls = state.balls.filter(ballMatchesFilters);
  const summary = document.querySelector("#ball-summary");
  if (summary) {
    const brands = new Set(state.balls.map((ball) => ball.brand).filter(Boolean));
    const heavyOil = state.balls.filter((ball) => ball.condition === "Fresh heavy oil").length;
    const spareBalls = state.balls.filter((ball) => ball.cover === "Plastic" || ball.condition === "Spares").length;
    summary.innerHTML = `
      <span><b>${state.balls.length}</b> catalog balls</span>
      <span><b>${brands.size}</b> brands</span>
      <span><b>${heavyOil}</b> heavy oil</span>
      <span><b>${spareBalls}</b> spare options</span>
    `;
  }
  renderProjectList("#ball-list", filteredBalls, "No bowling balls match these filters.", renderBallCard);
}

function renderBallCard(ball) {
  const swatches = Array.isArray(ball.colors) && ball.colors.length
    ? `<div class="ball-swatches">${ball.colors.map((color) => `<span style="--swatch:${escapeHtml(color)}"></span>`).join("")}</div>`
    : "";
  const specs = [
    ball.cover,
    ball.core,
    ball.surface,
    ball.rg ? `RG ${ball.rg}` : "",
    ball.differential ? `Diff ${ball.differential}` : "",
  ].filter(Boolean).join(" | ");
  const meta = [
    ball.condition,
    ball.motion,
    ball.strength ? `Strength ${ball.strength}/10` : "",
  ].filter(Boolean).join(" | ");
  return `
    <article class="project-record ball-record">
      ${ball.image_url ? `<img class="ball-thumb" src="${escapeHtml(ball.image_url)}" alt="">` : `<div class="ball-thumb is-placeholder">${swatches}</div>`}
      <div>
        <strong>${escapeHtml([ball.brand, ball.name].filter(Boolean).join(" "))}</strong>
        <span>${escapeHtml(specs || "Specs pending")}</span>
        ${meta ? `<p>${escapeHtml(meta)}</p>` : ""}
        ${ball.notes ? `<small>${escapeHtml(ball.notes)}</small>` : ""}
        ${ball.research_url ? `<a class="record-link" href="${escapeHtml(ball.research_url)}" target="_blank" rel="noreferrer">Research specs</a>` : ""}
      </div>
      ${swatches && ball.image_url ? swatches : ""}
    </article>
  `;
}

function defaultSpareRow(frame) {
  return {
    frame,
    board: "",
    boardArrow: "",
    strike: "",
    firstSpeed: "",
    split: false,
    spare: "",
    spareSpeed: "",
    notes: "",
    ballChange: "",
  };
}

function defaultSpareGame(id) {
  return {
    id,
    ballUsed: "",
    spareBall: "",
    score: "",
    rows: spareFrameLabels.map(defaultSpareRow),
  };
}

function defaultSpareSession() {
  return {
    session_date: new Date().toISOString().slice(0, 10),
    alley: "",
    games: [defaultSpareGame(1), defaultSpareGame(2), defaultSpareGame(3)],
  };
}

function normalizeSpareSession(session) {
  const base = defaultSpareSession();
  if (!session) return base;
  return {
    ...base,
    ...session,
    session_date: session.session_date || session.date || base.session_date,
    games: [1, 2, 3].map((id) => {
      const sourceGame = Array.isArray(session.games) ? session.games[id - 1] || {} : {};
      return {
        ...defaultSpareGame(id),
        ...sourceGame,
        id,
        rows: spareFrameLabels.map((frame, index) => ({
          ...defaultSpareRow(frame),
          ...(Array.isArray(sourceGame.rows) ? sourceGame.rows[index] || {} : {}),
          frame,
        })),
      };
    }),
  };
}

function spareOptionList(values, selectedValue = "", placeholder = "") {
  const options = placeholder ? [`<option value="">${placeholder}</option>`] : [];
  return options.concat(values.map((value) => {
    const selected = String(value) === String(selectedValue) ? " selected" : "";
    return `<option value="${escapeHtml(value)}"${selected}>${escapeHtml(value)}</option>`;
  })).join("");
}

function spareBallOptions() {
  return state.balls.map((ball) => [ball.brand, ball.name].filter(Boolean).join(" ")).filter(Boolean);
}

function computeSpareMetrics(session) {
  const ballUsage = new Map();
  let framesLogged = 0;
  let strikes = 0;
  let spares = 0;
  let splits = 0;
  let ballChanges = 0;
  const speeds = [];
  const addBall = (ball) => {
    const value = String(ball || "").trim();
    if (value) ballUsage.set(value, (ballUsage.get(value) || 0) + 1);
  };
  session.games.forEach((game) => {
    addBall(game.ballUsed);
    addBall(game.spareBall);
    game.rows.forEach((row) => {
      const hasData = Boolean(row.board || row.boardArrow || row.strike || row.firstSpeed || row.split || row.spare || row.spareSpeed || row.notes || row.ballChange);
      if (hasData) framesLogged += 1;
      if (String(row.strike || "").trim().toUpperCase() === "X") strikes += 1;
      if (String(row.spare || "").trim() === "/") spares += 1;
      if (row.split) splits += 1;
      if (row.ballChange) {
        ballChanges += 1;
        addBall(row.ballChange);
      }
      const speed = Number(row.firstSpeed);
      if (Number.isFinite(speed) && speed > 0) speeds.push(speed);
    });
  });
  return {
    framesLogged,
    strikes,
    spares,
    splits,
    ballChanges,
    averageSpeed: speeds.length ? (speeds.reduce((sum, value) => sum + value, 0) / speeds.length).toFixed(1) : "-",
    ballUsage,
  };
}

function renderSpareSessionSummary() {
  const metrics = computeSpareMetrics(state.spareSession);
  const summary = document.querySelector("#spare-session-summary");
  if (summary) {
    summary.innerHTML = `
      <span><b>${metrics.framesLogged}</b> frames</span>
      <span><b>${metrics.strikes}</b> strikes</span>
      <span><b>${metrics.spares}</b> spares</span>
      <span><b>${metrics.splits}</b> splits</span>
      <span><b>${metrics.averageSpeed}</b> avg mph</span>
    `;
  }
}

function renderSpareSessionWorkspace() {
  if (!state.spareSession) state.spareSession = defaultSpareSession();
  const dateInput = document.querySelector("#spare-session-date");
  const alleyInput = document.querySelector("#spare-session-alley");
  if (dateInput) dateInput.value = state.spareSession.session_date || "";
  if (alleyInput) alleyInput.value = state.spareSession.alley || "";
  renderSpareSessionSummary();

  const balls = spareBallOptions();
  const games = document.querySelector("#spare-session-games");
  if (games) {
    games.innerHTML = state.spareSession.games.map((game, gameIndex) => `
      <section class="spare-game" data-spare-game="${gameIndex}">
        <div class="spare-game-header">
          <strong>Game ${game.id}</strong>
          <label>Ball used<select data-spare-field="ballUsed">${spareOptionList(balls, game.ballUsed, "Select ball")}</select></label>
          <label>Spare ball<select data-spare-field="spareBall">${spareOptionList(balls, game.spareBall, "Select spare ball")}</select></label>
          <label>Score<input data-spare-field="score" inputmode="numeric" value="${escapeHtml(game.score)}"></label>
        </div>
        <div class="spare-frame-grid">
          ${game.rows.map((row, rowIndex) => `
            <article class="spare-frame" data-spare-row="${rowIndex}">
              <b>${escapeHtml(row.frame)}</b>
              <select data-spare-row-field="board" aria-label="Board">${spareOptionList(spareBoards, row.board, "Board")}</select>
              <input data-spare-row-field="strike" value="${escapeHtml(row.strike)}" maxlength="1" placeholder="X">
              <select data-spare-row-field="firstSpeed" aria-label="First speed">${spareOptionList(spareSpeeds, row.firstSpeed, "MPH")}</select>
              <label class="spare-check"><input type="checkbox" data-spare-row-field="split"${row.split ? " checked" : ""}> Split</label>
              <input data-spare-row-field="spare" value="${escapeHtml(row.spare)}" maxlength="1" placeholder="/">
              <select data-spare-row-field="spareSpeed" aria-label="Spare speed">${spareOptionList(spareSpeeds, row.spareSpeed, "Spare MPH")}</select>
              <input data-spare-row-field="ballChange" value="${escapeHtml(row.ballChange)}" placeholder="Ball change">
              <textarea data-spare-row-field="notes" placeholder="Notes">${escapeHtml(row.notes)}</textarea>
            </article>
          `).join("")}
        </div>
      </section>
    `).join("");
  }
}

function bindSpareSessionControls() {
  document.querySelector("#spare-session-date")?.addEventListener("input", (event) => {
    state.spareSession.session_date = event.target.value;
  });
  document.querySelector("#spare-session-alley")?.addEventListener("input", (event) => {
    state.spareSession.alley = event.target.value;
  });
  document.querySelector("#spare-session-games")?.addEventListener("input", handleSpareSessionInput);
  document.querySelector("#spare-session-games")?.addEventListener("change", handleSpareSessionInput);
  document.querySelector("#save-spare-session")?.addEventListener("click", saveSpareSession);
  document.querySelector("#reset-spare-session")?.addEventListener("click", () => {
    state.spareSession = defaultSpareSession();
    renderSpareSessionWorkspace();
    bindSpareSessionControls();
  });
}

function handleSpareSessionInput(event) {
  const gameElement = event.target.closest("[data-spare-game]");
  if (!gameElement) return;
  const game = state.spareSession.games[Number(gameElement.dataset.spareGame)];
  const field = event.target.dataset.spareField;
  if (field) {
    game[field] = event.target.value;
  }
  const rowField = event.target.dataset.spareRowField;
  if (rowField) {
    const rowElement = event.target.closest("[data-spare-row]");
    const row = game.rows[Number(rowElement.dataset.spareRow)];
    row[rowField] = event.target.type === "checkbox" ? event.target.checked : event.target.value;
  }
  renderSpareSessionSummary();
}

async function saveSpareSession() {
  const status = document.querySelector("#spare-session-status");
  if (status) status.textContent = "Saving spare session...";
  const response = await api("/api/spare-sessions", { method: "POST", body: JSON.stringify(state.spareSession) });
  state.spareSessions = response.sessions || [];
  state.spareSession = normalizeSpareSession(response.latest);
  if (status) status.textContent = "Spare session saved.";
  renderSpareSessionWorkspace();
  renderSpareSessionList();
  renderHomeDashboard();
  bindSpareSessionControls();
}

function renderSpareSessionList() {
  renderProjectList("#spare-session-list", state.spareSessions, "No full spare sessions saved yet.", (session) => {
    const metrics = session.metrics || {};
    return `
      <article class="project-record">
        <strong>${escapeHtml(session.session_date)}${session.alley ? ` | ${escapeHtml(session.alley)}` : ""}</strong>
        <span>${metrics.frames_logged || 0} frames | ${metrics.strikes || 0} strikes | ${metrics.spares || 0} spares | ${metrics.splits || 0} splits</span>
        <small>Average speed: ${escapeHtml(metrics.average_speed ?? "-")} mph</small>
      </article>
    `;
  });
}

async function loadSpares() {
  state.spares = await api("/api/spares");
  const sessions = await api("/api/spare-sessions");
  state.spareSessions = sessions.sessions || [];
  state.spareSession = normalizeSpareSession(sessions.latest || state.spareSession);
  renderHomeDashboard();
  renderSpareSessionWorkspace();
  renderSpareSessionList();
  bindSpareSessionControls();
  const summary = document.querySelector("#spare-summary");
  if (summary) {
    summary.innerHTML = `
      <span><b>${state.spares.makes}</b> makes</span>
      <span><b>${state.spares.attempts}</b> attempts</span>
      <span><b>${state.spares.rate}%</b> conversion</span>
    `;
  }
  renderProjectList("#spare-list", state.spares.spares, "No spare logs saved yet.", (spare) => `
    <article class="project-record">
      <strong>${escapeHtml(spare.leave)}</strong>
      <span>${spare.makes}/${spare.attempts} | ${escapeHtml(spare.ball || "Ball not set")}</span>
      ${spare.notes ? `<p>${escapeHtml(spare.notes)}</p>` : ""}
      <small>${escapeHtml(spare.created_at)}</small>
    </article>
  `);
}

async function loadShots() {
  state.shots = await api("/api/shots");
  renderHomeDashboard();
  hydrateLaneTrackerForm();
  const summary = document.querySelector("#lane-summary");
  if (summary) {
    const strikes = state.shots.filter((shot) => String(shot.result || "").toLowerCase().includes("strike")).length;
    const leaves = state.shots
      .map((shot) => shot.leave_pin)
      .filter(Boolean)
      .reduce((acc, leave) => {
        acc[leave] = (acc[leave] || 0) + 1;
        return acc;
      }, {});
    const commonLeave = Object.entries(leaves).sort((a, b) => b[1] - a[1])[0]?.[0] || "No leaves logged";
    const latest = state.shots[0];
    summary.innerHTML = `
      <span><b>${state.shots.length}</b> shots</span>
      <span><b>${strikes}</b> strikes</span>
      <span><b>${escapeHtml(commonLeave)}</b> common leave</span>
      <span><b>${escapeHtml(latest?.lane_center || state.profile?.homeCenter || "Center not set")}</b> latest center</span>
    `;
  }
  renderProjectList("#shot-list", state.shots, "No lane entries logged yet.", (shot) => `
    <article class="project-record">
      <strong>${escapeHtml(shot.result)}</strong>
      <span>${escapeHtml([shot.session_date, shot.lane_center, shot.lane_number && `Lane ${shot.lane_number}`].filter(Boolean).join(" | ") || "Session not set")}</span>
      <p>${escapeHtml([shot.ball || "Ball not set", shot.pattern_name || "No pattern", shot.lane_condition].filter(Boolean).join(" | "))}</p>
      <p>${escapeHtml([
        shot.feet_board && `Feet ${shot.feet_board}`,
        shot.arrows_board && `Arrows ${shot.arrows_board}`,
        shot.target && `Target ${shot.target}`,
        shot.breakpoint && `Breakpoint ${shot.breakpoint}`,
        shot.ball_speed && `${shot.ball_speed}`
      ].filter(Boolean).join(" | ") || "Target not set")}</p>
      ${shot.leave_pin || shot.miss_direction ? `<p>${escapeHtml([shot.miss_direction && `Miss ${shot.miss_direction}`, shot.leave_pin && `Leave ${shot.leave_pin}`].filter(Boolean).join(" | "))}</p>` : ""}
      ${shot.adjustment ? `<p><b>Adjustment:</b> ${escapeHtml(shot.adjustment)}</p>` : ""}
      ${shot.next_move ? `<p><b>Next move:</b> ${escapeHtml(shot.next_move)}</p>` : ""}
      ${shot.notes ? `<small>${escapeHtml(shot.notes)}</small>` : ""}
    </article>
  `);
}

function renderChat() {
  const channelList = document.querySelector("#chat-channel-list");
  const channelSelect = document.querySelector("#community-channel");
  const activeTitle = document.querySelector("#active-channel-title");
  if (channelList) {
    channelList.innerHTML = chatChannels
      .map(
        ([channel, description]) => `
          <button type="button" class="${channel === state.chatChannel ? "is-active" : ""}" data-chat-channel="${escapeHtml(channel)}">
            <strong>${escapeHtml(channel)}</strong>
            <span>${escapeHtml(description)}</span>
          </button>
        `
      )
      .join("");
  }
  if (channelSelect) {
    channelSelect.innerHTML = chatChannels
      .map(([channel]) => `<option value="${escapeHtml(channel)}">${escapeHtml(channel)}</option>`)
      .join("");
    channelSelect.value = state.chatChannel;
  }
  if (activeTitle) {
    activeTitle.textContent = state.chatChannel;
  }

  renderCommunityPosts();
  renderProjectList("#chat-list", state.chat, "No coach messages yet.", (message) => `
    <article class="project-record ${message.role === "user" ? "is-user" : ""}">
      <strong>${message.role === "user" ? "You" : "Coach"}</strong>
      <p>${escapeHtml(message.text)}</p>
    </article>
  `);
}

function renderCommunityPosts() {
  const container = document.querySelector("#community-feed");
  if (!container) return;

  const visiblePosts = state.communityPosts.filter((post) => post.channel === state.chatChannel);
  container.innerHTML = visiblePosts.length
    ? visiblePosts
        .map(
          (post) => `
            <article class="community-post">
              <div>
                <span>${escapeHtml(post.user_name || "StrikeIQ member")}</span>
                <strong>${escapeHtml(post.title || "Untitled video")}</strong>
              </div>
              ${post.shot_type ? `<p class="community-meta">Shot type: ${escapeHtml(post.shot_type)}</p>` : ""}
              ${post.feedback_request ? `<p>${escapeHtml(post.feedback_request)}</p>` : ""}
              ${post.video_url ? `<a href="${escapeHtml(post.video_url)}" target="_blank" rel="noopener">Open Video</a>` : ""}
              ${post.video_name && !post.video_url ? `<small>${escapeHtml(post.video_name)}</small>` : ""}
              <small>${escapeHtml(post.created_at || "")}</small>
            </article>
          `
        )
        .join("")
    : `<p class="empty-state">No posts in ${escapeHtml(state.chatChannel)} yet.</p>`;
}

async function loadCommunityPosts() {
  state.communityPosts = await api("/api/chat/posts");
  renderChat();
}

function externalSearchUrl(ref, pattern) {
  const url = ref.pattern_page_url || ref.search_url || ref.source_home_url;
  if (!url) {
    return "";
  }

  const separator = url.includes("?") ? "&" : "?";
  const searchTerm = encodeURIComponent(pattern.name.replace(/\s+Style$/i, ""));
  return ref.pattern_page_url ? url : `${url}${separator}q=${searchTerm}`;
}

function paramsFromFilters() {
  const params = new URLSearchParams();
  const values = {
    source: elements.source.value,
    type: elements.type.value,
    length: elements.length.value,
    difficulty: elements.difficulty.value,
    tag: elements.tag.value,
  };

  Object.entries(values).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  return params;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

async function loadSources() {
  const currentValue = elements.source.value;
  let sources = [];
  try {
    sources = await api("/api/sources");
  } catch {
    elements.source.innerHTML = `<option value="">All sources</option>`;
    return;
  }

  elements.source.innerHTML = [
    `<option value="">All sources (${sources.reduce((sum, source) => sum + source.pattern_count, 0)})</option>`,
    ...sources.map(
      (source) =>
        `<option value="${escapeHtml(source.source_name)}">${escapeHtml(source.source_name)} (${source.pattern_count})</option>`
    ),
  ].join("");

  if (sources.some((source) => source.source_name === currentValue)) {
    elements.source.value = currentValue;
  }
}

function syncMobileFilterState() {
  const drawer = document.querySelector(".filter-drawer");
  if (!drawer) {
    return;
  }
  drawer.open = !window.matchMedia("(max-width: 760px)").matches;
}

async function loadTags() {
  const tags = await api("/api/tags");
  elements.tag.insertAdjacentHTML(
    "beforeend",
    tags
      .filter((tag) => tag.pattern_count > 0)
      .map(
        (tag) =>
          `<option value="${escapeHtml(tag.name)}">${escapeHtml(tag.name)} (${tag.pattern_count})</option>`
      )
      .join("")
  );
}

async function loadPatternTypes() {
  const currentValue = elements.type.value;
  const types = await api("/api/pattern-types");
  elements.type.innerHTML = [
    `<option value="">All available types (${types.reduce((sum, type) => sum + type.pattern_count, 0)})</option>`,
    ...types.map(
      (type) =>
        `<option value="${escapeHtml(type.pattern_type)}">${escapeHtml(type.label)} (${type.pattern_count})</option>`
    ),
  ].join("");

  if (types.some((type) => type.pattern_type === currentValue)) {
    elements.type.value = currentValue;
  }
}

async function loadPatterns() {
  const params = paramsFromFilters();
  const query = params.toString() ? `?${params}` : "";
  state.patterns = await api(`/api/patterns${query}`);
  renderHomeDashboard();
  renderCards();

  if (state.patterns.length && !state.patterns.some((pattern) => pattern.slug === state.selectedSlug)) {
    selectPattern(state.patterns[0].slug);
  }

  if (!state.patterns.length) {
    elements.detail.innerHTML = `<p class="empty-state">No patterns match these filters.</p>`;
  }
}

async function loadSyncSummary() {
  const summary = await api("/api/sync/summary");
  renderSyncSummary(summary);
}

async function loadImportQueue() {
  const queue = await api("/api/imports");
  renderImportQueue(queue);
}

async function loadCatalogStatus() {
  const catalog = await api("/api/catalog/status");
  renderCatalogStatus(catalog);
}

function renderCatalogStatus(catalog) {
  const kegel = catalog.sources.find((source) => source.source_name === "Kegel Pattern Library");
  const imported = catalog.sources.reduce((sum, source) => sum + Number(source.imported_count || 0), 0);
  const official = catalog.sources.reduce((sum, source) => sum + Number(source.official_count || 0), 0) || imported;
  const remaining = catalog.sources.reduce((sum, source) => sum + Number(source.remaining_count || 0), 0);

  elements.catalogState.textContent = `${imported}/${official}`;
  elements.catalogState.classList.toggle("needs-review", remaining > 0);

  elements.catalogSummary.innerHTML = `
    <div class="sync-grid catalog-grid">
      <span><b>${imported}</b> imported</span>
      <span><b>${official}</b> official</span>
      <span><b>${remaining}</b> remaining</span>
    </div>
    <p>${escapeHtml(kegel?.source_note || "Catalog coverage is tracked from official source references.")}</p>
    <div class="sync-checks source-checks">
      ${catalog.sources.map((source) => `
        <article>
          <strong>${escapeHtml(source.source_name)}</strong>
          <span>${Number(source.imported_count || 0)}/${Number(source.official_count || 0)} queued or imported</span>
        </article>
      `).join("")}
    </div>
    ${catalog.backlog.length ? `
      <div class="sync-checks">
        ${catalog.backlog.slice(0, 5).map((item) => `
          <article>
            <strong>${escapeHtml(item.pattern_name)}</strong>
            <span>${escapeHtml(item.source_name)} | ${escapeHtml(item.import_status)}</span>
          </article>
        `).join("")}
      </div>
    ` : `<p class="empty-state">No backlog items.</p>`}
  `;
}

function renderImportQueue(queue) {
  elements.importState.textContent = `${queue.pending} pending`;
  elements.importState.classList.toggle("needs-review", queue.pending > 0);

  if (!queue.imports.length) {
    elements.importSummary.innerHTML = `<p class="empty-state">No imported files queued.</p>`;
    return;
  }

  elements.importSummary.innerHTML = `
    <div class="sync-checks import-checks">
      ${queue.imports.slice(0, 5).map(renderImportItem).join("")}
    </div>
  `;
}

function renderImportItem(item) {
  return `
    <article>
      <strong>${escapeHtml(item.extracted_name || item.file_name)}</strong>
      <span>${escapeHtml(item.review_status)} | ${escapeHtml(item.matched_pattern_name || "unmatched")}</span>
      <span>${[
        item.extracted_length_ft && `${item.extracted_length_ft} ft`,
        item.extracted_volume_ml && `${item.extracted_volume_ml} ml`,
        item.extracted_ratio && `ratio ${item.extracted_ratio}`,
      ].filter(Boolean).map(escapeHtml).join(" | ")}</span>
      ${item.review_status === "pending" ? `
        <div class="mini-actions">
          <button type="button" data-import-status="approved" data-import-id="${item.id}">Approve</button>
          <button type="button" data-import-status="rejected" data-import-id="${item.id}">Reject</button>
        </div>
      ` : ""}
    </article>
  `;
}

function renderSyncSummary(summary) {
  const latest = summary.latest_run;
  const status = latest ? latest.status : "not run";
  elements.syncState.textContent = summary.needs_review ? `${summary.needs_review} review` : status;
  elements.syncState.classList.toggle("needs-review", summary.needs_review > 0);

  elements.syncSummary.innerHTML = `
    <div class="sync-grid">
      <span><b>${summary.linked_refs}</b> linked</span>
      <span><b>${summary.total_refs}</b> refs</span>
      <span><b>${summary.needs_review}</b> review</span>
    </div>
    <p>${latest ? escapeHtml(latest.message || "Sync complete.") : "No sync run yet."}</p>
    ${latest?.finished_at ? `<small>Last checked ${escapeHtml(latest.finished_at)}</small>` : ""}
    ${summary.needs_review ? renderRecentChecks(summary.recent_checks) : ""}
  `;
}

function renderRecentChecks(checks) {
  if (!checks?.length) {
    return `<p class="empty-state">No link checks recorded.</p>`;
  }

  return `
    <div class="sync-checks">
      ${checks.slice(0, 4).map((check) => `
        <article>
          <strong>${escapeHtml(check.name)}</strong>
          <span>${escapeHtml(check.url_type)} | ${check.http_status || "error"}${check.needs_review ? " | review" : ""}</span>
        </article>
      `).join("")}
    </div>
  `;
}

function renderCards() {
  elements.patterns.innerHTML = state.patterns
    .map(
      (pattern) => `
        <button class="card ${pattern.slug === state.selectedSlug ? "active" : ""}" type="button" data-slug="${escapeHtml(pattern.slug)}">
          <h3>${escapeHtml(pattern.name)}</h3>
          <p>${escapeHtml(pattern.summary)}</p>
          <div class="meta">
            <span class="pill">${pattern.length_ft} ft</span>
            ${pattern.volume_ml ? `<span class="pill">${pattern.volume_ml} mL</span>` : ""}
            <span class="pill">${escapeHtml(pattern.pattern_type)}</span>
            <span class="pill difficulty-${pattern.difficulty}">Difficulty ${pattern.difficulty}</span>
          </div>
        </button>
      `
    )
    .join("");
}

async function selectPattern(slug) {
  if (state.selectedSlug !== slug) {
    state.targetPath = null;
  }
  state.selectedSlug = slug;
  renderCards();

  const pattern = await api(`/api/patterns/${slug}`);
  renderDetail(pattern);
}

function renderDetail(pattern) {
  disposeLaneVisual();
  const handednessLabel = state.handedness === "left" ? "Left" : "Right";
  const selectedLine = state.handedness === "left" ? pattern.suggested_line_left : pattern.suggested_line_right;
  const oppositeLine = state.handedness === "left" ? pattern.suggested_line_right : pattern.suggested_line_left;
  const selectedTarget = state.handedness === "left"
    ? pattern.lane_intelligence?.target_window_left
    : pattern.lane_intelligence?.target_window_right;
  const oppositeTarget = state.handedness === "left"
    ? pattern.lane_intelligence?.target_window_right
    : pattern.lane_intelligence?.target_window_left;

  elements.detail.innerHTML = `
    <div class="detail-title">
      <div>
        <h2>${escapeHtml(pattern.name)}</h2>
        <p class="empty-state">${escapeHtml(pattern.organization || "Reference pattern")}</p>
      </div>
      <span class="pill difficulty-${pattern.difficulty}">Difficulty ${pattern.difficulty}</span>
    </div>

    <div class="chips">
      <span class="chip">${pattern.length_ft} ft</span>
      ${pattern.volume_ml ? `<span class="chip">${pattern.volume_ml} mL</span>` : ""}
      <span class="chip">${escapeHtml(pattern.pattern_type)}</span>
      ${pattern.ratio ? `<span class="chip">${escapeHtml(pattern.ratio)}</span>` : ""}
      ${pattern.tags.map((tag) => `<span class="chip">${escapeHtml(tag)}</span>`).join("")}
    </div>

    <div class="handedness-bar" aria-label="Bowler handedness">
      <span>Bowler view</span>
      <div class="lane-control-group" role="group" aria-label="Bowler handedness">
        <button type="button" data-handedness="right" class="${state.handedness === "right" ? "active" : ""}">Right</button>
        <button type="button" data-handedness="left" class="${state.handedness === "left" ? "active" : ""}">Left</button>
      </div>
    </div>

    <section class="quick-read" aria-label="Pattern quick read">
      <article>
        <strong>Play</strong>
        <span>${escapeHtml(pattern.play_strategy)}</span>
      </article>
      <article>
        <strong>${handednessLabel} Line</strong>
        <span>${escapeHtml(selectedLine)}</span>
      </article>
      <article>
        <strong>${handednessLabel} Target</strong>
        <span>${escapeHtml(selectedTarget || selectedLine)}</span>
      </article>
      <article>
        <strong>Ball</strong>
        <span>${escapeHtml(pattern.recommended_equipment)}</span>
      </article>
    </section>

    <details class="inline-details compare-lines">
      <summary>Compare opposite-handed line</summary>
      <div class="intelligence-list">
        ${renderIntelligenceItem([state.handedness === "left" ? "Right Line" : "Left Line", oppositeLine])}
        ${renderIntelligenceItem([state.handedness === "left" ? "Right Target" : "Left Target", oppositeTarget || oppositeLine])}
      </div>
    </details>

    <section class="section lane-visual-section">
      <div class="section-heading">
        <div>
          <h3>Lane Map</h3>
          <p>Single down-lane view with oil shape, boards, target path, and lane references.</p>
        </div>
      </div>
      <div class="lane-controls lane-controls-minimal" aria-label="Lane view controls">
        <span>Lane View</span>
        <button type="button" data-lane-reset title="Reset lane view">Reset View</button>
      </div>
      ${renderTargetPathControls(pattern)}
      <div class="lane-visual" id="lane-visual" aria-label="3D oil pattern map"></div>
      <div class="lane-legend">
        <span><i class="legend-oil"></i>Light to heavy oil</span>
        <span><i class="legend-foul"></i>Foul line</span>
        <span><i class="legend-breakpoint"></i>Breakpoint</span>
        <span><i class="legend-path"></i>Target path</span>
        <span><i class="legend-dimension"></i>Dimensions</span>
      </div>
      <p class="lane-accuracy-note">Oil map uses imported length, board zones, and source volume where available; exact machine graphs require official PDF/KOSI import.</p>
      ${renderLaneBreakdown(pattern)}
    </section>

    ${renderLaneIntelligence(pattern.lane_intelligence)}

    ${renderExternalRefs(pattern)}

    ${renderPlayProfile(pattern.play_profile)}

    <details class="section detail-section">
      <summary>Equipment and Adjustments</summary>
      <p>${escapeHtml(pattern.recommended_equipment)}</p>
      <div class="advanced-list">
        ${pattern.equipment_options.map(renderEquipmentOption).join("") || `<p class="empty-state">No advanced equipment options yet.</p>`}
      </div>
      <h3>Adjustments</h3>
      <p>${escapeHtml(pattern.common_adjustments)}</p>
    </details>

    <details class="section detail-section">
      <summary>Transition Plan</summary>
      <div class="advanced-list">
        ${pattern.transitions.map(renderTransition).join("") || `<p class="empty-state">No transition plan yet.</p>`}
      </div>
    </details>

    <details class="section detail-section">
      <summary>Oil Zones</summary>
      <div class="lane">
        ${pattern.zones.map(renderZone).join("") || `<p class="empty-state">No zone data yet.</p>`}
      </div>
    </details>

    <details class="section detail-section">
      <summary>Your Notes</summary>
      <form class="note-form" id="note-form">
        <div class="form-row">
          <input name="lane_center" placeholder="Lane center">
          <input name="ball_used" placeholder="Ball used">
        </div>
        <div class="form-row">
          <input name="starting_line" placeholder="Starting line">
          <input name="score" type="number" min="0" max="300" placeholder="Score">
        </div>
        <textarea name="note" required placeholder="What worked on this pattern?"></textarea>
        <button type="submit">Save note</button>
      </form>
      <div id="notes">${renderNotes(pattern.notes)}</div>
    </details>
  `;

  renderLaneVisual(pattern, state.handedness);
  bindTargetPathControls(pattern);
  document.querySelectorAll("[data-handedness]").forEach((button) => {
    button.addEventListener("click", () => {
      state.handedness = button.dataset.handedness;
      state.targetPath = null;
      renderDetail(pattern);
    });
  });
  document.querySelector("#note-form").addEventListener("submit", (event) => saveNote(event, pattern.slug));
  document.querySelector("[data-kegel-ref-form]")?.addEventListener("submit", (event) => saveKegelReference(event, pattern.slug));
}

function defaultTargetPath(pattern, handedness = state.handedness) {
  const breakpointBoard = getBreakpointBoard(pattern, handedness);
  return {
    releaseBoard: getLaunchBoard(pattern, breakpointBoard, handedness),
    arrowsBoard: Math.round((getLaunchBoard(pattern, breakpointBoard, handedness) + breakpointBoard) / 2),
    breakpointBoard,
  };
}

function activeTargetPath(pattern) {
  if (!state.targetPath) {
    return defaultTargetPath(pattern);
  }
  return {
    releaseBoard: state.targetPath.releaseBoard,
    arrowsBoard: state.targetPath.arrowsBoard,
    breakpointBoard: state.targetPath.breakpointBoard,
  };
}

function renderTargetPathControls(pattern) {
  const defaults = defaultTargetPath(pattern);
  const values = activeTargetPath(pattern);
  return `
    <details class="target-path-panel">
      <summary>Custom Target Path</summary>
      <div class="target-path-grid" aria-label="Custom target path controls">
        <label>
          Release board
          <input data-target-path="releaseBoard" type="number" min="1" max="40" step="1" value="${Math.round(values.releaseBoard)}">
        </label>
        <label>
          Arrows board
          <input data-target-path="arrowsBoard" type="number" min="1" max="40" step="1" value="${Math.round(values.arrowsBoard)}">
        </label>
        <label>
          Breakpoint board
          <input data-target-path="breakpointBoard" type="number" min="1" max="40" step="1" value="${Math.round(values.breakpointBoard)}">
        </label>
        <button type="button" data-target-path-reset>Use Estimate</button>
      </div>
      <p>Boards are visual lane boards 1-40 for the selected ${state.handedness === "left" ? "left" : "right"}-handed view. Estimate: release ${Math.round(defaults.releaseBoard)}, arrows ${Math.round(defaults.arrowsBoard)}, breakpoint ${Math.round(defaults.breakpointBoard)}.</p>
    </details>
  `;
}

function bindTargetPathControls(pattern) {
  const panel = document.querySelector(".target-path-panel");
  if (!panel) {
    return;
  }

  let redrawTimer = 0;
  const redraw = () => {
    window.clearTimeout(redrawTimer);
    redrawTimer = window.setTimeout(() => {
      disposeLaneVisual();
      renderLaneVisual(pattern, state.handedness);
    }, 120);
  };

  panel.querySelectorAll("[data-target-path]").forEach((input) => {
    input.addEventListener("input", () => {
      const current = activeTargetPath(pattern);
      current[input.dataset.targetPath] = clamp(Number(input.value) || current[input.dataset.targetPath], 1, 40);
      state.targetPath = current;
      redraw();
    });
  });

  panel.querySelector("[data-target-path-reset]")?.addEventListener("click", () => {
    state.targetPath = null;
    panel.querySelectorAll("[data-target-path]").forEach((input) => {
      input.value = Math.round(defaultTargetPath(pattern)[input.dataset.targetPath]);
    });
    redraw();
  });
}

function renderLaneBreakdown(pattern) {
  const oilLength = Math.max(0, Math.min(60, Number(pattern.length_ft) || 0));
  const backendStart = Math.max(0, 60 - 15);
  const zones = [
    ["Approach", "Before 0 ft", "Where the bowler sets up and walks before release."],
    ["Foul Line", "0 ft", "The start of the measured lane and the legal release boundary."],
    ["Heads", "0-15 ft", "Front part of the lane. Ball speed, launch direction, and early friction show up here."],
    ["Arrows", "15 ft", "Primary visual target area used by most bowlers."],
    ["Midlane", "15-45 ft", "The ball transitions from skid toward hook. Oil volume and track friction matter here."],
    ["Oil End", `${oilLength} ft`, "Pattern breakpoint reference. This is where the loaded oil pattern stops, not where the lane stops."],
    ["Backend", `${backendStart}-60 ft`, "Last 15 feet before the head pin. This is where downlane motion and entry angle show."],
    ["Pin Deck", "60 ft+", "Area behind the head pin where the full pin rack sits."],
    ["Channels", "Both sides", "Gutters outside the playable lane boards."],
  ];

  return `
    <details class="lane-breakdown">
      <summary>
        <span>Lane Breakdown</span>
        <small>Open full lane anatomy</small>
      </summary>
      <div class="lane-breakdown-grid">
        <div class="lane-anatomy" aria-label="Bowling lane anatomy diagram">
          <div class="anatomy-channel left">Channel</div>
          <div class="anatomy-lane">
            <div class="anatomy-zone pin-deck">
              <span>Pin Deck</span>
              <div class="mini-pins" aria-hidden="true">
                <i data-pin="7">7</i><i data-pin="8">8</i><i data-pin="9">9</i><i data-pin="10">10</i>
                <i data-pin="4">4</i><i data-pin="5">5</i><i data-pin="6">6</i>
                <i data-pin="2">2</i><i data-pin="3">3</i>
                <i data-pin="1">1</i>
              </div>
            </div>
            <div class="anatomy-zone backend"><span>Backend</span><small>45-60 ft</small></div>
            <div class="anatomy-zone midlane"><span>Midlane</span><small>15-45 ft</small></div>
            <div class="anatomy-zone heads">
              <span>Heads</span><small>0-15 ft</small>
              <div class="mini-arrows" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
              <div class="mini-dots" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
            </div>
            <div class="anatomy-foul">Foul Line</div>
            <div class="anatomy-approach">Approach</div>
          </div>
          <div class="anatomy-channel right">Channel</div>
        </div>
        <div class="lane-breakdown-list">
          ${zones
            .map(
              ([name, range, description]) => `
                <article>
                  <strong>${escapeHtml(name)}</strong>
                  <span>${escapeHtml(range)}</span>
                  <p>${escapeHtml(description)}</p>
                </article>
              `
            )
            .join("")}
        </div>
      </div>
    </details>
  `;
}

function renderLaneIntelligence(intelligence) {
  if (!intelligence) {
    return "";
  }

  const primaryItems = [
    ["Oil Shape", intelligence.oil_shape],
    ["Volume", intelligence.volume_class],
    ["Friction", intelligence.friction_expectation],
    ["Scoring", intelligence.scoring_pace],
  ];
  const advancedItems = [
    ["Right Target", intelligence.target_window_right],
    ["Left Target", intelligence.target_window_left],
    ["Breakpoint", intelligence.breakpoint_window],
    ["Miss Risk", intelligence.miss_risk],
    ["First Move", intelligence.first_move_trigger],
    ["Surface", intelligence.surface_guidance],
    ["Practice", intelligence.practice_focus],
  ];

  return `
    <section class="section intelligence-section">
      <h3>Lane Intelligence</h3>
      <div class="intelligence-grid">
        ${primaryItems.map(renderIntelligenceItem).join("")}
      </div>
      <details class="inline-details">
        <summary>Target windows and move triggers</summary>
        <div class="intelligence-list">
          ${advancedItems.map(renderIntelligenceItem).join("")}
        </div>
      </details>
    </section>
  `;
}

function renderIntelligenceItem([label, value]) {
  return `
    <article class="intelligence-item">
      <strong>${escapeHtml(label)}</strong>
      <span>${escapeHtml(value)}</span>
    </article>
  `;
}

function renderExternalRefs(pattern) {
  const refs = pattern.external_refs || [];
  if (!refs.length) {
    return "";
  }

  return `
    <details class="section detail-section">
      <summary>Official References</summary>
      <div class="advanced-list">
        ${refs.map((ref) => renderExternalRef(ref, pattern)).join("")}
      </div>
    </details>
  `;
}

function renderExternalRef(ref, pattern) {
  const lookupUrl = externalSearchUrl(ref, pattern);
  const isKegel = ref.source_name.toLowerCase().includes("kegel");
  const sourceLabel = isKegel ? "Open Kegel lookup" : "Open source page";
  return `
    <article class="advanced-card source-card">
      <div class="advanced-card-title">
        <strong>${escapeHtml(ref.source_name)}</strong>
        <span>Official Source</span>
      </div>
      <p>${escapeHtml(ref.reference_note)}</p>
      <div class="source-actions">
        <a href="${escapeHtml(lookupUrl)}" target="_blank" rel="noopener">${sourceLabel}</a>
        ${ref.pattern_page_url ? `<a href="${escapeHtml(ref.pattern_page_url)}" target="_blank" rel="noopener">Pattern page</a>` : ""}
        ${ref.pdf_url ? `<a href="${escapeHtml(ref.pdf_url)}" target="_blank" rel="noopener">PDF</a>` : ""}
        ${ref.download_url ? `<a href="${escapeHtml(ref.download_url)}" target="_blank" rel="noopener">Download</a>` : ""}
        ${ref.kosi_url ? `<a href="${escapeHtml(ref.kosi_url)}" target="_blank" rel="noopener">KOSI</a>` : ""}
      </div>
      ${isKegel ? `
      <form class="source-form" data-kegel-ref-form>
        <label>
          Kegel pattern page
          <input name="pattern_page_url" type="url" placeholder="https://patternlibrary.kegel.net/..." value="${escapeHtml(ref.pattern_page_url || "")}">
        </label>
        <label>
          Official PDF
          <input name="pdf_url" type="url" placeholder="https://..." value="${escapeHtml(ref.pdf_url || "")}">
        </label>
        <label>
          KOSI file
          <input name="kosi_url" type="url" placeholder="https://..." value="${escapeHtml(ref.kosi_url || "")}">
        </label>
        <button type="submit">Save Kegel refs</button>
      </form>
      ` : ""}
    </article>
  `;
}

function disposeLaneVisual() {
  if (!state.laneVisual) {
    return;
  }

  cancelAnimationFrame(state.laneVisual.frame);
  state.laneVisual.resizeObserver.disconnect();
  state.laneVisual.cleanups?.forEach((cleanup) => cleanup());
  state.laneVisual.renderer.dispose();
  state.laneVisual.scene.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => material.dispose());
      } else {
        object.material.dispose();
      }
    }
  });
  state.laneVisual = null;
}

function renderLaneVisual(pattern, handedness = "right") {
  const container = document.querySelector("#lane-visual");
  if (!container) {
    return;
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030507);
  scene.fog = new THREE.Fog(0x030507, 13, 28);

  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
  camera.position.set(0, 9.1, 15.4);
  camera.lookAt(0, 0, -0.7);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const laneWidth = 4.2;
  const laneLength = 18;
  const approachLength = 2.1;
  const pinDeckLength = 1.2;
  const feetToZ = (feet) => laneLength / 2 - (Math.max(0, Math.min(60, feet)) / 60) * laneLength;
  const boardToX = (board) => -laneWidth / 2 + ((Math.max(1, Math.min(40, board)) - 0.5) / 40) * laneWidth;
  const laneRoot = new THREE.Group();
  const oilGroup = new THREE.Group();
  const markerGroup = new THREE.Group();
  const labelGroup = new THREE.Group();
  const pathGroup = new THREE.Group();
  scene.add(laneRoot);

  scene.add(new THREE.HemisphereLight(0xffe6bd, 0x07101c, 1.20));

  const keyLight = new THREE.DirectionalLight(0xfff1d0, 2.35);
  keyLight.position.set(3.5, 8.4, 5.4);
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0x4cc9f0, 2.4, 18);
  fillLight.position.set(-2.4, 3.4, 5);
  scene.add(fillLight);

  const pinDeckGlow = new THREE.PointLight(0xffd9a5, 1.8, 9);
  pinDeckGlow.position.set(0, 2.4, -7.8);
  scene.add(pinDeckGlow);

  laneRoot.add(oilGroup, markerGroup, labelGroup, pathGroup);
  addApproach(laneRoot, laneWidth, laneLength, approachLength);
  addLaneSurface(laneRoot, laneWidth, laneLength, boardToX);
  addLaneKickbacks(laneRoot, laneWidth, laneLength);
  addPinDeck(laneRoot, laneWidth, laneLength, pinDeckLength);
  addLaneBoards(laneRoot, laneWidth, laneLength, boardToX);
  addGutters(laneRoot, laneWidth, laneLength);
  addFoulLine(laneRoot, laneWidth, feetToZ);
  addApproachDots(markerGroup, laneWidth, laneLength, approachLength);
  addArrows(markerGroup, boardToX, feetToZ);
  addRangeMarkers(markerGroup, laneWidth, feetToZ);
  addPins(laneRoot, feetToZ);
  addOilZones(oilGroup, pattern, boardToX, feetToZ);
  addBreakpointLine(markerGroup, pattern, boardToX, feetToZ, handedness);
  addShotPath(pathGroup, pattern, boardToX, feetToZ, handedness, state.targetPath);
  addBreakpointMarker(markerGroup, pattern, boardToX, feetToZ, handedness);
  addBoardNumbers(labelGroup, laneWidth, boardToX, feetToZ, handedness);
  addOilDimensions(labelGroup, pattern, laneWidth, boardToX, feetToZ, handedness);
  addSceneLabels(labelGroup, pattern, laneWidth, laneLength, feetToZ, handedness);

  const resize = () => {
    const width = Math.max(280, container.clientWidth);
    const height = Math.max(390, Math.min(620, Math.round(width * 0.78)));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  const visual = {
    scene,
    renderer,
    camera,
    laneRoot,
    groups: { oil: oilGroup, labels: labelGroup, path: pathGroup },
    resizeObserver,
    frame: 0,
    autoRotate: true,
    spinButton: null,
    currentView: "attack",
    cameraBase: null,
    cameraOffset: { x: 0, y: 0, zoom: 1 },
    cleanups: [],
  };
  state.laneVisual = visual;
  bindLaneVisualControls(visual);
  setLaneView("attack");

  const animate = () => {
    if (visual.autoRotate) {
      laneRoot.rotation.y += 0.006;
    }
    renderer.render(scene, camera);
    visual.frame = requestAnimationFrame(animate);
  };
  animate();
}

function bindLaneVisualControls(visual) {
  const controls = document.querySelector(".lane-controls");
  const container = document.querySelector("#lane-visual");
  if (!controls || !container) {
    return;
  }

  const clickHandler = (event) => {
    const resetButton = event.target.closest("[data-lane-reset]");
    if (resetButton) {
      resetLaneCamera();
    }
  };

  const activePointers = new Map();
  let singleGesture = null;
  let multiGesture = null;

  const getGestureStats = () => {
    const points = [...activePointers.values()];
    if (points.length < 2) {
      return null;
    }
    const [first, second] = points;
    const dx = second.x - first.x;
    const dy = second.y - first.y;
    return {
      angle: Math.atan2(dy, dx),
      distance: Math.max(1, Math.hypot(dx, dy)),
      midpoint: {
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2,
      },
    };
  };

  const startSingleGesture = () => {
    const [point] = activePointers.values();
    singleGesture = point ? { x: point.x, offsetX: visual.cameraOffset.x } : null;
  };

  const startMultiGesture = () => {
    const stats = getGestureStats();
    multiGesture = stats
      ? {
          ...stats,
          offsetX: visual.cameraOffset.x,
          offsetY: visual.cameraOffset.y,
          rotationY: visual.laneRoot.rotation.y,
          zoom: visual.cameraOffset.zoom,
        }
      : null;
  };

  const pointerDown = (event) => {
    event.preventDefault();
    visual.autoRotate = false;
    visual.spinButton?.classList.remove("active");
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    container.setPointerCapture?.(event.pointerId);
    if (activePointers.size >= 2) {
      singleGesture = null;
      startMultiGesture();
    } else {
      startSingleGesture();
    }
  };

  const pointerMove = (event) => {
    if (!activePointers.has(event.pointerId)) return;
    event.preventDefault();
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointers.size >= 2 && multiGesture) {
      const stats = getGestureStats();
      if (!stats) return;
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      visual.cameraOffset.zoom = clamp(multiGesture.zoom * (stats.distance / multiGesture.distance), 0.70, 1.55);
      visual.cameraOffset.x = clamp(multiGesture.offsetX - ((stats.midpoint.x - multiGesture.midpoint.x) / width) * 3.2, -2.4, 2.4);
      visual.cameraOffset.y = clamp(multiGesture.offsetY + ((stats.midpoint.y - multiGesture.midpoint.y) / height) * 2.4, -1.35, 1.35);
      visual.laneRoot.rotation.y = multiGesture.rotationY + stats.angle - multiGesture.angle;
      applyLaneCameraTransform();
      return;
    }

    if (!singleGesture) return;
    const width = Math.max(1, container.clientWidth);
    visual.cameraOffset.x = clamp(singleGesture.offsetX - ((event.clientX - singleGesture.x) / width) * 3.2, -2.4, 2.4);
    applyLaneCameraTransform();
  };

  const pointerUp = (event) => {
    activePointers.delete(event.pointerId);
    container.releasePointerCapture?.(event.pointerId);
    if (activePointers.size >= 2) {
      startMultiGesture();
    } else if (activePointers.size === 1) {
      multiGesture = null;
      startSingleGesture();
    } else {
      singleGesture = null;
      multiGesture = null;
    }
  };

  const wheelHandler = (event) => {
    event.preventDefault();
    visual.autoRotate = false;
    visual.spinButton?.classList.remove("active");
    zoomLaneCamera(event.deltaY < 0 ? 1 : -1);
  };

  controls.addEventListener("click", clickHandler);
  container.addEventListener("pointerdown", pointerDown);
  container.addEventListener("pointermove", pointerMove);
  container.addEventListener("pointerup", pointerUp);
  container.addEventListener("pointerleave", pointerUp);
  container.addEventListener("pointercancel", pointerUp);
  container.addEventListener("wheel", wheelHandler, { passive: false });
  visual.cleanups.push(
    () => controls.removeEventListener("click", clickHandler),
    () => container.removeEventListener("pointerdown", pointerDown),
    () => container.removeEventListener("pointermove", pointerMove),
    () => container.removeEventListener("pointerup", pointerUp),
    () => container.removeEventListener("pointerleave", pointerUp),
    () => container.removeEventListener("pointercancel", pointerUp),
    () => container.removeEventListener("wheel", wheelHandler)
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setLaneView(view) {
  const visual = state.laneVisual;
  if (!visual) {
    return;
  }

  const views = {
    attack: { position: [0, 9.1, 15.4], target: [0, 0, -0.7], fov: 46 },
    top: { position: [0, 20.2, 0.04], target: [0, 0, 0], fov: 34 },
    pins: { position: [0, 5.4, -13.2], target: [0, 0.48, -8.25], fov: 38 },
  };
  const next = views[view] || views.attack;
  visual.currentView = view;
  visual.cameraBase = next;
  visual.cameraOffset = { x: 0, y: 0, zoom: 1 };
  applyLaneCameraTransform();
  visual.autoRotate = false;
  visual.spinButton?.classList.remove("active");
  if (view !== "attack") {
    visual.laneRoot.rotation.y = 0;
  }
}

function applyLaneCameraTransform() {
  const visual = state.laneVisual;
  if (!visual?.cameraBase) {
    return;
  }

  const base = visual.cameraBase;
  const zoom = clamp(visual.cameraOffset.zoom, 0.70, 1.55);
  const panX = clamp(visual.cameraOffset.x, -2.4, 2.4);
  const panY = clamp(visual.cameraOffset.y || 0, -1.35, 1.35);
  const position = new THREE.Vector3(...base.position);
  const target = new THREE.Vector3(...base.target);
  const direction = position.clone().sub(target).multiplyScalar(1 / zoom);

  target.x += panX;
  target.y += panY;
  position.copy(target).add(direction);
  position.x += panX * 0.25;
  position.y += panY * 0.12;

  visual.camera.position.copy(position);
  visual.camera.fov = base.fov;
  visual.camera.lookAt(target);
  visual.camera.updateProjectionMatrix();
}

function zoomLaneCamera(direction) {
  const visual = state.laneVisual;
  if (!visual) {
    return;
  }
  visual.autoRotate = false;
  visual.cameraOffset.zoom = clamp(visual.cameraOffset.zoom + direction * 0.12, 0.70, 1.55);
  applyLaneCameraTransform();
}

function resetLaneCamera() {
  const visual = state.laneVisual;
  if (!visual) {
    return;
  }
  visual.laneRoot.rotation.y = 0;
  visual.autoRotate = false;
  visual.spinButton?.classList.remove("active");
  setLaneView("attack");
}

function createTextSprite(text, options = {}) {
  const {
    color = "#dbeafe",
    background = "rgba(5, 7, 10, 0.72)",
    fontSize = 28,
    padding = 12,
    scale = 0.52,
  } = options;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = `800 ${fontSize}px Inter, Arial, sans-serif`;
  const metrics = context.measureText(text);
  canvas.width = Math.ceil(metrics.width + padding * 2);
  canvas.height = fontSize + padding * 2;

  context.font = `800 ${fontSize}px Inter, Arial, sans-serif`;
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "rgba(76, 201, 240, 0.34)";
  context.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
  context.fillStyle = color;
  context.textBaseline = "middle";
  context.fillText(text, padding, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })
  );
  sprite.scale.set((canvas.width / canvas.height) * scale, scale, 1);
  return sprite;
}

function createWoodTexture(light = "#c9894b", dark = "#8f552d") {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, dark);
  gradient.addColorStop(0.28, light);
  gradient.addColorStop(0.52, "#e0a663");
  gradient.addColorStop(0.76, light);
  gradient.addColorStop(1, dark);
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < canvas.height; y += 7) {
    context.strokeStyle = `rgba(70, 34, 16, ${0.10 + (y % 21) / 150})`;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, y + Math.sin(y * 0.08) * 3);
    context.bezierCurveTo(26, y + 5, 58, y - 4, canvas.width, y + Math.cos(y * 0.06) * 4);
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 10);
  return texture;
}

function addApproach(scene, laneWidth, laneLength, approachLength) {
  const approach = new THREE.Mesh(
    new THREE.BoxGeometry(laneWidth + 0.9, 0.10, approachLength),
    new THREE.MeshStandardMaterial({
      color: 0x26202a,
      roughness: 0.50,
      metalness: 0.04,
    })
  );
  approach.position.set(0, -0.09, laneLength / 2 + approachLength / 2);
  scene.add(approach);

  const carpet = new THREE.Mesh(
    new THREE.PlaneGeometry(laneWidth + 1.25, approachLength),
    new THREE.MeshBasicMaterial({ color: 0x101827, transparent: true, opacity: 0.62 })
  );
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.002, laneLength / 2 + approachLength / 2);
  scene.add(carpet);
}

function addLaneSurface(scene, laneWidth, laneLength, boardToX) {
  const boardDepth = laneLength;
  for (let board = 1; board <= 40; board += 1) {
    const texture = createWoodTexture(board % 2 === 0 ? "#d1914f" : "#bd7440", board <= 5 || board >= 36 ? "#5e371f" : "#8b4e28");
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.25,
      metalness: 0.02,
    });
    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(laneWidth / 40 - 0.006, 0.10, boardDepth),
      material
    );
    strip.position.set(boardToX(board), -0.08, 0);
    scene.add(strip);
  }

  const shine = new THREE.Mesh(
    new THREE.PlaneGeometry(laneWidth, laneLength),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.055,
      depthWrite: false,
    })
  );
  shine.rotation.x = -Math.PI / 2;
  shine.position.set(0, 0.012, 0);
  scene.add(shine);

  const reflection = new THREE.Mesh(
    new THREE.PlaneGeometry(laneWidth * 0.42, laneLength * 0.95),
    new THREE.MeshBasicMaterial({
      color: 0xfff1d0,
      transparent: true,
      opacity: 0.035,
      depthWrite: false,
    })
  );
  reflection.rotation.x = -Math.PI / 2;
  reflection.position.set(-laneWidth * 0.18, 0.018, -0.2);
  scene.add(reflection);
}

function addLaneKickbacks(scene, laneWidth, laneLength) {
  const material = new THREE.MeshStandardMaterial({
    color: 0x22160f,
    roughness: 0.40,
    metalness: 0.08,
  });

  [-1, 1].forEach((side) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, laneLength + 0.55), material);
    rail.position.set(side * (laneWidth / 2 + 0.48), 0.13, -0.08);
    scene.add(rail);

    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.045, laneLength + 0.35),
      new THREE.MeshBasicMaterial({ color: 0x3b2415, transparent: true, opacity: 0.92 })
    );
    cap.position.set(side * (laneWidth / 2 + 0.48), 0.37, -0.08);
    scene.add(cap);
  });
}

function addPinDeck(scene, laneWidth, laneLength, pinDeckLength) {
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(laneWidth + 0.18, 0.12, pinDeckLength),
    new THREE.MeshStandardMaterial({
      color: 0x765332,
      roughness: 0.32,
      metalness: 0.05,
    })
  );
  deck.position.set(0, -0.065, -laneLength / 2 - pinDeckLength / 2 + 0.08);
  scene.add(deck);

  const backCurtain = new THREE.Mesh(
    new THREE.BoxGeometry(laneWidth + 1.1, 1.7, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x090b10, roughness: 0.70, metalness: 0.02 })
  );
  backCurtain.position.set(0, 0.62, -laneLength / 2 - pinDeckLength - 0.45);
  scene.add(backCurtain);
}

function addLaneBoards(scene, laneWidth, laneLength, boardToX) {
  const boardMaterial = new THREE.LineBasicMaterial({ color: 0x2d2118, transparent: true, opacity: 0.60 });
  const fiveBoardMaterial = new THREE.LineBasicMaterial({ color: 0x77d9ff, transparent: true, opacity: 0.30 });
  const centerMaterial = new THREE.LineBasicMaterial({ color: 0x4cc9f0, transparent: true, opacity: 0.62 });

  for (let board = 1; board <= 41; board += 1) {
    const x = board === 41 ? laneWidth / 2 : boardToX(board) - laneWidth / 80;
    const points = [new THREE.Vector3(x, 0.01, laneLength / 2), new THREE.Vector3(x, 0.01, -laneLength / 2)];
    const material = board === 21 ? centerMaterial : board % 5 === 1 ? fiveBoardMaterial : boardMaterial;
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
    scene.add(line);
  }
}

function addGutters(scene, laneWidth, laneLength) {
  const gutterMaterial = new THREE.MeshStandardMaterial({
    color: 0x07090d,
    roughness: 0.20,
    metalness: 0.50,
  });

  [-1, 1].forEach((side) => {
    const gutter = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, laneLength, 32, 1, true), gutterMaterial);
    gutter.rotation.x = Math.PI / 2;
    gutter.rotation.z = Math.PI / 2;
    gutter.position.set(side * (laneWidth / 2 + 0.25), -0.07, 0);
    scene.add(gutter);

    const gutterHighlight = new THREE.Mesh(
      new THREE.PlaneGeometry(0.04, laneLength),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05, depthWrite: false })
    );
    gutterHighlight.rotation.x = -Math.PI / 2;
    gutterHighlight.position.set(side * (laneWidth / 2 + 0.18), 0.035, 0);
    scene.add(gutterHighlight);
  });
}

function addFoulLine(scene, laneWidth, feetToZ) {
  const z = feetToZ(0);
  const markerWidth = laneWidth + 0.68;
  const line = new THREE.Mesh(
    new THREE.BoxGeometry(markerWidth, 0.052, 0.112),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  line.position.set(0, 0.086, z);
  scene.add(line);

  for (let index = 0; index < 10; index += 1) {
    const segment = new THREE.Mesh(
      new THREE.BoxGeometry(markerWidth / 10 - 0.012, 0.058, 0.122),
      new THREE.MeshBasicMaterial({ color: index % 2 === 0 ? 0xffffff : 0xf59e0b })
    );
    segment.position.set(-markerWidth / 2 + markerWidth / 20 + (markerWidth / 10) * index, 0.118, z);
    scene.add(segment);
  }

  const warning = new THREE.Mesh(
    new THREE.BoxGeometry(markerWidth, 0.024, 0.040),
    new THREE.MeshBasicMaterial({ color: 0xf59e0b })
  );
  warning.position.set(0, 0.148, z + 0.092);
  scene.add(warning);

  const foulGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(markerWidth + 0.28, 0.42),
    new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.26, depthWrite: false })
  );
  foulGlow.rotation.x = -Math.PI / 2;
  foulGlow.position.set(0, 0.064, z + 0.02);
  scene.add(foulGlow);

  const uprightMarker = new THREE.Mesh(
    new THREE.PlaneGeometry(markerWidth, 0.50),
    new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.20,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  uprightMarker.position.set(0, 0.36, z - 0.03);
  scene.add(uprightMarker);

  const label = createTextSprite("FOUL LINE", {
    fontSize: 28,
    scale: 0.34,
    color: "#fff7ed",
    background: "rgba(124, 45, 18, 0.82)",
  });
  label.position.set(0, 0.70, z + 0.30);
  scene.add(label);

  [-1, 1].forEach((side) => {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.58, 0.14),
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0x7c2d12,
        emissiveIntensity: 0.42,
        roughness: 0.34,
      })
    );
    post.position.set(side * (laneWidth / 2 + 0.34), 0.33, z);
    scene.add(post);
  });
}

function addApproachDots(scene, laneWidth, laneLength, approachLength) {
  const material = new THREE.MeshBasicMaterial({ color: 0xf7e8d0, transparent: true, opacity: 0.84 });
  const rows = [laneLength / 2 + approachLength * 0.33, laneLength / 2 + approachLength * 0.72];
  rows.forEach((z, rowIndex) => {
    [-0.36, -0.18, 0, 0.18, 0.36].forEach((ratio) => {
      const dot = new THREE.Mesh(new THREE.CircleGeometry(0.045, 24), material);
      dot.rotation.x = -Math.PI / 2;
      dot.position.set(ratio * laneWidth, 0.02, z + rowIndex * 0.05);
      scene.add(dot);
    });
  });
}

function addArrows(scene, boardToX, feetToZ) {
  const material = new THREE.MeshBasicMaterial({ color: 0x111827, transparent: true, opacity: 0.88 });
  [5, 10, 15, 20, 25, 30, 35].forEach((board) => {
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.34, 3), material);
    arrow.rotation.x = Math.PI / 2;
    arrow.rotation.z = Math.PI;
    arrow.position.set(boardToX(board), 0.045, feetToZ(15));
    scene.add(arrow);
  });
}

function addRangeMarkers(scene, laneWidth, feetToZ) {
  const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.24 });
  [15, 30, 45].forEach((feet) => {
    const z = feetToZ(feet);
    const fullLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-laneWidth / 2, 0.052, z),
        new THREE.Vector3(laneWidth / 2, 0.052, z),
      ]),
      new THREE.LineBasicMaterial({
        color: feet === 30 ? 0xdbeafe : 0xffffff,
        transparent: true,
        opacity: feet === 30 ? 0.28 : 0.16,
      })
    );
    scene.add(fullLine);

    [-1, 1].forEach((side) => {
      const points = [
        new THREE.Vector3(side * (laneWidth / 2 - 0.38), 0.04, z),
        new THREE.Vector3(side * (laneWidth / 2 - 0.06), 0.04, z),
      ];
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
    });
  });
}

function addPins(scene, feetToZ) {
  const white = new THREE.MeshStandardMaterial({
    color: 0xfffbf0,
    emissive: 0xffe6bd,
    emissiveIntensity: 0.06,
    roughness: 0.16,
    metalness: 0.03,
  });
  const red = new THREE.MeshStandardMaterial({ color: 0xd82027, emissive: 0x3a0507, emissiveIntensity: 0.10, roughness: 0.26 });
  const shadowMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false });
  const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, depthWrite: false });
  const z = feetToZ(60);
  const spacingX = 0.52;
  const spacingZ = 0.66;
  const pinProfile = [
    [0.112, 0.00],
    [0.218, 0.09],
    [0.292, 0.31],
    [0.264, 0.54],
    [0.178, 0.82],
    [0.112, 1.08],
    [0.120, 1.24],
    [0.178, 1.39],
    [0.130, 1.55],
    [0.044, 1.65],
  ].map(([radius, y]) => new THREE.Vector2(radius, y));
  const pinGeometry = new THREE.LatheGeometry(pinProfile, 44);
  pinGeometry.computeVertexNormals();
  const positions = [
    [0, z],
    [-spacingX, z - spacingZ],
    [spacingX, z - spacingZ],
    [-spacingX * 2, z - spacingZ * 2],
    [0, z - spacingZ * 2],
    [spacingX * 2, z - spacingZ * 2],
    [-spacingX * 3, z - spacingZ * 3],
    [-spacingX, z - spacingZ * 3],
    [spacingX, z - spacingZ * 3],
    [spacingX * 3, z - spacingZ * 3],
  ];

  positions.forEach(([x, pinZ]) => {
    const group = new THREE.Group();
    const body = new THREE.Mesh(pinGeometry, white);
    const upperBand = new THREE.Mesh(new THREE.TorusGeometry(0.132, 0.026, 12, 40), red);
    const lowerBand = new THREE.Mesh(new THREE.TorusGeometry(0.122, 0.020, 12, 40), red);
    const shine = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.96), highlightMaterial);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.430, 40), shadowMaterial);
    upperBand.rotation.x = Math.PI / 2;
    lowerBand.rotation.x = Math.PI / 2;
    upperBand.position.y = 1.18;
    lowerBand.position.y = 1.10;
    shine.position.set(-0.105, 0.80, 0.286);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.005;
    group.add(body);
    group.add(upperBand);
    group.add(lowerBand);
    group.add(shine);
    group.add(shadow);
    group.position.set(x, 0.035, pinZ);
    scene.add(group);
  });
}

function makeOilMaterial(opacity, oilLevel) {
  const density = clamp(oilLevel / 100, 0, 1);
  const weightedDensity = Math.pow(density, 1.08);
  const lightOil = new THREE.Color(0xe5fbff);
  const mediumOil = new THREE.Color(0x0891c7);
  const heavyOil = new THREE.Color(0x021d49);
  const color = weightedDensity < 0.52
    ? lightOil.lerp(mediumOil, weightedDensity / 0.52)
    : mediumOil.lerp(heavyOil, (weightedDensity - 0.52) / 0.48);
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color.clone().multiplyScalar(0.16),
    emissiveIntensity: 0.025 + (1 - weightedDensity) * 0.055,
    roughness: 0.02,
    metalness: 0.16,
    transparent: true,
    opacity,
    depthWrite: false,
  });
}

function makeOilEdgeMaterial(oilLevel) {
  const density = clamp(oilLevel / 100, 0, 1);
  return new THREE.LineBasicMaterial({
    color: density > 0.62 ? 0x9ee8ff : 0x063c78,
    transparent: true,
    opacity: 0.16 + density * 0.34,
  });
}

function addOilFeather(scene, x, z, width, depth, opacity) {
  const edge = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshBasicMaterial({
      color: 0xd8f7ff,
      transparent: true,
      opacity: Math.min(0.28, opacity * 1.15),
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  edge.rotation.x = -Math.PI / 2;
  edge.position.set(x, 0.075, z);
  scene.add(edge);
}

function zoneOilLevel(pattern, board, feet) {
  const zones = pattern.zones?.length
    ? pattern.zones
    : [{ board_start: 1, board_end: 40, distance_start_ft: 0, distance_end_ft: pattern.length_ft, oil_level: 55 }];

  const matched = zones.filter(
    (zone) =>
      board >= zone.board_start &&
      board <= zone.board_end &&
      feet >= zone.distance_start_ft &&
      feet <= zone.distance_end_ft
  );
  if (matched.length) {
    return matched.reduce((sum, zone) => sum + zone.oil_level, 0) / matched.length;
  }

  const centerDistance = Math.abs(board - 20.5) / 20;
  const centerCrown = Math.max(0, 1 - centerDistance);
  const lengthBias = pattern.length_ft >= 43 ? 14 : pattern.length_ft <= 36 ? -8 : 0;
  const base = 30 + centerCrown * 42 + lengthBias;
  return Math.max(12, Math.min(88, base));
}

function distanceTaper(pattern, feet) {
  const length = Math.max(1, pattern.length_ft);
  const ratio = feet / length;
  const earlyHold = ratio < 0.18 ? 0.92 + ratio * 0.38 : 1;
  const endFade = ratio > 0.72 ? Math.max(0.18, 1 - (ratio - 0.72) * 2.0) : 1;
  return Math.min(1, earlyHold * endFade);
}

function boardShapeModifier(pattern, board) {
  const centerDistance = Math.abs(board - 20.5) / 20;
  if (pattern.pattern_type === "house") {
    return 0.58 + Math.max(0, 1 - centerDistance) * 0.72;
  }
  if (pattern.length_ft <= 36) {
    return 0.46 + Math.max(0, 1 - centerDistance * 0.86) * 0.54;
  }
  if (pattern.length_ft >= 43) {
    return 0.70 + Math.max(0, 1 - centerDistance * 1.12) * 0.38;
  }
  return 0.58 + Math.max(0, 1 - centerDistance) * 0.48;
}

function addOilZones(scene, pattern, boardToX, feetToZ) {
  const boardStep = 1;
  const distanceStep = 2;
  const maxFeet = Math.max(2, pattern.length_ft);

  for (let boardStart = 1; boardStart <= 40; boardStart += boardStep) {
    const boardEnd = Math.min(40, boardStart + boardStep - 1);
    const boardMid = (boardStart + boardEnd) / 2;
    for (let startFt = 0; startFt < maxFeet; startFt += distanceStep) {
      const endFt = Math.min(maxFeet, startFt + distanceStep);
      const feetMid = (startFt + endFt) / 2;
      const rawLevel = zoneOilLevel(pattern, boardMid, feetMid);
      const oilLevel = Math.max(0, Math.min(100, rawLevel * distanceTaper(pattern, feetMid) * boardShapeModifier(pattern, boardMid)));

      if (oilLevel < 6) {
        continue;
      }

      const left = boardToX(boardStart);
      const right = boardToX(boardEnd);
      const nearZ = feetToZ(startFt);
      const farZ = feetToZ(endFt);
      const width = Math.max(0.06, Math.abs(right - left) + 0.065);
      const depth = Math.max(0.12, Math.abs(nearZ - farZ) - 0.012);
      const density = Math.pow(oilLevel / 100, 1.08);
      const opacity = 0.18 + density * 0.66;
      const height = 0.008 + density * 0.074;
      const geometry = new THREE.BoxGeometry(width, height, depth);

      const oil = new THREE.Mesh(
        geometry,
        makeOilMaterial(opacity, oilLevel)
      );
      oil.position.set((left + right) / 2, 0.046 + height / 2, (nearZ + farZ) / 2);
      scene.add(oil);

      if (oilLevel >= 12) {
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), makeOilEdgeMaterial(oilLevel));
        edges.position.copy(oil.position);
        scene.add(edges);
      }
    }
  }

  const lengthZ = feetToZ(pattern.length_ft);
  const oilEnd = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 0.30),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.30,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  oilEnd.rotation.x = -Math.PI / 2;
  oilEnd.position.set(0, 0.128, lengthZ);
  scene.add(oilEnd);

  const endLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-2.1, 0.18, lengthZ),
      new THREE.Vector3(2.1, 0.18, lengthZ),
    ]),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.72 })
  );
  scene.add(endLine);
}

function mirrorBoard(board) {
  return 41 - board;
}

function handedBoard(board, handedness) {
  return handedness === "right" ? mirrorBoard(board) : board;
}

function getBreakpointBoard(pattern, handedness = "right") {
  const baseBoard = pattern.play_profile?.rule_of_31_board || Math.max(1, pattern.length_ft - 31);
  return handedBoard(Math.max(1, Math.min(40, baseBoard)), handedness);
}

function getLaunchBoard(pattern, breakpointBoard, handedness = "right") {
  const offset = pattern.length_ft <= 36 ? 4 : 8;
  if (handedness === "left") {
    return Math.max(5, Math.min(36, breakpointBoard + offset));
  }
  return Math.min(36, Math.max(5, breakpointBoard - offset));
}

function getPocketBoard(handedness = "right") {
  return handedness === "left" ? 18 : 23;
}

function addBreakpointLine(scene, pattern, boardToX, feetToZ, handedness = "right") {
  const board = getBreakpointBoard(pattern, handedness);
  if (!board) return;

  const x = boardToX(board);
  const z = feetToZ(pattern.length_ft);
  const material = new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.82 });
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(x, 0.12, z + 0.55),
    new THREE.Vector3(x, 0.12, z - 0.55),
  ]);
  scene.add(new THREE.Line(geometry, material));
}

function addShotPath(scene, pattern, boardToX, feetToZ, handedness = "right", customPath = null) {
  const estimatedBreakpoint = getBreakpointBoard(pattern, handedness);
  const estimatedLaunch = getLaunchBoard(pattern, estimatedBreakpoint, handedness);
  const breakpointBoard = customPath ? clamp(Number(customPath.breakpointBoard) || estimatedBreakpoint, 1, 40) : estimatedBreakpoint;
  const launchBoard = customPath ? clamp(Number(customPath.releaseBoard) || estimatedLaunch, 1, 40) : estimatedLaunch;
  const arrowsBoard = customPath ? clamp(Number(customPath.arrowsBoard) || ((launchBoard + breakpointBoard) / 2), 1, 40) : (launchBoard + breakpointBoard) / 2;
  const pocketBoard = getPocketBoard(handedness);
  const handLabel = handedness === "left" ? "L" : "R";
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(boardToX(launchBoard), 0.17, feetToZ(0)),
    new THREE.Vector3(boardToX(arrowsBoard), 0.20, feetToZ(15)),
    new THREE.Vector3(boardToX((arrowsBoard + breakpointBoard) / 2), 0.22, feetToZ(pattern.length_ft * 0.55)),
    new THREE.Vector3(boardToX(breakpointBoard), 0.24, feetToZ(pattern.length_ft)),
    new THREE.Vector3(boardToX(pocketBoard), 0.28, feetToZ(60)),
  ]);
  const points = curve.getPoints(72);
  const glow = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points.map((point) => point.clone().setY(point.y - 0.018))),
    new THREE.LineBasicMaterial({ color: 0x4cc9f0, transparent: true, opacity: 0.82 })
  );
  scene.add(glow);

  const path = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 })
  );
  scene.add(path);

  [launchBoard, breakpointBoard, pocketBoard].forEach((board, index) => {
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(index === 1 ? 0.105 : 0.078, 22, 22),
      new THREE.MeshBasicMaterial({
        color: index === 1 ? 0xf59e0b : 0xffffff,
        transparent: true,
        opacity: index === 1 ? 1 : 0.92,
      })
    );
    const feet = index === 0 ? 0 : index === 1 ? pattern.length_ft : 60;
    marker.position.set(boardToX(board), 0.29, feetToZ(feet));
    scene.add(marker);
  });

  [
    [`${handLabel} START ${Math.round(launchBoard)}`, launchBoard, 6, "#ffffff"],
    [`ARROWS ${Math.round(arrowsBoard)}`, arrowsBoard, 15, "#7dd3fc"],
    [`BP ${Math.round(breakpointBoard)}`, breakpointBoard, pattern.length_ft, "#fbbf24"],
    [`POCKET ${Math.round(pocketBoard)}`, pocketBoard, 57, "#ffffff"],
  ].forEach(([text, board, feet, color]) => {
    const label = createTextSprite(text, {
      fontSize: 20,
      scale: 0.23,
      padding: 7,
      color,
      background: "rgba(5, 7, 10, 0.76)",
    });
    label.position.set(boardToX(board), 0.58, feetToZ(feet));
    scene.add(label);
  });
}

function addBreakpointMarker(scene, pattern, boardToX, feetToZ, handedness = "right") {
  const board = getBreakpointBoard(pattern, handedness);
  if (!board) {
    return;
  }

  const z = feetToZ(pattern.length_ft);
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 24, 24),
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.85,
      roughness: 0.28,
    })
  );
  marker.position.set(boardToX(board), 0.28, z);
  scene.add(marker);
}

function addBoardNumbers(scene, laneWidth, boardToX, feetToZ, handedness = "right") {
  const boardLabels = [5, 10, 15, 20, 25, 30, 35];
  boardLabels.forEach((board) => {
    const sprite = createTextSprite(String(board), {
      fontSize: 22,
      scale: 0.20,
      background: "rgba(5, 7, 10, 0.52)",
      color: board === 20 ? "#4cc9f0" : "#dbeafe",
      padding: 8,
    });
    sprite.position.set(boardToX(handedBoard(board, handedness)), 0.36, feetToZ(10));
    scene.add(sprite);
  });

  [
    ["1", -laneWidth / 2 - 0.18],
    ["40", laneWidth / 2 + 0.18],
  ].forEach(([text, x]) => {
    const sprite = createTextSprite(text, { fontSize: 20, scale: 0.20, padding: 8 });
    sprite.position.set(x, 0.36, feetToZ(5));
    scene.add(sprite);
  });
}

function addDimensionLine(scene, start, end, color = 0x4cc9f0, opacity = 0.70) {
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([start, end]),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
  scene.add(line);
  return line;
}

function addDimensionLabel(scene, text, x, y, z, options = {}) {
  const sprite = createTextSprite(text, {
    fontSize: options.fontSize || 21,
    scale: options.scale || 0.27,
    padding: 8,
    color: options.color || "#dbeafe",
    background: options.background || "rgba(5, 7, 10, 0.76)",
  });
  sprite.position.set(x, y, z);
  scene.add(sprite);
  return sprite;
}

function addOilDimensions(scene, pattern, laneWidth, boardToX, feetToZ, handedness = "right") {
  const oilLength = Math.max(0, Math.min(60, Number(pattern.length_ft) || 0));
  const y = 0.22;
  const labelY = 0.66;
  const foulZ = feetToZ(0);
  const oilEndZ = feetToZ(oilLength);
  const pinZ = feetToZ(60);
  const oilX = laneWidth / 2 + 0.52;
  const laneX = -laneWidth / 2 - 0.52;
  const tick = 0.16;
  const cyan = 0x4cc9f0;
  const white = 0xdbeafe;
  const amber = 0xf59e0b;

  addDimensionLine(scene, new THREE.Vector3(oilX, y, foulZ), new THREE.Vector3(oilX, y, oilEndZ), cyan, 0.78);
  addDimensionLine(scene, new THREE.Vector3(oilX - tick, y, foulZ), new THREE.Vector3(oilX + tick, y, foulZ), cyan, 0.78);
  addDimensionLine(scene, new THREE.Vector3(oilX - tick, y, oilEndZ), new THREE.Vector3(oilX + tick, y, oilEndZ), cyan, 0.78);
  addDimensionLabel(scene, `${oilLength} FT OIL`, oilX + 0.12, labelY, feetToZ(oilLength / 2), {
    color: "#7dd3fc",
    background: "rgba(6, 24, 38, 0.78)",
  });

  addDimensionLine(scene, new THREE.Vector3(laneX, y, foulZ), new THREE.Vector3(laneX, y, pinZ), white, 0.36);
  addDimensionLine(scene, new THREE.Vector3(laneX - tick, y, foulZ), new THREE.Vector3(laneX + tick, y, foulZ), white, 0.42);
  addDimensionLine(scene, new THREE.Vector3(laneX - tick, y, pinZ), new THREE.Vector3(laneX + tick, y, pinZ), white, 0.42);
  addDimensionLabel(scene, "60 FT TO HEAD PIN", laneX - 0.10, labelY, feetToZ(30), {
    color: "#e5e7eb",
    scale: 0.25,
    background: "rgba(5, 7, 10, 0.62)",
  });

  const widthZ = feetToZ(12);
  addDimensionLine(
    scene,
    new THREE.Vector3(-laneWidth / 2, y, widthZ),
    new THREE.Vector3(laneWidth / 2, y, widthZ),
    white,
    0.42
  );
  addDimensionLine(scene, new THREE.Vector3(-laneWidth / 2, y, widthZ - tick), new THREE.Vector3(-laneWidth / 2, y, widthZ + tick), white, 0.42);
  addDimensionLine(scene, new THREE.Vector3(laneWidth / 2, y, widthZ - tick), new THREE.Vector3(laneWidth / 2, y, widthZ + tick), white, 0.42);
  addDimensionLabel(scene, "40 BOARDS", 0, 0.62, widthZ + 0.34, {
    color: "#e5e7eb",
    scale: 0.24,
    background: "rgba(5, 7, 10, 0.62)",
  });

  const breakpointBoard = getBreakpointBoard(pattern, handedness);
  if (breakpointBoard) {
    const bpX = boardToX(breakpointBoard);
    addDimensionLine(
      scene,
      new THREE.Vector3(bpX - 0.24, y + 0.04, oilEndZ),
      new THREE.Vector3(bpX + 0.24, y + 0.04, oilEndZ),
      amber,
      0.86
    );
    addDimensionLine(
      scene,
      new THREE.Vector3(bpX, y + 0.04, oilEndZ - 0.24),
      new THREE.Vector3(bpX, y + 0.04, oilEndZ + 0.24),
      amber,
      0.86
    );
    addDimensionLabel(scene, `BP ${Math.round(breakpointBoard)} / ${oilLength}FT`, bpX, 0.78, oilEndZ - 0.45, {
      color: "#fbbf24",
      scale: 0.25,
      background: "rgba(38, 23, 6, 0.78)",
    });
  }
}

function addSceneLabels(scene, pattern, laneWidth, laneLength, feetToZ, handedness = "right") {
  const sideLabel = handedness === "left" ? "LEFT VIEW" : "RIGHT VIEW";
  const labels = [
    [sideLabel, 0, feetToZ(5)],
    ["0 FT FOUL", -laneWidth / 2 - 0.58, feetToZ(0)],
    ["ARROWS 15FT", laneWidth / 2 + 0.72, feetToZ(15)],
    ["30 FT MIDLANE", laneWidth / 2 + 0.72, feetToZ(30)],
    [`OIL END ${pattern.length_ft}FT`, -laneWidth / 2 - 0.72, feetToZ(pattern.length_ft)],
    ["60 FT HEAD PIN", laneWidth / 2 + 0.58, feetToZ(60)],
  ];

  labels.forEach(([text, x, z]) => {
    const sprite = createTextSprite(text, { fontSize: 24, scale: 0.38 });
    sprite.position.set(x, 0.58, z);
    scene.add(sprite);
  });
}

function renderPlayProfile(profile) {
  if (!profile) {
    return "";
  }

  const items = [
    ["Rule of 31", `Target breakpoint near board ${profile.rule_of_31_board}`],
    ["Breakpoint", profile.breakpoint_range],
    ["Axis Rotation", profile.ideal_axis_rotation],
    ["Friction", profile.friction_response],
    ["Inside Miss", profile.inside_miss_room],
    ["Outside Miss", profile.outside_miss_room],
    ["Hold", profile.hold_area],
    ["Recovery", profile.recovery_area],
    ["Speed", profile.speed_control],
    ["Rev Matchup", profile.rev_rate_matchup],
    ["Spares", profile.spare_priority],
  ];

  return `
    <details class="section detail-section">
      <summary>Advanced Read</summary>
      <div class="profile-grid">
        ${items
          .map(
            ([label, value]) => `
              <article class="profile-item">
                <strong>${escapeHtml(label)}</strong>
                <span>${escapeHtml(value)}</span>
              </article>
            `
          )
          .join("")}
      </div>
    </details>
  `;
}

function renderTransition(phase) {
  return `
    <article class="advanced-card">
      <div class="advanced-card-title">
        <strong>${phase.phase_order}. ${escapeHtml(phase.phase_name)}</strong>
        <span>${escapeHtml(phase.frame_window)}</span>
      </div>
      <p><b>Watch:</b> ${escapeHtml(phase.what_to_watch)}</p>
      <p><b>Move:</b> ${escapeHtml(phase.move_strategy)}</p>
      <p><b>Ball:</b> ${escapeHtml(phase.ball_change)}</p>
    </article>
  `;
}

function renderEquipmentOption(option) {
  return `
    <article class="advanced-card">
      <div class="advanced-card-title">
        <strong>${escapeHtml(option.bowler_style)}</strong>
        <span>${escapeHtml(option.surface)}</span>
      </div>
      <p><b>${escapeHtml(option.ball_type)}:</b> ${escapeHtml(option.when_to_use)}</p>
    </article>
  `;
}

function renderZone(zone) {
  return `
    <div class="zone">
      <strong>${zone.board_start}-${zone.board_end}</strong>
      <div class="zone-bar" title="${escapeHtml(zone.note)}">
        <div class="zone-fill" style="width: ${zone.oil_level}%"></div>
      </div>
      <span>${zone.oil_level}%</span>
    </div>
  `;
}

function renderNotes(notes) {
  if (!notes.length) {
    return `<p class="empty-state">No notes saved for this pattern yet.</p>`;
  }

  return notes
    .map(
      (note) => `
        <article class="note-card">
          <strong>${escapeHtml(note.lane_center || "Practice note")}</strong>
          <p>${escapeHtml(note.note)}</p>
          <small>${[
            note.ball_used && `Ball: ${note.ball_used}`,
            note.starting_line && `Line: ${note.starting_line}`,
            note.score !== null && `Score: ${note.score}`,
          ]
            .filter(Boolean)
            .map(escapeHtml)
            .join(" | ")}</small>
        </article>
      `
    )
    .join("");
}

async function saveNote(event, slug) {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = Object.fromEntries(new FormData(form).entries());
  await api(`/api/patterns/${slug}/notes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  form.reset();
  await selectPattern(slug);
}

async function saveKegelReference(event, slug) {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = Object.fromEntries(new FormData(form).entries());
  await api(`/api/patterns/${slug}/external-refs/kegel`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  await loadSyncSummary();
  await selectPattern(slug);
}

async function runSyncNow() {
  elements.syncState.textContent = "Running";
  elements.runSync.disabled = true;
  try {
    const summary = await api("/api/sync/run", { method: "POST", body: "{}" });
    renderSyncSummary(summary);
  } finally {
    elements.runSync.disabled = false;
  }
}

async function updateImportStatus(importId, reviewStatus) {
  const queue = await api(`/api/imports/${importId}/status`, {
    method: "POST",
    body: JSON.stringify({ review_status: reviewStatus }),
  });
  renderImportQueue(queue);
}

function bindEvents() {
  setAuthMode("create");
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.profileForm.addEventListener("submit", handleProfileSubmit);
  elements.findHomeCenters?.addEventListener("click", findNearbyHomeCenters);
  elements.nearbyHomeCenters?.addEventListener("change", () => {
    if (elements.nearbyHomeCenters.value) {
      elements.profileCenter.value = elements.nearbyHomeCenters.value;
    }
  });
  elements.authToggle.addEventListener("click", () => setAuthMode(authMode === "create" ? "login" : "create"));
  elements.logout.addEventListener("click", handleLogout);
  elements.upgradeButton.addEventListener("click", () => setProject("upgrade"));

  document.addEventListener("click", (event) => {
    const tierButton = event.target.closest("[data-subscription-tier]");
    if (tierButton) {
      setSubscriptionTier(tierButton.dataset.subscriptionTier);
      setProject("hub");
      return;
    }

    const editProfileButton = event.target.closest("[data-edit-profile]");
    if (editProfileButton) {
      showProfileScreen();
      return;
    }

    const channelButton = event.target.closest("[data-chat-channel]");
    if (channelButton) {
      state.chatChannel = channelButton.dataset.chatChannel;
      renderChat();
      return;
    }

    const projectButton = event.target.closest("[data-project]");
    if (projectButton) {
      setProject(projectButton.dataset.project);
      return;
    }

    const navButton = event.target.closest("[data-project-nav]");
    if (navButton) {
      setProject(navButton.dataset.projectNav);
    }
  });

  document.addEventListener("submit", async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    if (form.id === "custom-pattern-form") {
      event.preventDefault();
      const pattern = await api("/api/custom-patterns", { method: "POST", body: JSON.stringify(formPayload(form)) });
      form.reset();
      await loadSources();
      await loadPatternTypes();
      await loadTags();
      await loadPatterns();
      state.selectedSlug = pattern.slug;
      const status = document.querySelector("#custom-pattern-status");
      if (status) status.textContent = `${pattern.name} saved. Open Oil Pattern Library to view it.`;
    } else if (form.id === "ball-form") {
      event.preventDefault();
      await api("/api/balls", { method: "POST", body: JSON.stringify(formPayload(form)) });
      form.reset();
      await loadBalls();
    } else if (form.id === "spare-form") {
      event.preventDefault();
      await api("/api/spares", { method: "POST", body: JSON.stringify(formPayload(form)) });
      form.reset();
      await loadSpares();
    } else if (form.id === "shot-form") {
      event.preventDefault();
      const payload = formPayload(form);
      payload.pattern_slug = state.selectedSlug || "";
      await api("/api/shots", { method: "POST", body: JSON.stringify(payload) });
      form.reset();
      hydrateLaneTrackerForm();
      await loadShots();
    } else if (form.id === "community-post-form") {
      event.preventDefault();
      const payload = formPayload(form);
      payload.user_name = state.profile?.displayName || state.userName || "StrikeIQ member";
      state.chatChannel = String(payload.channel || state.chatChannel);
      const status = document.querySelector("#community-post-status");
      if (status) status.textContent = "Posting feedback...";
      await api("/api/chat/posts", { method: "POST", body: JSON.stringify(payload) });
      form.reset();
      if (status) status.textContent = "Feedback posted.";
      await loadCommunityPosts();
    } else if (form.id === "coach-form") {
      event.preventDefault();
      const payload = formPayload(form);
      const question = String(payload.question || "").trim();
      if (!question) return;
      state.chat.unshift({ role: "user", text: question });
      renderChat();
      const status = document.querySelector("#coach-status");
      if (status) status.textContent = "Asking coach...";
      try {
        const response = await api("/api/coach/chat", {
          method: "POST",
          body: JSON.stringify({
            question,
            pattern: selectedPatternSummary(),
            balls: state.balls,
            shots: state.shots,
            spares: state.spares.spares || [],
          }),
        });
        state.chat.unshift({ role: "coach", text: response.reply });
        form.reset();
        if (status) status.textContent = "Coach replied.";
      } catch (error) {
        state.chat.unshift({ role: "coach", text: `AI coach unavailable: ${error.message}` });
        if (status) status.textContent = "AI coach unavailable.";
      }
      renderChat();
    }
  });

  [elements.source, elements.type, elements.length, elements.difficulty, elements.tag].forEach((element) => {
    element.addEventListener("input", loadPatterns);
  });

  elements.reset.addEventListener("click", () => {
    elements.source.value = "";
    elements.type.value = "";
    elements.length.value = "";
    elements.difficulty.value = "";
    elements.tag.value = "";
    loadPatterns();
  });

  elements.runSync.addEventListener("click", runSyncNow);

  elements.importSummary.addEventListener("click", (event) => {
    const button = event.target.closest("[data-import-status]");
    if (!button) return;
    updateImportStatus(button.dataset.importId, button.dataset.importStatus);
  });

  elements.patterns.addEventListener("click", (event) => {
    const card = event.target.closest("[data-slug]");
    if (card) selectPattern(card.dataset.slug);
  });
}

async function init() {
  syncMobileFilterState();
  window.addEventListener("resize", syncMobileFilterState);
  bindEvents();
  requireLogin();
  await loadSources();
  await loadPatternTypes();
  await loadTags();
  await loadSyncSummary();
  await loadImportQueue();
  await loadPatterns();
  await loadBalls();
  await loadSpares();
  await loadShots();
  await loadCatalogStatus();
  renderHomeDashboard();
}

init().catch((error) => {
  elements.detail.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
});
