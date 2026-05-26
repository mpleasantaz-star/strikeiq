import * as THREE from "/vendor/three.module.js";

const state = {
  patterns: [],
  balls: [],
  spares: { spares: [], attempts: 0, makes: 0, rate: 0 },
  spareSessions: [],
  spareSession: null,
  shots: [],
  laneAnalyses: [],
  shotStats: { total: 0, video_total: 0, strikes: 0, average_speed: null, average_hook: null, common_leave: null },
  chat: [],
  communityPosts: [],
  chatChannel: "# video-feedback",
  selectedSlug: null,
  laneVisual: null,
  laneLiveStream: null,
  laneReviewVideoUrl: null,
  laneVideoAnalysisFields: null,
  laneReviewSyncProgress: 0,
  laneReviewSyncRaf: null,
  laneReviewSyncClock: 0,
  laneVideoMode: "recorded_video",
  laneAutoNextMoveSource: "",
  laneDetection: { lane_boards: true, ball_path: true, release_point: true, pin_result: true },
  laneCalibration: {
    camera_angle: "behind_bowler",
    release_board_hint: "",
    target_board_hint: "",
    breakpoint_board_hint: "",
    markers: { foul_line: true, arrows: true, lane_edges: true, pin_deck: true },
    readiness: 100,
  },
  laneVideoCapabilities: null,
  laneBreakdownView: { mode: "3d", rotation: 0, zoom: 1, tilt: 58 },
  laneBreakdownDrag: null,
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
  profileProgress: document.querySelector("#profile-progress"),
  profileName: document.querySelector("#profile-name"),
  profileNameNote: document.querySelector("#profile-name-note"),
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
  profileArsenal: document.querySelector("#profile-arsenal"),
  profileArsenalCount: document.querySelector("#profile-arsenal-count"),
  profileArsenalFields: document.querySelector("#profile-arsenal-fields"),
  profileArsenalSuggestions: document.querySelector("#profile-arsenal-suggestions"),
  profileAverage: document.querySelector("#profile-average"),
  profileGoals: document.querySelector("#profile-goals"),
  profileError: document.querySelector("#profile-error"),
  appShell: document.querySelector("#app-shell"),
  logout: document.querySelector("#logout-button"),
  tierLabel: document.querySelector("#tier-label"),
  tierDetail: document.querySelector("#tier-detail"),
  upgradeButton: document.querySelector("#upgrade-button"),
  projectTabs: document.querySelector(".project-tabs"),
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
  homePriorityStrip: document.querySelector("#home-priority-strip"),
  homeProfileMeter: document.querySelector("#home-profile-meter"),
  homeProfileDetails: document.querySelector("#home-profile-details"),
  homeWorkspaceCount: document.querySelector("#home-workspace-count"),
  homeBallCount: document.querySelector("#home-ball-count"),
  homeSpareRate: document.querySelector("#home-spare-rate"),
  homeShotCount: document.querySelector("#home-shot-count"),
  homeNextActions: document.querySelector("#home-next-actions"),
  homeRecent: document.querySelector("#home-recent"),
  copyrightYear: document.querySelector("#copyright-year"),
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
let activeArsenalInput = null;

const storageKeys = {
  accountEmail: "strikeiq.accountEmail",
  profile: "strikeiq.profile",
  subscriptionTier: "strikeiq.subscriptionTier",
  appSettings: "strikeiq.appSettings",
};

const proProjects = new Set(["sync"]);
const homeWorkspaceCount = 5;
const maxLaneVideoUploadBytes = 500 * 1024 * 1024;
const chatChannels = [
  ["# general", "Community updates, sessions, and quick check-ins"],
  ["# lane-talk", "Moves, transition, and shape changes"],
  ["# scores", "Scores, milestones, and league recaps"],
  ["# arsenal-help", "What ball to throw and when"],
  ["# video-feedback", "Post clips and request feedback"],
  ["# match-room", "Find practice partners and local brackets"],
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
      <section id="lane-profile-context" class="lane-profile-context" aria-label="Lane tracker profile context"></section>
      <form id="shot-form" class="note-form project-form">
        <section class="lane-tier-panel lane-tier-panel-free" data-lane-tier="free" aria-label="Free lane tracker">
          <div>
            <p class="eyebrow">Free Tracker</p>
            <h3>Basic Shot Log</h3>
            <p>Free users track the core lane read only: board start, arrow start, ball speed, and pin fall result.</p>
          </div>
          <button type="button" class="secondary-button" data-project="upgrade">View Paid Tracker</button>
        </section>
        <section id="lane-free-snapshot" class="lane-free-snapshot" data-lane-tier="free" aria-label="Free lane tracker snapshot"></section>
        <section class="lane-tier-panel lane-tier-panel-pro" data-lane-tier="pro" aria-label="Paid lane tracker">
          <div>
            <p class="eyebrow">Paid Tracker</p>
            <h3>Video + AI Lane Breakdown</h3>
            <p>Paid users unlock live or recorded video, calibration, lane and ball detection, visual review, and detailed shot history.</p>
          </div>
          <span>Paid</span>
        </section>
        <section class="lane-video-console" data-lane-tier="pro" aria-label="Lane video capture and detection">
          <div class="lane-video-header">
            <div>
              <p class="eyebrow">Primary Tracker</p>
              <h3>Video Capture</h3>
              <p>Choose live tracking or upload a recorded shot, then review lane and ball detection data before saving the shot.</p>
            </div>
            <span id="lane-video-mode-label">Recorded Video</span>
          </div>
          <div class="lane-mode-toggle" role="radiogroup" aria-label="Video tracking mode">
            <label>
              <input type="radio" name="tracking_mode_choice" value="recorded_video" checked>
              <span>Recorded Video</span>
            </label>
            <label>
              <input type="radio" name="tracking_mode_choice" value="live_video">
              <span>Live Camera</span>
            </label>
          </div>
          <input type="hidden" name="tracking_mode" id="lane-tracking-mode" value="recorded_video">
          <input type="hidden" name="shot_source" id="lane-shot-source" value="video_capture">
          <input type="hidden" name="analysis_run_id" id="lane-analysis-run-id">
          <input type="hidden" id="lane-video-upload-id">
          <section class="lane-video-subject" aria-label="Video subject">
            <label class="lane-video-subject-main">
              <p class="eyebrow">Video Subject</p>
              <strong>Who is in this video?</strong>
              <small>Guest or unknown clips ignore your profile defaults and rely on video analysis only.</small>
              <select id="lane-video-subject-select" name="video_subject">
                <option value="me">Active user</option>
                <option value="guest">Guest user</option>
              </select>
            </label>
            <div class="lane-video-guest-fields" data-lane-guest-fields hidden>
              <label>Guest name<input id="lane-guest-name" name="guest_user_name" autocomplete="name" placeholder="Guest bowler"></label>
              <label>Cell phone number<input id="lane-guest-phone" name="guest_user_phone" autocomplete="tel" inputmode="tel" placeholder="555-123-4567"></label>
            </div>
          </section>
          <div class="lane-video-panels">
            <div class="lane-video-panel is-active" data-lane-video-panel="recorded_video">
              <label>Recorded Shot
                <input id="lane-video-file" type="file" accept="video/mp4,video/quicktime,video/*">
              </label>
              <p id="lane-video-file-status" class="empty-state">Select a practice clip from your phone, tablet, or computer.</p>
            </div>
            <div class="lane-video-panel" data-lane-video-panel="live_video">
              <strong>Live Capture Preview</strong>
              <p>Start the camera to line up the lane before recording or running a development analysis.</p>
              <div class="lane-live-camera-shell">
                <video id="lane-live-video" muted playsinline autoplay></video>
                <div id="lane-live-placeholder">
                  <span>Camera Preview</span>
                  <small>Use the rear camera and keep the foul line, arrows, and pins in frame.</small>
                </div>
              </div>
              <div class="lane-live-actions">
                <button type="button" class="secondary-button" data-lane-live-preview>Start Camera</button>
                <button type="button" class="secondary-button" data-lane-live-stop>Stop Camera</button>
              </div>
              <p id="lane-live-status" class="empty-state">Camera is off.</p>
              <div id="lane-live-help" class="lane-live-help" hidden>
                <strong>Camera access is blocked for this browser.</strong>
                <p id="lane-live-help-copy">Open site settings for this page, set Camera to Allow, then reload StrikeIQ and press Start Camera again.</p>
                <button type="button" class="secondary-button" data-lane-recorded-fallback>Use Recorded Video</button>
              </div>
            </div>
          </div>
          <section class="lane-video-workflow" aria-label="Recorded video workflow">
            <article data-lane-workflow-step="select" class="is-active">
              <span>1</span>
              <strong>Select Clip</strong>
              <small>Choose one recorded shot from your phone, tablet, or computer.</small>
            </article>
            <article data-lane-workflow-step="analyze">
              <span>2</span>
              <strong>Analyze</strong>
              <small>Upload the clip and map the ball path to the lane markers.</small>
            </article>
            <article data-lane-workflow-step="review">
              <span>3</span>
              <strong>Review + Log</strong>
              <small>Check the visual, confirm the pin result, then save the shot.</small>
            </article>
            <p id="lane-video-workflow-status">Select a recorded shot to start the analysis workflow.</p>
          </section>
          <section class="lane-results-placeholder" data-lane-results-placeholder aria-label="Lane analysis placeholder">
            <span>Results Hidden</span>
            <strong>Analysis details will appear after upload.</strong>
            <p>Calibration, detection output, visual review, and recommendations stay collapsed until StrikeIQ analyzes the selected shot.</p>
          </section>
          <section class="lane-calibration-panel lane-auto-calibration" data-lane-analysis-detail hidden aria-label="Automatic lane calibration">
            <div class="lane-calibration-heading">
              <div>
                <p class="eyebrow">Setup</p>
                <h3>Auto Calibration</h3>
              </div>
              <span id="lane-calibration-status">Auto</span>
            </div>
            <div class="lane-auto-calibration-grid">
              <span>Foul line</span>
              <span>Arrows</span>
              <span>Lane edges</span>
              <span>Pin deck</span>
            </div>
            <div class="lane-calibration-actions">
              <p id="lane-calibration-summary" class="empty-state">Upload a recorded shot and StrikeIQ will detect the lane markers during analysis.</p>
            </div>
          </section>
          <div class="lane-detection-grid" data-lane-analysis-detail hidden>
            <article>
              <span>Lane Detection</span>
              <strong>Boards, arrows, breakpoint</strong>
              <small>Maps feet board, target board, breakpoint, and entry board.</small>
            </article>
            <article>
              <span>Ball Detection</span>
              <strong>Speed, hook, path</strong>
              <small>Tracks release speed, hook shape, boards crossed, and motion.</small>
            </article>
            <article>
              <span>Impact Detection</span>
              <strong>Pocket and pins</strong>
              <small>Reads pocket quality, pin result, miss direction, and leaves.</small>
            </article>
          </div>
          <div class="lane-detection-options" data-lane-analysis-detail hidden>
            <label><input type="checkbox" name="detect_lane" checked> Lane boards</label>
            <label><input type="checkbox" name="detect_ball" checked> Ball path</label>
            <label><input type="checkbox" name="detect_release" checked> Release point</label>
            <label><input type="checkbox" name="detect_pins" checked> Pin result</label>
          </div>
          <section id="lane-output-contract" class="lane-output-contract" data-lane-analysis-detail hidden aria-label="Lane tracker output contract"></section>
          <section class="lane-breakdown-panel" data-lane-analysis-detail hidden aria-label="Lane video visual breakdown">
            <div class="lane-breakdown-heading">
              <div>
                <p class="eyebrow">Visual Review</p>
                <h3>Shot Breakdown</h3>
              </div>
              <span id="lane-breakdown-state">Preview</span>
            </div>
            <div class="lane-breakdown-controls" aria-label="Visual review controls">
              <button type="button" data-lane-breakdown-view="2d">2D</button>
              <button type="button" data-lane-breakdown-view="3d">3D</button>
              <button type="button" data-lane-breakdown-rotate="-45" aria-label="Rotate left">Left</button>
              <button type="button" data-lane-breakdown-rotate="45" aria-label="Rotate right">Right</button>
              <button type="button" data-lane-breakdown-tilt="-8" aria-label="Lower view angle">Lower</button>
              <button type="button" data-lane-breakdown-tilt="8" aria-label="Raise view angle">Raise</button>
              <button type="button" data-lane-breakdown-zoom="1" aria-label="Zoom in">Zoom +</button>
              <button type="button" data-lane-breakdown-zoom="-1" aria-label="Zoom out">Zoom -</button>
              <button type="button" data-lane-breakdown-reset>Reset</button>
            </div>
            <div class="lane-review-stage">
              <section class="lane-source-review" aria-label="Source video review">
                <div class="lane-source-review-heading">
                  <span>Source Video</span>
                  <small id="lane-source-review-state">No clip selected</small>
                </div>
                <div class="lane-source-review-frame">
                  <video id="lane-source-review-video" muted playsinline controls preload="metadata"></video>
                  <svg id="lane-source-motion-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Detected ball path overlay"></svg>
                  <div id="lane-source-review-placeholder">
                    <span>Real shot video</span>
                    <small>Select a recording or start live camera to compare it with the visual breakdown.</small>
                  </div>
                </div>
              </section>
              <div id="lane-breakdown-visual" class="lane-breakdown-visual"></div>
            </div>
            <div id="lane-breakdown-metrics" class="lane-breakdown-metrics"></div>
            <section class="lane-track-correction" data-lane-analysis-detail hidden aria-label="Correct estimated ball track">
              <div class="lane-track-correction-heading">
                <div>
                  <p class="eyebrow">Correction</p>
                  <h3>Correct Track From Video</h3>
                </div>
                <span id="lane-track-correction-state">Estimate</span>
              </div>
              <p>Use these fields when the source video shows a different start line, arrow, breakpoint, entry, speed, or pin result.</p>
              <div class="lane-track-correction-grid">
                <label>Board start<input data-lane-track-correction="release_board" inputmode="decimal" placeholder="18"></label>
                <label>Arrow start<input data-lane-track-correction="arrows_board" inputmode="decimal" placeholder="12"></label>
                <label>Breakpoint<input data-lane-track-correction="breakpoint" placeholder="8 board at 42 ft"></label>
                <label>Entry board<input data-lane-track-correction="entry_board" inputmode="decimal" placeholder="17.5"></label>
                <label>Ball speed<input data-lane-track-correction="speed_mph" inputmode="decimal" placeholder="16.8"></label>
                <label>Pin result<input data-lane-track-correction="pin_result" placeholder="Strike, 10 pin, 2-8 leave"></label>
              </div>
              <div class="lane-track-correction-actions">
                <button type="button" class="secondary-button" data-lane-track-apply>Update Visual Track</button>
                <p id="lane-track-correction-status" class="empty-state">Development tracker estimates should be corrected against the actual video.</p>
              </div>
            </section>
            <div id="lane-ideal-movement" class="lane-ideal-movement"></div>
            <details class="lane-analysis-notes">
              <summary>Analysis notes</summary>
              <label>
                <span>Detection Summary</span>
                <textarea name="output_preview" id="lane-output-preview" placeholder="AI-generated lane and ball breakdown will appear here after backend video analysis is connected."></textarea>
              </label>
            </details>
            <section class="lane-analysis-share" data-lane-analysis-detail hidden aria-label="Share completed shot analysis">
              <div class="lane-analysis-share-heading">
                <div>
                  <p class="eyebrow">Share</p>
                  <h3>Send Completed Analysis</h3>
                </div>
                <span id="lane-analysis-share-state">Ready</span>
              </div>
              <div class="lane-analysis-share-grid">
                <label>
                  Send by
                  <select id="lane-analysis-share-method">
                    <option value="email">Email</option>
                    <option value="text">Text</option>
                  </select>
                </label>
                <label>
                  Recipient
                  <input id="lane-analysis-share-recipient" type="text" placeholder="coach@example.com or 555-123-4567">
                </label>
              </div>
              <label>
                Share message
                <textarea id="lane-analysis-share-message" readonly placeholder="Analyze a shot to prepare a shareable summary."></textarea>
              </label>
              <div class="lane-analysis-share-actions">
                <button type="button" class="secondary-button" data-lane-share-analysis>Prepare Message</button>
                <p id="lane-analysis-share-status" class="empty-state">Email and text use your device apps until backend delivery is connected.</p>
              </div>
            </section>
          </section>
          <div class="lane-video-actions">
            <button type="button" class="secondary-button" data-lane-video-analyze disabled>Upload And Analyze Video</button>
            <button type="button" class="secondary-button" data-lane-review-shot disabled>Review And Log Shot</button>
            <p id="lane-video-status" class="empty-state">Backend analysis workflow ready. Production vision detection connects after the model service is selected.</p>
          </div>
          <section class="lane-analysis-history" aria-label="Recent lane video analyses">
            <div class="lane-analysis-heading">
              <div>
                <p class="eyebrow">Review</p>
                <h3>Recent Analyses</h3>
              </div>
              <button type="button" class="secondary-button" data-refresh-lane-analyses>Refresh</button>
            </div>
            <div id="lane-analysis-history"></div>
          </section>
        </section>
        <div class="lane-form-heading">
          <h3 data-lane-tier="free">Log Basic Shot</h3>
          <h3 data-lane-tier="pro">Log One Shot</h3>
          <p data-lane-tier="free">Capture the four essentials from the shot so you can build a simple lane history.</p>
          <p data-lane-tier="pro">Use the profile defaults, then capture the shot result and next adjustment.</p>
        </div>
        <div class="form-row" data-lane-tier="pro">
          <label>Date<input type="date" name="session_date" id="lane-session-date"></label>
          <label>Center<input name="lane_center" id="lane-session-center" list="lane-center-options" placeholder="Home center or bowling alley"></label>
        </div>
        <div class="center-picker-tools lane-center-tools" data-lane-tier="pro">
          <button id="find-lane-centers" type="button">Find Nearby Centers</button>
          <select id="nearby-lane-centers" aria-label="Nearby lane tracker bowling centers">
            <option value="">Select a nearby center</option>
          </select>
          <p id="lane-center-status" class="empty-state">Type manually or use location to populate nearby bowling centers.</p>
          <datalist id="lane-center-options"></datalist>
        </div>
        <div class="form-row" data-lane-tier="pro">
          <label>Lane<input name="lane_number" placeholder="Pair 7-8 / lane 12"></label>
          <label>Game<input type="number" name="game_number" min="1" max="20" placeholder="1"></label>
          <label>Frame<input name="frame_number" placeholder="1-10"></label>
        </div>
        <div class="form-row" data-lane-tier="pro">
          <label>Ball
            <select name="ball" id="lane-shot-ball"></select>
          </label>
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
        <div class="form-row lane-basic-fields">
          <label>Board Start<input name="feet_board" placeholder="22"></label>
          <label>Arrow Start<input name="arrows_board" placeholder="12"></label>
        </div>
        <div class="form-row lane-basic-fields">
          <label>Ball Speed<input name="ball_speed" placeholder="16.5 mph"></label>
          <label>Pin Fall Result<input name="result" placeholder="Strike, 10 pin, split" required></label>
        </div>
        <section class="lane-result-workflow" aria-label="Shot result workflow">
          <div class="lane-result-heading">
            <div>
              <p class="eyebrow">Result</p>
              <h3>Quick Pin Fall</h3>
              <p>Select a common result or type your own. StrikeIQ auto-builds the adjustment and next move from the latest shot inputs.</p>
            </div>
            <span id="lane-auto-next-move-state">Auto next move</span>
          </div>
          <div class="lane-result-buttons" aria-label="Quick pin fall results">
            <button type="button" data-lane-result="Strike">Strike</button>
            <button type="button" data-lane-result="10 pin">10 Pin</button>
            <button type="button" data-lane-result="7 pin">7 Pin</button>
            <button type="button" data-lane-result="2-8 leave">2-8</button>
            <button type="button" data-lane-result="7-10 split">Split</button>
            <button type="button" data-lane-result-custom>Custom</button>
          </div>
          <div id="lane-shot-save-preview" class="lane-shot-save-preview"></div>
        </section>
        <div class="form-row" data-lane-tier="pro">
          <label>Breakpoint<input name="breakpoint" placeholder="8 downlane"></label>
        </div>
        <div class="analysis-panel" data-lane-tier="pro">
          <h3>Video Analysis</h3>
          <div class="form-row">
            <label>Video Name<input name="video_name" placeholder="Practice clip or upload name"></label>
            <label>Speed MPH<input type="number" name="speed_mph" min="0" step="0.01" placeholder="16.5"></label>
          </div>
          <div class="form-row">
            <label>Hook Inches<input type="number" name="hook_inches" step="0.01" placeholder="18.2"></label>
            <label>Boards Crossed<input type="number" name="boards_crossed" step="0.01" placeholder="17.1"></label>
          </div>
          <div class="form-row">
            <label>Release Board<input name="release_board" placeholder="18"></label>
            <label>Entry Board<input name="entry_board" placeholder="17.5"></label>
          </div>
          <div class="form-row">
            <label>Pocket Quality<input name="pocket_quality" placeholder="Flush, high, light"></label>
            <label>Pin Result<input name="pin_result" placeholder="Strike, 10 pin, split"></label>
          </div>
          <div class="form-row">
            <label>Confidence<input type="number" name="confidence" min="0" max="100" placeholder="100"></label>
            <label>Confidence Label<input name="confidence_label" placeholder="Good, Review"></label>
          </div>
        </div>
        <div class="form-row" data-lane-tier="pro">
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
        <label data-lane-tier="pro">Adjustment<textarea name="adjustment" placeholder="2 left with feet, slower speed, ball change"></textarea></label>
        <label data-lane-tier="pro">Next Move<textarea name="next_move" placeholder="Move feet, change ball, change speed, change target"></textarea></label>
        <label data-lane-tier="pro">Notes<textarea name="notes" placeholder="Reaction, carry, lane read, confidence"></textarea></label>
        <button type="submit">Log Shot</button>
      </form>
      <div id="lane-summary" class="project-metric"></div>
      <h3>Saved Lane History</h3>
      <div id="shot-list" class="project-list"></div>
    `,
  },
  chat: {
    eyebrow: "StrikeIQ Social",
    title: "Friends",
    description: "A bowling-first social feed for posts, score drops, video feedback, comments, and AI coaching.",
    content: `
      <div class="chat-workspace">
        <aside class="chat-sidebar">
          <strong>StrikeIQ Social</strong>
          <p>Follow lane talk, score drops, arsenal advice, and video feedback in one bowling-focused network.</p>
          <div id="social-profile-card" class="social-profile-card"></div>
          <div id="social-stats" class="social-stats"></div>
          <div id="chat-channel-list" class="chat-channel-list"></div>
        </aside>
        <section class="chat-feed">
          <div class="chat-section-heading">
            <div>
              <p class="eyebrow">Live Feed</p>
              <h3 id="active-channel-title"># video-feedback</h3>
            </div>
          </div>
          <form id="community-post-form" class="note-form project-form">
            <div class="form-row">
              <label>Channel<select name="channel" id="community-channel"></select></label>
              <label>Post type
                <select name="post_type" id="community-post-type">
                  <option value="update">Update</option>
                  <option value="video">Video feedback</option>
                  <option value="score">Score drop</option>
                  <option value="question">Question</option>
                  <option value="gear">Gear check</option>
                </select>
              </label>
            </div>
            <div class="form-row">
              <label>Title<input name="title" placeholder="League night recap" required></label>
              <label>Score / stat<input name="score" placeholder="236 game, 612 set, 82% spares"></label>
            </div>
            <label>Post<textarea name="body" placeholder="Share what happened, what you learned, or what help you want."></textarea></label>
            <div class="form-row">
              <label>Shot type<input name="shot_type" placeholder="League / Practice / Tournament / Spare"></label>
              <label>Video link<input name="video_url" placeholder="Paste YouTube, Drive, or Hudl link"></label>
            </div>
            <label>Feedback request<textarea name="feedback_request" placeholder="Ask for a read, release note, ball change idea, or spare plan."></textarea></label>
            <label>Tags<input name="tags" placeholder="league, transition, 10-pin"></label>
            <button type="submit">Publish Post</button>
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
          <div class="suggested-friends">
            <p class="eyebrow">Suggested</p>
            <strong>Practice Circle</strong>
            <span>League teammates, local bowlers, and coaches will appear here when account discovery is connected.</span>
          </div>
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

function defaultLaneDetection() {
  return { lane_boards: true, ball_path: true, release_point: true, pin_result: true };
}

function defaultLaneCalibration() {
  return {
    camera_angle: "behind_bowler",
    release_board_hint: "",
    target_board_hint: "",
    breakpoint_board_hint: "",
    markers: { foul_line: true, arrows: true, lane_edges: true, pin_deck: true },
    readiness: 100,
  };
}

function defaultUiSettings() {
  return {
    project: "hub",
    chatChannel: "# video-feedback",
    handedness: "right",
    targetPath: null,
    ballFilters: { search: "", condition: "all", cover: "all" },
    laneVideoMode: "recorded_video",
    laneDetection: defaultLaneDetection(),
    laneCalibration: defaultLaneCalibration(),
    laneBreakdownView: { mode: "3d", rotation: 0, zoom: 1, tilt: 58 },
    spareSession: null,
  };
}

function cleanTargetPath(value) {
  if (!value || typeof value !== "object") return null;
  return {
    releaseBoard: clamp(Number(value.releaseBoard) || 18, 1, 40),
    arrowsBoard: clamp(Number(value.arrowsBoard) || 12, 1, 40),
    breakpointBoard: clamp(Number(value.breakpointBoard) || 8, 1, 40),
  };
}

function cleanLaneBreakdownView(value) {
  const view = value && typeof value === "object" ? value : {};
  return {
    mode: view.mode === "2d" ? "2d" : "3d",
    rotation: Number(view.rotation) || 0,
    zoom: clamp(Number(view.zoom) || 1, 0.75, 1.65),
    tilt: clamp(Number(view.tilt) || 58, 38, 70),
  };
}

function cleanLaneCalibration(value) {
  const defaults = defaultLaneCalibration();
  const source = value && typeof value === "object" ? value : {};
  const markers = source.markers && typeof source.markers === "object" ? source.markers : {};
  const cleanMarkers = {
    foul_line: markers.foul_line !== false,
    arrows: markers.arrows !== false,
    lane_edges: markers.lane_edges !== false,
    pin_deck: markers.pin_deck !== false,
  };
  const visibleCount = Object.values(cleanMarkers).filter(Boolean).length;
  return {
    ...defaults,
    camera_angle: String(source.camera_angle || defaults.camera_angle),
    release_board_hint: String(source.release_board_hint || "").trim(),
    target_board_hint: String(source.target_board_hint || "").trim(),
    breakpoint_board_hint: String(source.breakpoint_board_hint || "").trim(),
    markers: cleanMarkers,
    readiness: Math.round((visibleCount / Object.keys(cleanMarkers).length) * 100),
  };
}

function cleanUiSettings(value = {}) {
  const defaults = defaultUiSettings();
  const source = value && typeof value === "object" ? value : {};
  const filters = source.ballFilters && typeof source.ballFilters === "object" ? source.ballFilters : {};
  const detection = source.laneDetection && typeof source.laneDetection === "object" ? source.laneDetection : {};
  return {
    ...defaults,
    project: projectDetails[source.project] || source.project === "patterns" ? source.project : defaults.project,
    chatChannel: chatChannels.some(([channel]) => channel === source.chatChannel) ? source.chatChannel : defaults.chatChannel,
    handedness: source.handedness === "left" ? "left" : "right",
    targetPath: cleanTargetPath(source.targetPath),
    ballFilters: {
      search: String(filters.search || ""),
      condition: String(filters.condition || "all"),
      cover: String(filters.cover || "all"),
    },
    laneVideoMode: source.laneVideoMode === "live_video" ? "live_video" : "recorded_video",
    laneDetection: {
      lane_boards: detection.lane_boards !== false,
      ball_path: detection.ball_path !== false,
      release_point: detection.release_point !== false,
      pin_result: detection.pin_result !== false,
    },
    laneCalibration: cleanLaneCalibration(source.laneCalibration),
    laneBreakdownView: cleanLaneBreakdownView(source.laneBreakdownView),
    spareSession: source.spareSession ? normalizeSpareSession(source.spareSession) : null,
  };
}

function cleanAppSettings(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  return {
    accountEmail: String(source.accountEmail || "").trim().toLowerCase(),
    profile: source.profile && typeof source.profile === "object" ? source.profile : null,
    subscriptionTier: source.subscriptionTier === "pro" ? "pro" : "free",
    ui: cleanUiSettings(source.ui),
  };
}

function savedAppSettings() {
  let stored = {};
  try {
    stored = JSON.parse(window.localStorage.getItem(storageKeys.appSettings) || "{}");
  } catch {
    stored = {};
  }
  const fallback = cleanAppSettings({
    accountEmail: window.localStorage.getItem(storageKeys.accountEmail) || "",
    profile: savedProfile(),
    subscriptionTier: savedSubscriptionTier(),
    ui: defaultUiSettings(),
  });
  return cleanAppSettings({
    ...fallback,
    ...stored,
    accountEmail: stored.accountEmail || fallback.accountEmail,
    profile: stored.profile || fallback.profile,
    subscriptionTier: stored.subscriptionTier || fallback.subscriptionTier,
    ui: { ...fallback.ui, ...(stored.ui || {}) },
  });
}

function mirrorAppSettings(settings) {
  window.localStorage.setItem(storageKeys.appSettings, JSON.stringify(settings));
  if (settings.accountEmail) {
    window.localStorage.setItem(storageKeys.accountEmail, settings.accountEmail);
  }
  if (settings.profile) {
    window.localStorage.setItem(storageKeys.profile, JSON.stringify(settings.profile));
  } else {
    window.localStorage.removeItem(storageKeys.profile);
  }
  window.localStorage.setItem(storageKeys.subscriptionTier, settings.subscriptionTier);
}

function applyAppSettings(settings) {
  const cleanSettings = cleanAppSettings(settings);
  state.userName = cleanSettings.accountEmail;
  state.profile = cleanSettings.profile;
  state.subscriptionTier = cleanSettings.subscriptionTier;
  state.project = cleanSettings.ui.project;
  state.chatChannel = cleanSettings.ui.chatChannel;
  state.handedness = cleanSettings.ui.handedness;
  state.targetPath = cleanSettings.ui.targetPath;
  state.ballFilters = cleanSettings.ui.ballFilters;
  state.laneVideoMode = cleanSettings.ui.laneVideoMode;
  state.laneDetection = cleanSettings.ui.laneDetection;
  state.laneCalibration = cleanSettings.ui.laneCalibration;
  state.laneBreakdownView = cleanSettings.ui.laneBreakdownView;
  state.spareSession = cleanSettings.ui.spareSession;
  mirrorAppSettings(cleanSettings);
}

function currentAppSettings() {
  return cleanAppSettings({
    accountEmail: state.userName || window.localStorage.getItem(storageKeys.accountEmail) || "",
    profile: state.profile || savedProfile(),
    subscriptionTier: state.subscriptionTier,
    ui: {
      project: state.project,
      chatChannel: state.chatChannel,
      handedness: state.handedness,
      targetPath: state.targetPath,
      ballFilters: state.ballFilters,
      laneVideoMode: state.laneVideoMode,
      laneDetection: state.laneDetection,
      laneCalibration: state.laneCalibration,
      laneBreakdownView: state.laneBreakdownView,
      spareSession: state.spareSession,
    },
  });
}

async function loadAppSettings() {
  const localSettings = savedAppSettings();
  try {
    const record = await api("/api/app-settings");
    applyAppSettings(record.updated_at ? record.payload : localSettings);
    if (!record.updated_at && localSettings.accountEmail) {
      queueAppSettingsSave();
    }
  } catch {
    applyAppSettings(localSettings);
  }
}

let appSettingsSaveTimer = 0;

async function persistAppSettingsNow() {
  const settings = currentAppSettings();
  mirrorAppSettings(settings);
  await api("/api/app-settings", {
    method: "POST",
    body: JSON.stringify({ settings }),
  });
}

function queueAppSettingsSave() {
  window.clearTimeout(appSettingsSaveTimer);
  appSettingsSaveTimer = window.setTimeout(() => {
    persistAppSettingsNow().catch(() => {});
  }, 350);
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

function sortedLocalCenters(latitude, longitude) {
  return bowlingCenters
    .map((center) => ({
      ...center,
      distance: Number.isFinite(latitude) && Number.isFinite(longitude)
        ? milesBetween(latitude, longitude, center.lat, center.lon)
        : center.distance,
    }))
    .sort((a, b) => (a.distance ?? Number.POSITIVE_INFINITY) - (b.distance ?? Number.POSITIVE_INFINITY));
}

async function nearbyCentersFromLocation(latitude, longitude) {
  const fallback = sortedLocalCenters(latitude, longitude).slice(0, 8);
  try {
    const liveCenters = await api(`/api/nearby-centers?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`);
    return Array.isArray(liveCenters) && liveCenters.length ? liveCenters : fallback;
  } catch {
    return fallback;
  }
}

function renderCenterOptions({ select, datalist, status }, centers, statusText) {
  if (!select && !datalist) return;
  if (select) {
    select.innerHTML = centers.length
      ? `<option value="">Select a nearby center</option>${centers
          .map((center) => {
            const distance = Number.isFinite(center.distance) ? ` - ${center.distance.toFixed(1)} mi` : "";
            return `<option value="${escapeHtml(center.name)}">${escapeHtml(center.name)}${distance}</option>`;
          })
          .join("")}`
      : `<option value="">No nearby centers found</option>`;
  }
  if (datalist) {
    datalist.innerHTML = centers
      .map((center) => `<option value="${escapeHtml(center.name)}">${escapeHtml(center.address)}</option>`)
      .join("");
  }
  if (status) {
    status.textContent = statusText;
  }
}

function renderHomeCenterOptions(centers, statusText) {
  renderCenterOptions(
    { select: elements.nearbyHomeCenters, datalist: elements.homeCenterOptions, status: elements.homeCenterStatus },
    centers,
    statusText,
  );
}

function laneCenterElements() {
  return {
    button: document.querySelector("#find-lane-centers"),
    input: document.querySelector("#lane-session-center"),
    select: document.querySelector("#nearby-lane-centers"),
    datalist: document.querySelector("#lane-center-options"),
    status: document.querySelector("#lane-center-status"),
  };
}

function renderLaneCenterOptions(centers, statusText) {
  const lane = laneCenterElements();
  renderCenterOptions(lane, centers, statusText);
}

function findNearbyCenters({ button, status, renderOptions, fallbackMessage, successMessage }) {
  if (!navigator.geolocation) {
    renderOptions(bowlingCenters.slice(0, 8), fallbackMessage);
    return;
  }

  if (button) button.disabled = true;
  if (status) status.textContent = "Requesting location permission...";
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      const centers = await nearbyCentersFromLocation(latitude, longitude);
      renderOptions(centers, successMessage);
      if (button) button.disabled = false;
    },
    () => {
      renderOptions(bowlingCenters.slice(0, 8), fallbackMessage);
      if (button) button.disabled = false;
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
  );
}

function findNearbyHomeCenters() {
  findNearbyCenters({
    button: elements.findHomeCenters,
    status: elements.homeCenterStatus,
    renderOptions: renderHomeCenterOptions,
    fallbackMessage: "Location permission was not available. Showing saved Arizona centers.",
    successMessage: "Closest bowling centers populated from your current location.",
  });
}

function findNearbyLaneCenters() {
  const lane = laneCenterElements();
  findNearbyCenters({
    button: lane.button,
    status: lane.status,
    renderOptions: renderLaneCenterOptions,
    fallbackMessage: "Location permission was not available. Showing saved bowling centers.",
    successMessage: "Closest bowling centers populated for this lane session.",
  });
}

function titleFromSlug(value) {
  return String(value || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.replace(/^\w/, (letter) => letter.toUpperCase()))
    .join(" ");
}

function emailUsername() {
  return (state.userName || "").split("@")[0] || "Bowler";
}

function displayNameForProfile(profile) {
  return hasProAccess() ? (profile?.displayName || emailUsername()) : emailUsername();
}

function profileCompletion(profile) {
  const profileForCompletion = { ...profile, displayName: displayNameForProfile(profile) };
  const keys = ["displayName", "homeCenter", "handedness", "delivery", "ballWeight", "ballArsenal"];
  const completed = keys.filter((key) => String(profileForCompletion?.[key] || "").trim()).length;
  return Math.round((completed / keys.length) * 100);
}

function currentProfileDraft() {
  updateProfileArsenalValue();
  const draft = elements.profileForm ? formPayload(elements.profileForm) : {};
  Object.keys(draft).forEach((key) => {
    draft[key] = String(draft[key] || "").trim();
  });
  if (!hasProAccess()) {
    draft.displayName = emailUsername();
  }
  return draft;
}

function profileRequirementItems(profile) {
  return [
    { label: "Username", complete: Boolean(displayNameForProfile(profile).trim()) },
    { label: "Bowling center", complete: Boolean(profile?.homeCenter) },
    { label: "Hand", complete: Boolean(profile?.handedness) },
    { label: "Delivery", complete: Boolean(profile?.delivery) },
    { label: "Ball weight", complete: Boolean(profile?.ballWeight) },
    { label: "Ball arsenal", complete: parseArsenalItems(profile?.ballArsenal).length >= Number(profile?.ballArsenalCount || 1) },
  ];
}

function renderProfileProgress() {
  if (!elements.profileProgress) return;
  const draft = currentProfileDraft();
  const items = profileRequirementItems(draft);
  const completeCount = items.filter((item) => item.complete).length;
  const percent = Math.round((completeCount / items.length) * 100);
  elements.profileProgress.innerHTML = `
    <div class="profile-progress-header">
      <span>Setup Progress</span>
      <strong>${percent}%</strong>
    </div>
    <meter min="0" max="100" value="${percent}">${percent}%</meter>
    <div class="profile-progress-list">
      ${items
        .map(
          (item) => `
            <span class="${item.complete ? "is-complete" : ""}">
              ${item.complete ? "Complete" : "Needed"}: ${escapeHtml(item.label)}
            </span>
          `
        )
        .join("")}
    </div>
  `;
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
  queueAppSettingsSave();
  renderAccessState();
  renderHomeDashboard();
  if (!elements.profileScreen.classList.contains("is-hidden")) {
    syncProfileUsernameAccess(savedProfile());
  }
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
    item.setAttribute("aria-label", `${item.textContent.trim()} ${isPro ? "unlocked" : "paid, Pro"}`);
  });

  document.querySelectorAll("[data-project-nav]").forEach((button) => {
    const locked = projectRequiresPro(button.dataset.projectNav) && !isPro;
    button.classList.toggle("is-locked", locked);
    if (locked) {
      button.setAttribute("aria-label", `${button.textContent.trim()} paid, Pro`);
    } else {
      button.removeAttribute("aria-label");
    }
  });
  renderLaneTierState();
}

function renderLaneTierState() {
  const isPro = hasProAccess();
  document.querySelectorAll("[data-lane-tier]").forEach((item) => {
    const tier = item.dataset.laneTier;
    const shouldShow = tier === "pro" ? isPro : !isPro;
    item.classList.toggle("is-hidden", !shouldShow);
    item.querySelectorAll("input, select, textarea, button").forEach((control) => {
      if (control.type === "hidden") return;
      control.disabled = !shouldShow;
    });
  });
  const shotForm = document.querySelector("#shot-form");
  if (shotForm) {
    shotForm.classList.toggle("is-free-tier", !isPro);
    shotForm.classList.toggle("is-pro-tier", isPro);
  }
  if (!isPro) {
    stopLaneLiveCamera(true);
    const trackingMode = document.querySelector("#lane-tracking-mode");
    const shotSource = document.querySelector("#lane-shot-source");
    if (trackingMode) trackingMode.value = "manual_basic";
    if (shotSource) shotSource.value = "free_basic";
  } else {
    const trackingMode = document.querySelector("#lane-tracking-mode");
    const shotSource = document.querySelector("#lane-shot-source");
    if (trackingMode) trackingMode.value = state.laneVideoMode || "recorded_video";
    if (shotSource) shotSource.value = "video_capture";
    syncLaneLiveAvailability(cameraSupportBlock());
    syncLaneVideoAnalyzeAvailability({ keepReview: state.laneVideoWorkflowStage === "review" });
  }
}

function showLoginScreen() {
  elements.loginScreen.classList.remove("is-hidden");
  elements.profileScreen.classList.add("is-hidden");
  elements.appShell.classList.add("is-hidden");
}

function syncProfileUsernameAccess(profile) {
  const isPro = hasProAccess();
  elements.profileName.readOnly = !isPro;
  elements.profileName.classList.toggle("is-readonly", !isPro);
  elements.profileName.value = isPro ? (profile?.displayName || emailUsername()) : emailUsername();
  if (elements.profileNameNote) {
    elements.profileNameNote.textContent = isPro
      ? "Pro accounts can edit and save a custom username."
      : "Free accounts use the name from the signup email. Upgrade to Pro to edit it.";
  }
}

function showProfileScreen() {
  const profile = savedProfile();
  syncProfileUsernameAccess(profile);
  elements.profileCenter.value = profile?.homeCenter || "";
  elements.profileHandedness.value = profile?.handedness || "right";
  elements.profileDelivery.value = profile?.delivery || "one-handed";
  elements.profileBallWeight.value = profile?.ballWeight || "";
  hydrateProfileArsenalFields(profile?.ballArsenal || "", profile?.ballArsenalCount);
  elements.profileError.textContent = "";
  elements.loginScreen.classList.add("is-hidden");
  elements.profileScreen.classList.remove("is-hidden");
  elements.appShell.classList.add("is-hidden");
  renderHomeCenterOptions(bowlingCenters.slice(0, 8), "");
  renderProfileProgress();
}

function showAppShell() {
  elements.loginScreen.classList.add("is-hidden");
  elements.profileScreen.classList.add("is-hidden");
  elements.appShell.classList.remove("is-hidden");
  renderAccessState();
  renderHomeDashboard();
  setProject(state.project || "hub", false);
}

function requireLogin() {
  const savedEmail = state.userName || window.localStorage.getItem(storageKeys.accountEmail);
  if (savedEmail) {
    state.userName = savedEmail;
    state.profile = state.profile || savedProfile();
    state.subscriptionTier = state.subscriptionTier || savedSubscriptionTier();
    showAppShell();
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
  const creatingAccount = authMode === "create";

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

  const savedEmail = window.localStorage.getItem(storageKeys.accountEmail);
  if (authMode === "login") {
    if (savedEmail && savedEmail !== email) {
      elements.loginError.textContent = "No local account found for that email. Create an account first.";
      return;
    }
  }

  if (creatingAccount && savedEmail && savedEmail !== email) {
    window.localStorage.removeItem(storageKeys.profile);
    state.profile = null;
  }

  window.localStorage.setItem(storageKeys.accountEmail, email);
  state.userName = email;
  state.subscriptionTier = creatingAccount ? "free" : savedSubscriptionTier();
  if (creatingAccount) {
    window.localStorage.setItem(storageKeys.subscriptionTier, "free");
  }
  elements.loginError.textContent = "";
  state.profile = creatingAccount ? null : (state.profile || savedProfile());
  queueAppSettingsSave();
  if (creatingAccount) {
    showProfileScreen();
  } else {
    showAppShell();
  }
}

function handleProfileSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  updateProfileArsenalValue();
  const profile = formPayload(form);
  Object.keys(profile).forEach((key) => {
    profile[key] = String(profile[key] || "").trim();
  });
  const arsenalCount = Math.max(1, Math.min(12, Number(profile.ballArsenalCount) || 1));
  const arsenalItems = parseArsenalItems(profile.ballArsenal);
  profile.ballArsenal = arsenalItems.join("\n");
  profile.ballArsenalCount = String(arsenalCount);
  if (!hasProAccess()) {
    profile.displayName = emailUsername();
  }

  if (!profile.displayName) {
    elements.profileError.textContent = "Username is required.";
    return;
  }

  if (!profile.homeCenter) {
    elements.profileError.textContent = "Current bowling center is required.";
    return;
  }

  if (!profile.ballWeight) {
    elements.profileError.textContent = "Ball weight is required.";
    return;
  }

  if (arsenalItems.length < arsenalCount) {
    elements.profileError.textContent = "Add one ball for each arsenal slot or lower the number of balls.";
    return;
  }

  const saved = savedProfile() || {};
  profile.bowlerStyle = saved.bowlerStyle || "balanced";
  profile.skillLevel = saved.skillLevel || "league";
  state.profile = profile;
  state.handedness = profile.handedness === "left" ? "left" : "right";
  window.localStorage.setItem(storageKeys.profile, JSON.stringify(profile));
  queueAppSettingsSave();
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

function setProject(project, persist = true) {
  state.project = project;
  elements.projectHub.classList.toggle("is-hidden", project !== "hub");
  elements.patternWorkspace.classList.toggle("is-hidden", project !== "patterns");
  elements.toolWorkspace.classList.toggle("is-hidden", project === "hub" || project === "patterns");

  document.querySelectorAll("[data-project-nav]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.projectNav === project);
  });
  updateMobileWorkspaceNav(project);

  if (project === "patterns") {
    if (persist) queueAppSettingsSave();
    return;
  }

  if (project !== "hub") {
    renderToolProject(project);
  }
  if (persist) queueAppSettingsSave();
}

function updateMobileWorkspaceNav(project) {
  elements.projectTabs?.classList.toggle("is-workspace-open", project !== "hub");
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
  const displayName = displayNameForProfile(profile);
  const handedness = profile.handedness === "left" ? "Left handed" : "Right handed";
  const delivery = titleFromSlug(profile.delivery || "one-handed");
  const completion = profileCompletion(profile);
  const ballCount = state.balls.length;
  const spareRate = Number(state.spares.rate || 0);
  const shotCount = Number(state.shotStats.total || state.shots.length);
  const videoCount = Number(state.shotStats.video_total || 0);
  const averageSpeed = state.shotStats.average_speed ? formatShotMetric(state.shotStats.average_speed, " mph") : "";
  const averageHook = state.shotStats.average_hook ? formatShotMetric(state.shotStats.average_hook, " in hook") : "";
  const isPro = hasProAccess();

  elements.homeGreeting.textContent = `Welcome, ${displayName}`;
  elements.homeSubcopy.textContent = [
    profile.homeCenter ? `Current center: ${profile.homeCenter}` : "Current center not set",
    handedness,
    delivery,
    `${shotCount} lane entries`,
  ].join(" | ");
  elements.homeTier.textContent = isPro ? "Pro" : "Free";
  elements.homeProfile.textContent = `${displayName}'s StrikeIQ home`;
  const readinessScore = Math.round(
    [
      completion,
      ballCount ? 100 : 0,
      shotCount ? 100 : 0,
      Number(state.spares.attempts || 0) ? 100 : 0,
    ].reduce((sum, value) => sum + value, 0) / 4
  );
  if (elements.homeProfileMeter) {
    elements.homeProfileMeter.innerHTML = `
      <div>
        <span>Readiness</span>
        <strong>${readinessScore}%</strong>
      </div>
      <meter min="0" max="100" value="${readinessScore}">${readinessScore}%</meter>
    `;
  }
  if (elements.homeProfileDetails) {
    const detailItems = [
      `${completion}% profile`,
      profile.homeCenter || "Center not set",
      handedness,
      delivery,
      profile.ballWeight,
      profile.ballArsenal && `${parseArsenalItems(profile.ballArsenal).length} arsenal balls`,
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
  if (completion < 100) {
    focus = "Complete your core profile so StrikeIQ can connect center, hand, delivery, arsenal, and ball weight context.";
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

  if (elements.homePriorityStrip) {
    const priorityItems = [
      {
        label: "Profile",
        value: `${completion}%`,
        status: completion >= 100 ? "Ready" : "Finish setup",
      },
      {
        label: "Arsenal",
        value: String(ballCount),
        status: ballCount ? "Catalog loaded" : "Add balls",
      },
      {
        label: "Lanes",
        value: String(shotCount),
        status: shotCount ? "History active" : "Track first shot",
      },
      {
        label: "Scoring",
        value: `${spareRate}%`,
        status: Number(state.spares.attempts || 0) ? "Conversions logged" : "Start scoring",
      },
    ];
    elements.homePriorityStrip.innerHTML = priorityItems
      .map(
        (item) => `
          <article>
            <span>${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(item.value)}</strong>
            <small>${escapeHtml(item.status)}</small>
          </article>
        `
      )
      .join("");
  }

  const nextActions = [
    {
      project: "shots",
      title: "Lane Tracker",
      text: videoCount
        ? `${videoCount} video-analyzed shots | ${averageSpeed || "speed pending"} | ${averageHook || "hook pending"}`
        : "Capture ball, target, breakpoint, result, and next move.",
      status: shotCount ? "Active" : "Start",
    },
    {
      project: "balls",
      title: "Ball Database",
      text: ballCount ? `${ballCount} balls available for tracking and coaching.` : "Create the ball data used by tracking and coaching.",
      status: ballCount ? "Ready" : "Build",
    },
    {
      project: "spares",
      title: "Scoring",
      text: Number(state.spares.attempts || 0)
        ? `${state.spares.makes}/${state.spares.attempts} spare makes | ${spareRate}% conversion.`
        : "Track frames, strikes, spares, speed, and scores.",
      status: Number(state.spares.attempts || 0) ? "Logged" : "Track",
    },
    {
      project: "chat",
      title: "Friends",
      text: "Use chat, video feedback, and coaching conversations.",
      status: "Connect",
    },
  ];

  elements.homeNextActions.innerHTML = nextActions
    .map((action, index) => {
      const isPrimary = focus.toLowerCase().includes(action.title.toLowerCase()) || (!index && shotCount);
      return `
        <button type="button" class="${isPrimary ? "is-primary" : ""}" data-project="${escapeHtml(action.project)}">
          <small>${escapeHtml(action.status)}</small>
          <strong>${escapeHtml(action.title)}</strong>
          <span>${escapeHtml(action.text)}</span>
        </button>
      `;
    })
    .join("");

  const recentItems = [
    ...state.shots.slice(0, 2).map((shot) => ({
      label: shot.shot_source === "video_analysis_import" ? "Video Shot" : "Shot",
      title: shot.result || "Shot logged",
      detail:
        [
          shot.session_date,
          shot.pattern_name,
          shot.ball,
          shot.speed_mph && `${formatShotMetric(shot.speed_mph, " mph")}`,
          shot.hook_inches && `${formatShotMetric(shot.hook_inches, " in hook")}`,
          shot.target,
        ]
          .filter(Boolean)
          .join(" | ") || "Shot details saved",
    })),
    ...(state.spares.spares || []).slice(0, 2).map((spare) => ({
      label: "Spare",
      title: spare.leave || "Spare logged",
      detail: [spare.created_at, `${spare.makes}/${spare.attempts} made`, spare.ball].filter(Boolean).join(" | "),
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
    const searchInput = document.querySelector("#ball-search");
    const conditionFilter = document.querySelector("#ball-condition-filter");
    const coverFilter = document.querySelector("#ball-cover-filter");
    if (searchInput) searchInput.value = state.ballFilters.search;
    if (conditionFilter) conditionFilter.value = state.ballFilters.condition;
    if (coverFilter) coverFilter.value = state.ballFilters.cover;
    renderBallDatabase();
    searchInput?.addEventListener("input", (event) => {
      state.ballFilters.search = event.target.value;
      renderBallDatabase();
      queueAppSettingsSave();
    });
    conditionFilter?.addEventListener("change", (event) => {
      state.ballFilters.condition = event.target.value;
      renderBallDatabase();
      queueAppSettingsSave();
    });
    coverFilter?.addEventListener("change", (event) => {
      state.ballFilters.cover = event.target.value;
      renderBallDatabase();
      queueAppSettingsSave();
    });
  } else if (project === "spares") {
    await loadSpares();
  } else if (project === "shots") {
    await loadBalls();
    await loadLaneVideoCapabilities();
    hydrateLaneTrackerForm();
    await loadShots();
  } else if (project === "chat") {
    await loadCommunityPosts();
  } else if (project === "add-pattern") {
    const status = document.querySelector("#custom-pattern-status");
    if (status) status.textContent = "Saved patterns are stored for Lane Tracker context.";
  }
}

function defaultLaneVideoCapabilities() {
  return {
    binary_upload: true,
    max_upload_mb: 500,
    analysis_engine: "development_estimator",
    model_status: "development_estimator",
    free_output: [
      { key: "feet_board", label: "Board start", source: "Manual" },
      { key: "arrows_board", label: "Arrow start", source: "Manual" },
      { key: "ball_speed", label: "Ball speed", source: "Manual or analyzer" },
      { key: "result", label: "Pin fall result", source: "Manual" },
    ],
    paid_output: [
      { key: "release_board", label: "Release board", source: "Lane calibration" },
      { key: "arrows_board", label: "Arrow board", source: "Lane detection" },
      { key: "breakpoint", label: "Breakpoint", source: "Ball path" },
      { key: "entry_board", label: "Entry board", source: "Impact path" },
      { key: "speed_mph", label: "Speed MPH", source: "Ball tracking" },
      { key: "hook_inches", label: "Hook inches", source: "Ball path" },
      { key: "boards_crossed", label: "Boards crossed", source: "Ball path" },
      { key: "pocket_quality", label: "Pocket quality", source: "Impact read" },
      { key: "pin_result", label: "Pin result", source: "Pin deck read" },
      { key: "confidence", label: "Confidence", source: "Analyzer" },
    ],
    production_model_path: [
      "Detect lane geometry from calibration markers",
      "Track ball center frame-by-frame",
      "Map pixel path to lane boards and feet",
      "Estimate speed, hook, breakpoint, and entry board",
      "Read pin deck result and confidence",
    ],
  };
}

async function loadLaneVideoCapabilities() {
  try {
    state.laneVideoCapabilities = await api("/api/lane-video/capabilities");
  } catch {
    state.laneVideoCapabilities = defaultLaneVideoCapabilities();
  }
}

function renderLaneOutputContract() {
  const container = document.querySelector("#lane-output-contract");
  if (!container) return;
  const capabilities = state.laneVideoCapabilities || defaultLaneVideoCapabilities();
  const freeOutput = Array.isArray(capabilities.free_output) ? capabilities.free_output : defaultLaneVideoCapabilities().free_output;
  const paidOutput = Array.isArray(capabilities.paid_output) ? capabilities.paid_output : defaultLaneVideoCapabilities().paid_output;
  const modelPath = Array.isArray(capabilities.production_model_path) ? capabilities.production_model_path : [];
  const engineLabel = String(capabilities.analysis_engine || "development_estimator").replace(/_/g, " ");
  const rawModelStatus = capabilities.model_status || "development_estimator";
  const modelStatus = rawModelStatus === "development_estimator"
    ? "Local estimator active"
    : "External model configured";
  container.innerHTML = `
    <div class="lane-output-heading">
      <div>
        <p class="eyebrow">Tracker Output</p>
        <h3>Free vs Paid Data</h3>
        <p>Free keeps the shot log simple. Paid stores the full backend analysis contract used by the video tracker.</p>
      </div>
      <span>${escapeHtml(modelStatus)} | ${escapeHtml(engineLabel)}</span>
    </div>
    <div class="lane-output-columns">
      <article>
        <strong>Free</strong>
        <p>Manual shot history with the four essentials.</p>
        <ul>${freeOutput.map((field) => `<li><b>${escapeHtml(field.label || field.key)}</b><span>${escapeHtml(field.source || field.key)}</span></li>`).join("")}</ul>
      </article>
      <article>
        <strong>Paid</strong>
        <p>Video-backed lane, ball, and pin breakdown.</p>
        <ul>${paidOutput.map((field) => `<li><b>${escapeHtml(field.label || field.key)}</b><span>${escapeHtml(field.source || field.key)}</span></li>`).join("")}</ul>
      </article>
      <article>
        <strong>Backend Path</strong>
        <p>${escapeHtml(capabilities.binary_upload ? `Video uploads up to ${capabilities.max_upload_mb || 500} MB are enabled.` : "Video uploads are not enabled.")}</p>
        <ol>${modelPath.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
      </article>
    </div>
  `;
}

function laneAnalysisHasResult() {
  const form = document.querySelector("#shot-form");
  if (!form) return false;
  const payload = formPayload(form);
  return Boolean(
    payload.analysis_run_id ||
    payload.speed_mph ||
    payload.hook_inches ||
    payload.boards_crossed ||
    payload.pocket_quality
  );
}

function setLaneAnalysisDetailsVisible(visible = laneAnalysisHasResult()) {
  const shouldShow = Boolean(visible);
  document.querySelectorAll("[data-lane-analysis-detail]").forEach((section) => {
    section.hidden = !shouldShow;
  });
  const placeholder = document.querySelector("[data-lane-results-placeholder]");
  if (placeholder) {
    placeholder.hidden = shouldShow;
  }
}

function renderLaneFreeSnapshot() {
  const container = document.querySelector("#lane-free-snapshot");
  if (!container) return;
  const form = document.querySelector("#shot-form");
  const payload = form ? formPayload(form) : {};
  const latest = Array.isArray(state.shots) ? state.shots[0] : null;
  const currentItems = [
    ["Board Start", payload.feet_board || "Not set"],
    ["Arrow Start", payload.arrows_board || "Not set"],
    ["Ball Speed", payload.ball_speed || "Not set"],
    ["Pin Fall Result", payload.result || "Not set"],
  ];
  const latestItems = [
    ["Last Board", latest?.feet_board || "No shot"],
    ["Last Arrow", latest?.arrows_board || "No shot"],
    ["Last Speed", latest?.ball_speed || latest?.speed_mph || "No shot"],
    ["Last Result", latest?.result || latest?.pin_result || "No shot"],
  ];
  container.innerHTML = `
    <div class="lane-free-snapshot-heading">
      <div>
        <p class="eyebrow">Basic Tracker</p>
        <h3>Free Shot Data</h3>
        <p>These are the four values saved for a free lane tracking entry.</p>
      </div>
      <span>Free</span>
    </div>
    <div class="lane-free-snapshot-grid">
      <article>
        <strong>Current Shot</strong>
        <div>
          ${currentItems.map(([label, value]) => `<span><b>${escapeHtml(label)}</b>${escapeHtml(value)}</span>`).join("")}
        </div>
      </article>
      <article>
        <strong>Last Saved</strong>
        <div>
          ${latestItems.map(([label, value]) => `<span><b>${escapeHtml(label)}</b>${escapeHtml(value)}</span>`).join("")}
        </div>
      </article>
    </div>
  `;
}

function lanePinResultState(value) {
  const standingPins = laneStandingPinsFromResult(value);
  if (standingPins === null) {
    return {
      standingLabel: "Awaiting result",
      fallenLabel: "Awaiting result",
      nextMove: "Select a result to preview standing pins and next move.",
    };
  }
  const standing = Array.from(standingPins).sort((a, b) => a - b);
  const fallen = Array.from({ length: 10 }, (_, index) => index + 1).filter((pin) => !standingPins.has(pin));
  return {
    standingLabel: standing.length ? standing.join(", ") : "None",
    fallenLabel: fallen.length ? fallen.join(", ") : "None",
    nextMove: standing.length
      ? `Review leave ${standing.join("-")} and log the adjustment after the shot.`
      : "Strike result: save the shot and compare ball motion to the target line.",
  };
}

function laneAdjustmentRecommendation(payload = {}) {
  const boardStart = laneMetricNumber(payload.release_board || payload.feet_board);
  const arrowStart = laneMetricNumber(payload.arrows_board);
  const speed = laneMetricNumber(payload.speed_mph || payload.ball_speed);
  const result = String(payload.pin_result || payload.result || "").trim();
  const resultText = result.toLowerCase();
  const profileContextAllowed = payload.use_profile_context !== false && payload.use_profile_context !== "false";
  const handedness = String(payload.handedness || payload.bowling_hand || (profileContextAllowed ? state.handedness : "unknown") || "right").toLowerCase();
  const hasKnownHand = handedness === "left" || handedness === "right";
  const isLeft = handedness === "left";
  const direction = (rightText, leftText, neutralText = "inside") => (hasKnownHand ? (isLeft ? leftText : rightText) : neutralText);
  const lineShape = Number.isFinite(boardStart) && Number.isFinite(arrowStart)
    ? Math.abs(boardStart - arrowStart)
    : null;
  const speedCue = Number.isFinite(speed)
    ? (speed >= 18 ? "Speed is on the quick side, so a slower roll may help the ball finish."
      : speed <= 15 ? "Speed is on the slower side, so more speed can hold the line."
      : "Speed is in a playable range; start with a small feet or target move.")
    : "Add measured speed to tighten this recommendation.";
  const lineCue = lineShape !== null
    ? `Shot shape used board ${Math.round(boardStart * 10) / 10} to arrow ${Math.round(arrowStart * 10) / 10}.`
    : "Board start and arrow start are needed for a tighter board move.";

  let title = "Add Result";
  let adjustment = "Log the pin fall result, then StrikeIQ will suggest a first move.";
  let nextMove = "Record board start, arrow start, speed, and pin fall after the shot.";
  let priority = "Pending";

  if (/\b(strike|flush|all\s*down)\b/.test(resultText)) {
    title = "Repeat The Look";
    adjustment = "Stay with the same board start, arrow start, and speed.";
    nextMove = "Repeat this shot once. If carry stays strong, keep the line; if corners appear, adjust from the next result.";
    priority = "Hold";
  } else if (/\b4\b/.test(resultText) || /\bhigh\b/.test(resultText)) {
    title = "High Pocket Read";
    adjustment = `Move feet 1-2 boards ${direction("left", "right")} and keep the same arrow, or add 0.3-0.5 mph.`;
    nextMove = "Create a little more hold through the heads so the ball does not enter high.";
    priority = "Move off the hook";
  } else if (/\b10\b/.test(resultText) || /\b7\b/.test(resultText)) {
    const isWeakCorner = (isLeft && /\b7\b/.test(resultText)) || (!isLeft && /\b10\b/.test(resultText));
    title = isWeakCorner ? "Weak Corner Leave" : "Fast Corner Leave";
    adjustment = isWeakCorner
      ? `Move feet 1 board ${direction("right", "left")} or slow speed 0.3 mph to improve entry angle.`
      : `Move feet 1 board ${direction("left", "right")} or add 0.3 mph to control the face.`;
    nextMove = isWeakCorner
      ? "Help the ball finish slightly stronger through the pocket."
      : "Hold pocket shape without letting the ball jump high.";
    priority = "Corner carry";
  } else if (/\b2[-\s]?8\b|\b2\b|\b8\b|\blight\b/.test(resultText)) {
    title = "Light Pocket Read";
    adjustment = `Move feet 1-2 boards ${direction("right", "left")} or slow speed 0.3-0.5 mph.`;
    nextMove = "Give the ball more time to read and recover to the pocket.";
    priority = "Get back to pocket";
  } else if (/\bsplit|washout|bucket\b/.test(resultText)) {
    title = "Major Leave";
    adjustment = "Make a 2-board move toward the miss and reduce the launch angle before changing balls.";
    nextMove = "Stabilize pocket contact first, then compare ball reaction on the next shot.";
    priority = "Control pocket";
  } else if (result) {
    title = "Review The Leave";
    adjustment = "Make a 1-board move toward the pocket and keep speed as close as possible.";
    nextMove = "Use the next shot to confirm whether the leave was angle, speed, or carry related.";
    priority = "Small move";
  }

  return {
    title,
    priority,
    adjustment,
    nextMove,
    cues: [lineCue, speedCue, result ? `Pin fall: ${result}.` : "Pin fall result is not set."],
  };
}

function syncLaneRecommendationFields(payload = {}, { overwrite = false } = {}) {
  const form = document.querySelector("#shot-form");
  if (!form) return;
  const recommendation = laneAdjustmentRecommendation(payload);
  const adjustmentField = form.elements.adjustment;
  const nextMoveField = form.elements.next_move;
  if (adjustmentField && (overwrite || !adjustmentField.value.trim())) {
    adjustmentField.value = recommendation.adjustment;
  }
  if (nextMoveField && (overwrite || !nextMoveField.value.trim())) {
    nextMoveField.value = recommendation.nextMove;
  }
}

const laneRecommendationDriverFields = new Set([
  "feet_board",
  "arrows_board",
  "ball_speed",
  "result",
  "speed_mph",
  "release_board",
  "entry_board",
  "pocket_quality",
  "pin_result",
  "miss_direction",
  "leave_pin",
]);

function laneRecommendationDriverChanged(target) {
  const field = target?.closest?.("input, select, textarea");
  return Boolean(field?.form?.id === "shot-form" && laneRecommendationDriverFields.has(field.name));
}

function updateLaneAutoNextMoveState(message = "") {
  const stateLabel = document.querySelector("#lane-auto-next-move-state");
  if (!stateLabel) return;
  stateLabel.textContent = message || state.laneAutoNextMoveSource || "Auto next move";
}

function syncLaneAutoNextMove({ overwrite = true, source = "" } = {}) {
  const form = document.querySelector("#shot-form");
  if (!form) return;
  state.laneAutoNextMoveSource = source || "Auto from latest shot";
  syncLaneRecommendationFields(formPayload(form), { overwrite });
  updateLaneAutoNextMoveState(state.laneAutoNextMoveSource);
}

function renderLaneShotSavePreview() {
  const preview = document.querySelector("#lane-shot-save-preview");
  const form = document.querySelector("#shot-form");
  if (!preview || !form) return;
  const payload = formPayload(form);
  const resultState = lanePinResultState(payload.pin_result || payload.result);
  const recommendation = laneAdjustmentRecommendation(payload);
  const previewItems = [
    ["Board Start", payload.feet_board || "Not set"],
    ["Arrow Start", payload.arrows_board || "Not set"],
    ["Ball Speed", payload.ball_speed || payload.speed_mph || "Not set"],
    ["Result", payload.result || payload.pin_result || "Not set"],
    ["Standing Pins", resultState.standingLabel],
    ["Fallen Pins", resultState.fallenLabel],
  ];
  preview.innerHTML = `
    <div class="lane-shot-save-heading">
      <strong>Save Preview</strong>
      <span>${escapeHtml(payload.result || payload.pin_result ? "Ready" : "Needs result")}</span>
    </div>
    <div class="lane-shot-save-grid">
      ${previewItems.map(([label, value]) => `<span><b>${escapeHtml(label)}</b>${escapeHtml(value)}</span>`).join("")}
    </div>
    <article class="lane-adjustment-recommendation">
      <div>
        <span>${escapeHtml(recommendation.priority)}</span>
        <strong>${escapeHtml(recommendation.title)}</strong>
      </div>
      <p><b>Adjustment:</b> ${escapeHtml(recommendation.adjustment)}</p>
      <p><b>Next move:</b> ${escapeHtml(payload.next_move || recommendation.nextMove)}</p>
      <small>${recommendation.cues.map(escapeHtml).join(" | ")}</small>
    </article>
    <p>${escapeHtml(payload.next_move || resultState.nextMove)}</p>
  `;
}

function applyLaneQuickResult(value) {
  const resultInput = document.querySelector("input[name='result']");
  const pinResultInput = document.querySelector("input[name='pin_result']");
  const leaveInput = document.querySelector("input[name='leave_pin']");
  if (resultInput) resultInput.value = value;
  if (pinResultInput) pinResultInput.value = value;
  if (leaveInput) {
    leaveInput.value = value && !/\bstrike\b/i.test(value) ? value : "";
  }
  syncLaneAutoNextMove({ overwrite: true, source: value ? `Auto from ${value}` : "Auto from latest shot" });
  renderLaneFreeSnapshot();
  renderLaneShotSavePreview();
  renderLaneBreakdownVisual();
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
  const lane = laneCenterElements();
  if (lane.datalist && !lane.datalist.children.length) {
    renderLaneCenterOptions(bowlingCenters.slice(0, 8), "Type manually or use location to populate nearby bowling centers.");
  }
  const ballSelect = document.querySelector("#lane-shot-ball");
  if (ballSelect) {
    const currentValue = ballSelect.value;
    const arsenalItems = profileArsenalItems();
    const catalogItems = state.balls
      .map((ball) => [ball.brand, ball.name].filter(Boolean).join(" "))
      .filter(Boolean);
    const options = [...arsenalItems, ...catalogItems].filter((item, index, items) => {
      return items.findIndex((candidate) => candidate.toLowerCase() === item.toLowerCase()) === index;
    });
    ballSelect.innerHTML = [
      `<option value="">Select ball</option>`,
      ...options.map((ball) => `<option value="${escapeHtml(ball)}">${escapeHtml(ball)}${arsenalItems.includes(ball) ? " - profile" : ""}</option>`),
    ].join("");
    ballSelect.value = options.includes(currentValue) ? currentValue : arsenalItems[0] || "";
  }
  renderLaneTrackerContext();
  renderLaneFreeSnapshot();
  renderLaneShotSavePreview();
  updateLaneAutoNextMoveState();
  hydrateLaneSettingsControls();
  updateLaneVideoMode(state.laneVideoMode);
  updateLaneCalibrationSummary();
  renderLaneOutputContract();
  renderLaneBreakdownVisual();
  setLaneAnalysisDetailsVisible(laneAnalysisHasResult());
  renderLaneTierState();
}

function hydrateLaneSettingsControls() {
  const calibration = cleanLaneCalibration(state.laneCalibration);
  const detection = { ...defaultLaneDetection(), ...(state.laneDetection || {}) };
  state.laneCalibration = calibration;
  state.laneDetection = detection;

  document.querySelectorAll("input[name='tracking_mode_choice']").forEach((input) => {
    input.checked = input.value === state.laneVideoMode;
  });
  const trackingMode = document.querySelector("#lane-tracking-mode");
  if (trackingMode) trackingMode.value = state.laneVideoMode;

  const cameraAngle = document.querySelector("#lane-camera-angle");
  if (cameraAngle) cameraAngle.value = calibration.camera_angle;
  const calibrationFields = [
    ["#lane-calibration-release", calibration.release_board_hint],
    ["#lane-calibration-target", calibration.target_board_hint],
    ["#lane-calibration-breakpoint", calibration.breakpoint_board_hint],
  ];
  calibrationFields.forEach(([selector, value]) => {
    const input = document.querySelector(selector);
    if (input) input.value = value;
  });
  const markerFields = [
    ["#lane-calibration-foul", calibration.markers.foul_line],
    ["#lane-calibration-arrows", calibration.markers.arrows],
    ["#lane-calibration-edges", calibration.markers.lane_edges],
    ["#lane-calibration-pins", calibration.markers.pin_deck],
  ];
  markerFields.forEach(([selector, checked]) => {
    const input = document.querySelector(selector);
    if (input) input.checked = checked;
  });
  const detectionFields = [
    ["input[name='detect_lane']", detection.lane_boards],
    ["input[name='detect_ball']", detection.ball_path],
    ["input[name='detect_release']", detection.release_point],
    ["input[name='detect_pins']", detection.pin_result],
  ];
  detectionFields.forEach(([selector, checked]) => {
    const input = document.querySelector(selector);
    if (input) input.checked = checked;
  });
}

function renderLaneTrackerContext() {
  const container = document.querySelector("#lane-profile-context");
  if (!container) return;
  const profile = state.profile || savedProfile() || {};
  const arsenalItems = profileArsenalItems(profile);
  const detailItems = [
    profile.homeCenter ? `Center: ${profile.homeCenter}` : "Center not set",
    profile.handedness === "left" ? "Left handed" : "Right handed",
    titleFromSlug(profile.delivery || "one-handed"),
    profile.ballWeight ? `Ball weight: ${profile.ballWeight}` : "Ball weight not set",
    `${arsenalItems.length} arsenal balls`,
  ];
  container.innerHTML = `
    <div>
      <p class="eyebrow">Profile Defaults</p>
      <h3>${escapeHtml(profile.homeCenter || "Set your bowling center")}</h3>
      <p>${escapeHtml(arsenalItems.length ? "Lane Tracker is using your saved profile and arsenal." : "Add your arsenal in Profile Setup so shot logging can use your bowling balls.")}</p>
    </div>
    <div class="lane-profile-chips">
      ${detailItems.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
    </div>
    ${arsenalItems.length ? `
      <div class="lane-arsenal-strip" aria-label="Profile arsenal">
        ${arsenalItems.map((ball) => `<button type="button" data-lane-ball="${escapeHtml(ball)}">${escapeHtml(ball)}</button>`).join("")}
      </div>
    ` : ""}
    <button type="button" class="secondary-button" data-edit-profile>Edit Profile</button>
  `;
}

function updateLaneVideoMode(mode = document.querySelector("input[name='tracking_mode_choice']:checked")?.value || state.laneVideoMode || "recorded_video", persist = false) {
  const requestedMode = mode === "live_video" ? "live_video" : "recorded_video";
  const liveSupportBlock = cameraSupportBlock();
  const shouldUseRecordedFallback = requestedMode === "live_video" && liveSupportBlock;
  state.laneVideoMode = shouldUseRecordedFallback ? "recorded_video" : requestedMode;
  const trackingMode = document.querySelector("#lane-tracking-mode");
  const modeLabel = document.querySelector("#lane-video-mode-label");
  const status = document.querySelector("#lane-video-status");
  if (trackingMode) trackingMode.value = state.laneVideoMode;
  document.querySelectorAll("input[name='tracking_mode_choice']").forEach((input) => {
    const isUnavailableLiveMode = input.value === "live_video" && Boolean(liveSupportBlock);
    input.disabled = isUnavailableLiveMode;
    input.checked = input.value === state.laneVideoMode;
    input.closest("label")?.classList.toggle("is-disabled", isUnavailableLiveMode);
    if (input.value === "live_video" && input.nextElementSibling) {
      input.nextElementSibling.textContent = isUnavailableLiveMode ? "Live Camera (Expo Later)" : "Live Camera";
    }
  });
  if (modeLabel) modeLabel.textContent = state.laneVideoMode === "live_video" ? "Live Camera" : "Recorded Video";
  document.querySelectorAll("[data-lane-video-panel]").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.laneVideoPanel === state.laneVideoMode);
  });
  if (status) {
    status.textContent = shouldUseRecordedFallback
      ? `${liveSupportBlock.status} Recorded Video is selected for this device.`
      : (state.laneVideoMode === "live_video"
      ? "Live camera mode selected. Tap Start Camera to preview the lane, or Upload And Analyze Video to create a development analysis."
      : "Recorded video mode selected. Choose a clip, then run backend analysis.");
  }
  syncLaneLiveAvailability(liveSupportBlock);
  if (state.laneVideoMode === "live_video") {
    setLaneLiveStatus("Camera is off.", false);
  } else {
    hideLaneLiveHelp();
  }
  if (state.laneVideoMode !== "live_video") {
    stopLaneLiveCamera(true);
  }
  if (persist) {
    setLaneAnalysisDetailsVisible(false);
  }
  syncLaneVideoAnalyzeAvailability();
  if (persist) queueAppSettingsSave();
}

async function startLaneLiveCamera() {
  const supportBlock = cameraSupportBlock();
  if (supportBlock) {
    updateLaneVideoMode("recorded_video", true);
    return;
  }
  updateLaneVideoMode("live_video", true);
  const video = document.querySelector("#lane-live-video");
  const placeholder = document.querySelector("#lane-live-placeholder");
  if (!video) return;
  const permission = await cameraPermissionState();
  if (permission === "denied") {
    setLaneLiveStatus(
      "Camera is blocked for this site.",
      true,
      "Allow Camera in Safari or browser site settings, reload StrikeIQ, then try again. On iPhone, live camera also requires HTTPS or a native Expo camera build."
    );
    return;
  }
  stopLaneLiveCamera(true);
  setLaneLiveStatus("Requesting camera permission...");
  const permissionTimer = window.setTimeout(() => {
    if (!state.laneLiveStream) {
      setLaneLiveStatus("Waiting for camera permission. Choose Allow in the browser prompt, or use recorded video upload.", true);
    }
  }, 1400);
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
    window.clearTimeout(permissionTimer);
    state.laneLiveStream = stream;
    video.srcObject = stream;
    video.classList.add("is-active");
    if (placeholder) placeholder.classList.add("is-hidden");
    setLaneSourceReviewLive(stream);
    setLaneLiveStatus("Live preview active. Keep the lane markers visible before analysis.");
  } catch (error) {
    const guidance = cameraErrorGuidance(error);
    window.clearTimeout(permissionTimer);
    setLaneLiveStatus(guidance.status, true, guidance.help);
  }
}

function stopLaneLiveCamera(silent = false) {
  if (state.laneLiveStream) {
    state.laneLiveStream.getTracks().forEach((track) => track.stop());
    state.laneLiveStream = null;
  }
  const video = document.querySelector("#lane-live-video");
  const placeholder = document.querySelector("#lane-live-placeholder");
  const status = document.querySelector("#lane-live-status");
  if (video) {
    video.pause();
    video.srcObject = null;
    video.classList.remove("is-active");
  }
  clearLaneSourceReview({ keepRecorded: state.laneVideoMode === "recorded_video" });
  if (placeholder) placeholder.classList.remove("is-hidden");
  if (!silent && status) setLaneLiveStatus("Camera stopped.");
}

async function cameraPermissionState() {
  try {
    const permission = await navigator.permissions?.query({ name: "camera" });
    return permission?.state || "";
  } catch {
    return "";
  }
}

function isLocalBrowserHost() {
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

function isIosBrowser() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function cameraSupportBlock() {
  if (!window.isSecureContext && !isLocalBrowserHost()) {
    const deviceName = isIosBrowser() ? "iPhone/iPad" : "This device";
    return {
      status: "Live camera needs HTTPS or Expo Camera.",
      help: `${deviceName} blocks camera on HTTP. Use Recorded Video for now.`,
    };
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return {
      status: "Camera preview is not available in this browser.",
      help: "Use Recorded Video for now. Live camera needs HTTPS or Expo Camera.",
    };
  }
  return null;
}

function cameraErrorGuidance(error) {
  const supportBlock = cameraSupportBlock();
  if (supportBlock) return supportBlock;
  if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
    return {
      status: "Camera permission was blocked.",
      help: "Allow Camera in Safari or browser site settings, reload StrikeIQ, then try again. If this is iPhone over a local HTTP address, use Recorded Video until the app is running through HTTPS or Expo Camera.",
    };
  }
  if (error?.name === "NotFoundError" || error?.name === "OverconstrainedError") {
    return {
      status: "No compatible camera was found.",
      help: "Check that the device has an available camera and that another app is not using it. You can still use Recorded Video upload.",
    };
  }
  if (error?.name === "NotReadableError") {
    return {
      status: "The camera is already in use or unavailable.",
      help: "Close other camera apps, reload StrikeIQ, and try again. Recorded Video remains available.",
    };
  }
  return {
    status: "Camera could not start on this device.",
    help: "Use Recorded Video upload for now. Live camera should move to Expo Camera or a secure HTTPS browser session for iPhone testing.",
  };
}

function setLaneLiveStatus(message, showHelp = false, helpMessage = "") {
  const status = document.querySelector("#lane-live-status");
  const mainStatus = document.querySelector("#lane-video-status");
  const help = document.querySelector("#lane-live-help");
  const helpCopy = document.querySelector("#lane-live-help-copy");
  if (status) status.textContent = message;
  if (mainStatus) mainStatus.textContent = message;
  if (helpCopy && helpMessage) helpCopy.textContent = helpMessage;
  if (help) help.hidden = !showHelp;
}

function hideLaneLiveHelp() {
  const help = document.querySelector("#lane-live-help");
  if (help) help.hidden = true;
}

function syncLaneLiveAvailability(supportBlock = null) {
  const livePanel = document.querySelector("[data-lane-video-panel='live_video']");
  const startButton = document.querySelector("[data-lane-live-preview]");
  const stopButton = document.querySelector("[data-lane-live-stop]");
  const unavailable = Boolean(supportBlock);
  if (livePanel) {
    livePanel.classList.toggle("is-camera-unavailable", unavailable);
  }
  if (startButton) {
    startButton.disabled = unavailable;
    startButton.hidden = unavailable;
    startButton.classList.toggle("is-unavailable", unavailable);
    startButton.setAttribute("aria-disabled", unavailable ? "true" : "false");
    startButton.textContent = unavailable ? "Camera Unavailable" : "Start Camera";
  }
  if (stopButton) {
    stopButton.disabled = unavailable;
    stopButton.hidden = unavailable;
    stopButton.classList.toggle("is-unavailable", unavailable);
    stopButton.setAttribute("aria-disabled", unavailable ? "true" : "false");
  }
}

function setLaneVideoWorkflow(stage = "select", message = "") {
  const stages = ["select", "analyze", "review"];
  const activeIndex = Math.max(0, stages.indexOf(stage));
  state.laneVideoWorkflowStage = stages[activeIndex];
  document.querySelectorAll("[data-lane-workflow-step]").forEach((step) => {
    const index = stages.indexOf(step.dataset.laneWorkflowStep);
    step.classList.toggle("is-active", index === activeIndex);
    step.classList.toggle("is-complete", index >= 0 && index < activeIndex);
  });
  const status = document.querySelector("#lane-video-workflow-status");
  if (status) {
    const fallbackMessages = {
      select: "Select a recorded shot to start the analysis workflow.",
      analyze: "Clip selected. Run analysis to create the lane and ball breakdown.",
      review: "Analysis ready. Review the visual and log the shot when the result looks right.",
    };
    status.textContent = message || fallbackMessages[state.laneVideoWorkflowStage];
  }
}

function syncLaneVideoAnalyzeAvailability({ keepReview = false } = {}) {
  const file = document.querySelector("#lane-video-file")?.files?.[0];
  const analyzeButton = document.querySelector("[data-lane-video-analyze]");
  const reviewButton = document.querySelector("[data-lane-review-shot]");
  const isRecorded = state.laneVideoMode !== "live_video";
  const fileTooLarge = Boolean(file && file.size > maxLaneVideoUploadBytes);
  const readyToAnalyze = !isRecorded || Boolean(file && !fileTooLarge);
  if (analyzeButton) {
    analyzeButton.disabled = !readyToAnalyze;
    analyzeButton.textContent = isRecorded ? "Analyze Recorded Video" : "Analyze Live Preview";
  }
  if (reviewButton) {
    reviewButton.disabled = state.laneVideoWorkflowStage !== "review";
  }
  if (keepReview && state.laneVideoWorkflowStage === "review") return;
  if (isRecorded && !file) {
    setLaneVideoWorkflow("select", "Select a recorded shot to start the analysis workflow.");
  } else if (fileTooLarge) {
    setLaneVideoWorkflow("select", `Choose a smaller clip. Local uploads are limited to ${formatBytes(maxLaneVideoUploadBytes)}.`);
  } else {
    setLaneVideoWorkflow("analyze", isRecorded ? `${file.name} is ready to analyze.` : "Live preview can create a development analysis.");
  }
  if (reviewButton) {
    reviewButton.disabled = state.laneVideoWorkflowStage !== "review";
  }
}

function handleLaneVideoFile(fileInput) {
  const status = document.querySelector("#lane-video-file-status");
  const videoName = document.querySelector("input[name='video_name']");
  const uploadId = document.querySelector("#lane-video-upload-id");
  const file = fileInput.files?.[0];
  if (uploadId) uploadId.value = "";
  state.laneVideoAnalysisFields = null;
  syncLaneAnalysisShareMessage();
  setLaneAnalysisDetailsVisible(false);
  if (!file) {
    if (status) status.textContent = "Select a practice clip from your phone, tablet, or computer.";
    clearLaneSourceReview();
    syncLaneVideoAnalyzeAvailability();
    return;
  }
  if (status) {
    status.textContent = file.size > maxLaneVideoUploadBytes
      ? `${file.name} is selected, but local uploads are limited to ${formatBytes(maxLaneVideoUploadBytes)}.`
      : `${file.name} selected for upload and analysis.`;
  }
  if (videoName && !videoName.value) {
    videoName.value = file.name.replace(/\.[^.]+$/, "");
  }
  setLaneSourceReviewFile(file);
  syncLaneVideoAnalyzeAvailability();
}

function setLaneSourceReviewFile(file) {
  const video = document.querySelector("#lane-source-review-video");
  const placeholder = document.querySelector("#lane-source-review-placeholder");
  const label = document.querySelector("#lane-source-review-state");
  if (!video || !file) return;
  if (state.laneReviewVideoUrl) {
    URL.revokeObjectURL(state.laneReviewVideoUrl);
  }
  state.laneReviewVideoUrl = URL.createObjectURL(file);
  video.pause();
  video.srcObject = null;
  video.src = state.laneReviewVideoUrl;
  video.classList.add("is-active");
  bindLaneSourceReviewSync(video);
  updateLaneVisualSync(0);
  if (placeholder) placeholder.classList.add("is-hidden");
  if (label) label.textContent = file.name;
}

function setLaneSourceReviewLive(stream) {
  const video = document.querySelector("#lane-source-review-video");
  const placeholder = document.querySelector("#lane-source-review-placeholder");
  const label = document.querySelector("#lane-source-review-state");
  if (!video || !stream) return;
  if (state.laneReviewVideoUrl) {
    URL.revokeObjectURL(state.laneReviewVideoUrl);
    state.laneReviewVideoUrl = null;
  }
  video.pause();
  video.removeAttribute("src");
  video.srcObject = stream;
  video.classList.add("is-active");
  bindLaneSourceReviewSync(video);
  updateLaneVisualSync(0);
  if (placeholder) placeholder.classList.add("is-hidden");
  if (label) label.textContent = "Live camera";
}

function clearLaneSourceReview({ keepRecorded = false } = {}) {
  const file = document.querySelector("#lane-video-file")?.files?.[0];
  if (keepRecorded && file) {
    setLaneSourceReviewFile(file);
    return;
  }
  const video = document.querySelector("#lane-source-review-video");
  const placeholder = document.querySelector("#lane-source-review-placeholder");
  const label = document.querySelector("#lane-source-review-state");
  stopLaneVisualSyncLoop();
  state.laneReviewSyncProgress = 0;
  if (video) {
    video.pause();
    video.srcObject = null;
    video.removeAttribute("src");
    video.load();
    video.classList.remove("is-active");
  }
  if (state.laneReviewVideoUrl) {
    URL.revokeObjectURL(state.laneReviewVideoUrl);
    state.laneReviewVideoUrl = null;
  }
  state.laneVideoAnalysisFields = null;
  syncLaneAnalysisShareMessage();
  if (placeholder) placeholder.classList.remove("is-hidden");
  if (label) label.textContent = "No clip selected";
  updateLaneVisualSync(0);
}

function bindLaneSourceReviewSync(video) {
  if (!video || video.dataset.laneReviewSyncBound === "true") return;
  video.dataset.laneReviewSyncBound = "true";
  const update = () => updateLaneVisualSync();
  video.addEventListener("loadedmetadata", update);
  video.addEventListener("durationchange", update);
  video.addEventListener("timeupdate", update);
  video.addEventListener("seeked", update);
  video.addEventListener("play", () => startLaneVisualSyncLoop());
  video.addEventListener("pause", () => {
    stopLaneVisualSyncLoop();
    updateLaneVisualSync();
  });
  video.addEventListener("ended", () => {
    stopLaneVisualSyncLoop();
    updateLaneVisualSync(1);
  });
}

function laneVideoProgressFromSource(video) {
  if (!video) return state.laneReviewSyncProgress || 0;
  const duration = Number(video.duration);
  if (Number.isFinite(duration) && duration > 0) {
    return clamp(video.currentTime / duration, 0, 1);
  }
  if (video.srcObject && !video.paused) {
    const now = performance.now();
    const previous = state.laneReviewSyncClock || now;
    state.laneReviewSyncClock = now;
    return (state.laneReviewSyncProgress + ((now - previous) / 6500)) % 1;
  }
  return state.laneReviewSyncProgress || 0;
}

function laneTrajectoryPoints(fields = state.laneVideoAnalysisFields || {}) {
  const raw = fields?.trajectory_points;
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((point) => ({
        time: Number(point.time),
        x: Number(point.x),
        y: Number(point.y),
      }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
      .map((point) => ({
        ...point,
        x: clamp(point.x, 0, 1),
        y: clamp(point.y, 0, 1),
      }));
  } catch {
    return [];
  }
}

function laneOverlayPath(points) {
  return points
    .map((point, index) => `${index ? "L" : "M"} ${(point.x * 100).toFixed(2)} ${(point.y * 100).toFixed(2)}`)
    .join(" ");
}

function renderLaneSourceMotionOverlay(fields = state.laneVideoAnalysisFields || {}) {
  const overlay = document.querySelector("#lane-source-motion-overlay");
  if (!overlay) return;
  const points = laneTrajectoryPoints(fields);
  if (points.length < 2) {
    overlay.innerHTML = "";
    overlay.classList.remove("is-active");
    return;
  }
  const path = laneOverlayPath(points);
  overlay.classList.add("is-active");
  overlay.innerHTML = `
    <path d="${path}" class="lane-source-track-underlay"></path>
    <path d="${path}" class="lane-source-track"></path>
    <circle r="2.4" class="lane-source-track-ball" data-lane-source-ball></circle>
    <circle r="3.1" class="lane-source-track-ring" data-lane-source-ring></circle>
  `;
  updateLaneSourceMotionOverlaySync(document.querySelector("#lane-source-review-video"));
}

function updateLaneSourceMotionOverlaySync(video) {
  const overlay = document.querySelector("#lane-source-motion-overlay");
  const path = overlay?.querySelector(".lane-source-track");
  const ball = overlay?.querySelector("[data-lane-source-ball]");
  const ring = overlay?.querySelector("[data-lane-source-ring]");
  if (!overlay || !path || !ball) return;
  const points = laneTrajectoryPoints();
  if (points.length < 2) return;
  const firstTime = Number.isFinite(points[0].time) ? points[0].time : 0;
  const lastTime = Number.isFinite(points[points.length - 1].time) ? points[points.length - 1].time : 1;
  const hasTimedPath = lastTime > firstTime;
  const progress = hasTimedPath && video
    ? clamp((Number(video.currentTime || 0) - firstTime) / (lastTime - firstTime), 0, 1)
    : state.laneReviewSyncProgress;
  let length = 0;
  try {
    length = path.getTotalLength();
  } catch {
    return;
  }
  if (!Number.isFinite(length) || length <= 0) return;
  const ballPoint = path.getPointAtLength(length * progress);
  const ringPoint = path.getPointAtLength(length * Math.max(0, progress - 0.035));
  ball.setAttribute("cx", ballPoint.x.toFixed(2));
  ball.setAttribute("cy", ballPoint.y.toFixed(2));
  if (ring) {
    ring.setAttribute("cx", ringPoint.x.toFixed(2));
    ring.setAttribute("cy", ringPoint.y.toFixed(2));
  }
}

function updateLaneVisualSync(progress = null) {
  const video = document.querySelector("#lane-source-review-video");
  const nextProgress = clamp(progress === null ? laneVideoProgressFromSource(video) : progress, 0, 1);
  state.laneReviewSyncProgress = nextProgress;
  updateLaneSourceMotionOverlaySync(video);
  document.querySelectorAll("[data-lane-sync-scope]").forEach((scope) => {
    const path = scope.querySelector("[data-lane-sync-path]");
    const tracker = scope.querySelector("[data-lane-sync-tracker]");
    const ball = scope.querySelector("[data-lane-sync-ball]");
    const ring = scope.querySelector("[data-lane-sync-ring]");
    if (!path || !ball) return;
    let length = 0;
    try {
      length = path.getTotalLength();
    } catch (error) {
      return;
    }
    if (!Number.isFinite(length) || length <= 0) return;
    const ballPoint = path.getPointAtLength(length * nextProgress);
    const ringProgress = Math.max(0, nextProgress - 0.035);
    const ringPoint = path.getPointAtLength(length * ringProgress);
    ball.setAttribute("transform", `translate(${ballPoint.x} ${ballPoint.y})`);
    if (ring) {
      ring.setAttribute("transform", `translate(${ringPoint.x} ${ringPoint.y})`);
    }
    if (tracker) {
      const trail = Math.max(18, Math.min(54, length * 0.18));
      tracker.style.strokeDasharray = `${trail} ${length}`;
      tracker.style.strokeDashoffset = `${trail - (length * nextProgress)}`;
    }
  });
}

function startLaneVisualSyncLoop() {
  stopLaneVisualSyncLoop();
  state.laneReviewSyncClock = performance.now();
  const tick = () => {
    updateLaneVisualSync();
    const video = document.querySelector("#lane-source-review-video");
    if (video && !video.paused && !video.ended) {
      state.laneReviewSyncRaf = requestAnimationFrame(tick);
    } else {
      state.laneReviewSyncRaf = null;
    }
  };
  state.laneReviewSyncRaf = requestAnimationFrame(tick);
}

function stopLaneVisualSyncLoop() {
  if (state.laneReviewSyncRaf) {
    cancelAnimationFrame(state.laneReviewSyncRaf);
    state.laneReviewSyncRaf = null;
  }
}

function applyLaneAnalysisFields(fields = {}) {
  const form = document.querySelector("#shot-form");
  if (!form) return;
  state.laneVideoAnalysisFields = { ...fields };
  Object.entries(fields).forEach(([name, value]) => {
    const field = form.elements[name];
    if (!field || value === null || value === undefined) return;
    field.value = value;
  });
  applyAutoLaneCalibration(fields);
  syncLaneRecommendationFields(formPayload(form));
  state.laneAutoNextMoveSource = "Auto from video analysis";
  updateLaneAutoNextMoveState();
  renderLaneBreakdownVisual(fields);
  syncLaneTrackCorrectionFields(fields);
  syncLaneAnalysisShareMessage();
  renderLaneFreeSnapshot();
  renderLaneShotSavePreview();
  setLaneAnalysisDetailsVisible(true);
  setLaneVideoWorkflow("review");
  syncLaneVideoAnalyzeAvailability({ keepReview: true });
}

function laneMetricNumber(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const match = String(value ?? "").match(/-?\d+(\.\d+)?/);
  const number = match ? Number(match[0]) : NaN;
  return Number.isFinite(number) ? number : null;
}

function laneMetricText(value, suffix = "") {
  if (value === null || value === undefined || String(value).trim() === "") return "";
  return formatShotMetric(value, suffix);
}

function syncLaneTrackCorrectionFields(fields = state.laneVideoAnalysisFields || {}) {
  document.querySelectorAll("[data-lane-track-correction]").forEach((input) => {
    const key = input.dataset.laneTrackCorrection;
    if (!key) return;
    input.value = fields?.[key] || "";
  });
  const stateLabel = document.querySelector("#lane-track-correction-state");
  if (stateLabel) {
    const isEstimate = fields?.backend_status === "development_estimator" || fields?.analysis_engine === "development_estimator";
    stateLabel.textContent = isEstimate ? "Estimate" : "Detected";
  }
}

function applyLaneTrackCorrection() {
  const form = document.querySelector("#shot-form");
  if (!form) return;
  const corrections = {};
  document.querySelectorAll("[data-lane-track-correction]").forEach((input) => {
    const key = input.dataset.laneTrackCorrection;
    if (!key) return;
    const value = input.value.trim();
    if (value) corrections[key] = value;
  });
  if (!Object.keys(corrections).length) return;
  Object.entries(corrections).forEach(([key, value]) => {
    const field = form.elements[key] || (key === "speed_mph" ? form.elements.ball_speed : null);
    if (field) field.value = key === "speed_mph" && !String(value).includes("mph") ? `${value} mph` : value;
  });
  if (corrections.release_board && form.elements.feet_board) {
    form.elements.feet_board.value = corrections.release_board;
  }
  if (corrections.speed_mph && form.elements.ball_speed) {
    form.elements.ball_speed.value = String(corrections.speed_mph).includes("mph") ? corrections.speed_mph : `${corrections.speed_mph} mph`;
  }
  if (corrections.pin_result && form.elements.result) {
    form.elements.result.value = corrections.pin_result;
  }
  state.laneVideoAnalysisFields = {
    ...(state.laneVideoAnalysisFields || {}),
    ...corrections,
    ball_speed: corrections.speed_mph ? (String(corrections.speed_mph).includes("mph") ? corrections.speed_mph : `${corrections.speed_mph} mph`) : state.laneVideoAnalysisFields?.ball_speed,
    feet_board: corrections.release_board || state.laneVideoAnalysisFields?.feet_board,
    result: corrections.pin_result || state.laneVideoAnalysisFields?.result,
    confidence_label: "User-corrected track",
    confidence_notes: "Track values were adjusted to match the source video review.",
  };
  applyAutoLaneCalibration(state.laneVideoAnalysisFields);
  syncLaneAutoNextMove({ overwrite: true, source: "Auto from corrected video track" });
  renderLaneBreakdownVisual(state.laneVideoAnalysisFields);
  syncLaneTrackCorrectionFields(state.laneVideoAnalysisFields);
  syncLaneAnalysisShareMessage();
  renderLaneFreeSnapshot();
  renderLaneShotSavePreview();
  const status = document.querySelector("#lane-track-correction-status");
  if (status) status.textContent = "Visual track updated from your video correction.";
}

function laneBoardValue(value, fallback) {
  const number = laneMetricNumber(value);
  return clamp(number ?? fallback, 1, 39);
}

function laneBoardPercent(board) {
  return 24 + clamp(((board - 1) / 38) * 112, 0, 112);
}

function laneVisualValue(fields, primaryName, fallbackName = "", allowFormFallback = true) {
  if (fields?.[primaryName] !== undefined && fields?.[primaryName] !== null && fields?.[primaryName] !== "") {
    return fields[primaryName];
  }
  if (fallbackName && fields?.[fallbackName] !== undefined && fields?.[fallbackName] !== null && fields?.[fallbackName] !== "") {
    return fields[fallbackName];
  }
  if (!allowFormFallback) return "";
  const form = document.querySelector("#shot-form");
  const primaryField = form?.elements?.[primaryName];
  if (primaryField?.value) return primaryField.value;
  const fallbackField = fallbackName ? form?.elements?.[fallbackName] : null;
  return fallbackField?.value || "";
}

function movementStatusClass(status) {
  if (status === "match") return "is-match";
  if (status === "review") return "is-review";
  return "is-pending";
}

function movementStatusLabel(status) {
  if (status === "match") return "Matches";
  if (status === "review") return "Review";
  return "Pending";
}

function movementBoardText(value) {
  return Number.isFinite(value) ? `B${Math.round(value * 10) / 10}` : "Pending";
}

function laneSmoothMotionPath(markers) {
  const [release, arrows, breakpoint, entry] = markers;
  const curve = (from, to, firstXRatio, secondXRatio, firstYOffset, secondYOffset) => {
    const dx = to.x - from.x;
    const c1x = from.x + dx * firstXRatio;
    const c2x = from.x + dx * secondXRatio;
    return `C ${c1x} ${from.y + firstYOffset}, ${c2x} ${to.y + secondYOffset}, ${to.x} ${to.y}`;
  };

  return [
    `M ${release.x} ${release.y}`,
    curve(release, arrows, 0.24, 0.76, -11, 10),
    curve(arrows, breakpoint, 0.28, 0.78, -12, 12),
    curve(breakpoint, entry, 0.30, 0.82, -14, 8),
  ].join(" ");
}

function laneIdealMovementModel(values) {
  const profileContextAllowed = values.use_profile_context !== false && values.use_profile_context !== "false";
  const handedness = String(values.handedness || (profileContextAllowed ? state.handedness : "unknown") || "right").toLowerCase();
  const hasKnownHand = handedness === "left" || handedness === "right";
  const isLeft = handedness === "left";
  const releaseBoard = Number(values.releaseBoard);
  const arrowsBoard = Number(values.arrowsBoard);
  const breakpointBoard = Number(values.breakpointBoard);
  const entryBoard = Number(values.entryBoard);
  const pocketBoard = isLeft ? 22.5 : 17.5;
  const speed = laneMetricNumber(values.speed);
  const startToArrow = isLeft ? arrowsBoard - releaseBoard : releaseBoard - arrowsBoard;
  const arrowToBreak = isLeft ? breakpointBoard - arrowsBoard : arrowsBoard - breakpointBoard;
  const returnToPocket = isLeft ? breakpointBoard - entryBoard : entryBoard - breakpointBoard;
  const entryDelta = Math.abs(entryBoard - pocketBoard);
  const phaseItems = [
    {
      label: "Skid to target",
      ideal: "Front-lane motion should stay controlled and mostly straight through the target zone.",
      actual: `${movementBoardText(releaseBoard)} start to ${movementBoardText(arrowsBoard)} arrows`,
      status: startToArrow >= 2 && startToArrow <= 12 ? "match" : "review",
    },
    {
      label: "Hook phase",
      ideal: "After the arrows, the path should change direction toward a clear breakpoint.",
      actual: `${movementBoardText(arrowsBoard)} arrows to ${movementBoardText(breakpointBoard)} breakpoint`,
      status: arrowToBreak >= 2 ? "match" : "review",
    },
    {
      label: "Roll to pocket",
      ideal: `Final motion should roll back toward the ${hasKnownHand ? (isLeft ? "1-2" : "1-3") : "detected"} pocket near ${movementBoardText(pocketBoard)}.`,
      actual: `${movementBoardText(breakpointBoard)} breakpoint to ${movementBoardText(entryBoard)} entry`,
      status: returnToPocket >= 5 && entryDelta <= 3 ? "match" : "review",
    },
    {
      label: "Ball speed",
      ideal: "Speed should let the ball transition from skid to hook to roll before impact.",
      actual: speed ? formatShotMetric(speed, " mph") : "Add measured speed",
      status: speed ? "match" : "pending",
    },
    {
      label: "Pin result",
      ideal: `Best strike result is pocket contact with clean carry through the ${hasKnownHand ? (isLeft ? "1-2" : "1-3") : "detected"} pocket.`,
      actual: values.pinResult ? String(values.pinResult) : "Log pin fall result",
      status: values.pinResult ? "match" : "pending",
    },
  ];
  const matches = phaseItems.filter((item) => item.status === "match").length;
  return {
    handedness: hasKnownHand ? (isLeft ? "Left handed" : "Right handed") : "Hand not detected",
    matchLabel: `${matches}/${phaseItems.length} checkpoints`,
    phaseItems,
  };
}

function lanePinSvg(pinNumber) {
  const pinId = `lane-pin-${pinNumber}`;
  return `
    <svg class="lane-pin-svg" viewBox="0 0 64 156" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="${pinId}-body" x1="8%" y1="18%" x2="92%" y2="82%">
          <stop offset="0%" stop-color="#ffffff"></stop>
          <stop offset="24%" stop-color="#fffaf0"></stop>
          <stop offset="52%" stop-color="#f7e7ca"></stop>
          <stop offset="74%" stop-color="#d4a66d"></stop>
          <stop offset="100%" stop-color="#7b421c"></stop>
        </linearGradient>
        <radialGradient id="${pinId}-ceramic" cx="34%" cy="32%" r="70%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"></stop>
          <stop offset="42%" stop-color="#ffffff" stop-opacity="0.42"></stop>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"></stop>
        </radialGradient>
        <linearGradient id="${pinId}-side" x1="30%" y1="18%" x2="96%" y2="88%">
          <stop offset="0%" stop-color="#5a260e" stop-opacity="0"></stop>
          <stop offset="52%" stop-color="#6d2f12" stop-opacity="0.22"></stop>
          <stop offset="100%" stop-color="#2b1208" stop-opacity="0.42"></stop>
        </linearGradient>
        <linearGradient id="${pinId}-red" x1="10%" y1="0%" x2="92%" y2="100%">
          <stop offset="0%" stop-color="#ff776d"></stop>
          <stop offset="42%" stop-color="#d92632"></stop>
          <stop offset="78%" stop-color="#8d111d"></stop>
          <stop offset="100%" stop-color="#430710"></stop>
        </linearGradient>
        <linearGradient id="${pinId}-bandshine" x1="10%" y1="0%" x2="90%" y2="0%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.34"></stop>
          <stop offset="42%" stop-color="#ffffff" stop-opacity="0.06"></stop>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.20"></stop>
        </linearGradient>
        <filter id="${pinId}-pinShadow" x="-35%" y="-20%" width="170%" height="145%">
          <feDropShadow dx="2.2" dy="5.2" stdDeviation="2.6" flood-color="#000000" flood-opacity="0.36"></feDropShadow>
        </filter>
      </defs>
      <ellipse class="pin-floor-shadow" cx="34" cy="146" rx="25" ry="7.8"></ellipse>
      <g filter="url(#${pinId}-pinShadow)">
        <path class="pin-main-body" fill="url(#${pinId}-body)" d="M26.1 7.3C20.9 10.6 20.6 18.5 23.0 27.0C25.4 35.6 24.7 45.2 21.2 55.6C17.8 65.9 9.8 75.5 7.2 90.2C4.7 104.7 9.4 121.4 16.0 132.4C12.8 136.7 11.4 140.9 12.2 145.2C17.3 150.4 23.9 153.0 32.0 153.0C40.1 153.0 46.7 150.4 51.8 145.2C52.6 140.9 51.2 136.7 48.0 132.4C54.6 121.4 59.3 104.7 56.8 90.2C54.2 75.5 46.2 65.9 42.8 55.6C39.3 45.2 38.6 35.6 41.0 27.0C43.4 18.5 43.1 10.6 37.9 7.3C34.5 5.2 29.5 5.2 26.1 7.3Z"></path>
        <path class="pin-side-shade" fill="url(#${pinId}-side)" d="M38.7 26.9C37.0 36.2 37.9 46.0 42.0 58.0C45.1 67.2 52.7 77.4 55.4 90.7C58.1 104.3 53.8 120.7 47.5 132.1C50.3 136.2 52.1 141.0 51.2 145.0C46.5 150.0 39.8 153.0 32.0 153.0C36.0 148.9 38.8 140.9 37.9 130.7C36.8 118.5 43.2 109.6 43.7 96.3C44.2 82.0 36.8 69.2 33.8 57.0C31.1 46.2 32.6 35.1 35.7 27.5C36.6 27.8 37.7 27.6 38.7 26.9Z"></path>
        <path class="pin-body-highlight" fill="url(#${pinId}-ceramic)" d="M24.9 10.1C21.4 17.8 25.2 31.0 24.1 42.6C22.9 55.1 15.7 68.7 13.5 85.1C11.2 102.0 17.2 119.2 22.5 130.0C24.9 134.8 23.5 141.8 18.7 146.3C23.2 149.8 30.8 150.0 36.7 147.2C30.4 144.9 27.1 137.2 27.9 128.1C28.8 118.2 23.6 109.5 22.5 97.8C20.7 78.9 25.7 64.4 30.1 51.2C34.5 38.2 31.5 20.6 28.1 10.1C27.1 9.8 26.0 9.8 24.9 10.1Z"></path>
        <path class="pin-red-band upper" fill="url(#${pinId}-red)" d="M22.6 35.3C28.6 38.0 35.4 38.0 41.4 35.3C42.1 38.8 42.1 42.3 41.6 45.8C35.4 48.5 28.6 48.5 22.4 45.8C21.9 42.3 21.9 38.8 22.6 35.3Z"></path>
        <path class="pin-red-band lower" fill="url(#${pinId}-red)" d="M20.6 49.4C28.0 53.1 36.0 53.1 43.4 49.4C44.2 53.0 45.6 56.7 47.4 60.4C37.2 64.8 26.8 64.8 16.6 60.4C18.4 56.7 19.8 53.0 20.6 49.4Z"></path>
        <path class="pin-band-highlight" fill="url(#${pinId}-bandshine)" d="M22.6 35.3C28.6 38.0 35.4 38.0 41.4 35.3C41.7 36.7 41.9 38.1 42.0 39.5C35.6 41.7 28.4 41.7 22.0 39.5C22.1 38.1 22.3 36.7 22.6 35.3Z"></path>
        <path class="pin-band-highlight" fill="url(#${pinId}-bandshine)" d="M20.6 49.4C28.0 53.1 36.0 53.1 43.4 49.4C43.8 51.0 44.3 52.5 44.9 54.1C36.5 57.2 27.5 57.2 19.1 54.1C19.7 52.5 20.2 51.0 20.6 49.4Z"></path>
        <ellipse class="pin-top-glow" cx="32" cy="13.5" rx="7.6" ry="5.0"></ellipse>
        <ellipse class="pin-base" cx="32" cy="144.2" rx="17.2" ry="5.6"></ellipse>
        <path class="pin-base-shadow" d="M15.3 142.1C25.0 146.2 39.0 146.2 48.7 142.1C47.5 148.1 40.3 151.5 32.0 151.5C23.7 151.5 16.5 148.1 15.3 142.1Z"></path>
      </g>
    </svg>
  `;
}

function laneStandingPinsFromResult(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return null;
  if (/\b(strike|flush|all\s*down|cleared|spare)\b/.test(text)) return new Set();
  if (/\b(gutter|foul|missed\s+lane)\b/.test(text)) return null;

  const describesLeave = /\b(leave|leaves|pin|pins|split|washout|bucket)\b/.test(text);
  if (!describesLeave) return null;

  const pins = [...text.matchAll(/\b10\b|\b[1-9]\b/g)]
    .map((match) => Number(match[0]))
    .filter((pin) => pin >= 1 && pin <= 10);
  return pins.length ? new Set(pins) : null;
}

function lanePinIsStanding(standingPins, pinNumber) {
  return standingPins === null || standingPins.has(pinNumber);
}

function lanePinWasHit(standingPins, pinNumber) {
  return standingPins !== null && !standingPins.has(pinNumber);
}

function applyAutoLaneCalibration(fields = {}) {
  const releaseBoard = String(laneMetricNumber(fields.release_board || fields.feet_board) || "");
  const targetBoard = String(laneMetricNumber(fields.arrows_board) || "");
  const breakpointBoard = String(laneMetricNumber(fields.breakpoint) || "");
  if (!releaseBoard && !targetBoard && !breakpointBoard) {
    updateLaneCalibrationSummary(fields);
    return;
  }
  state.laneCalibration = cleanLaneCalibration({
    camera_angle: fields.camera_angle || "auto_video",
    release_board_hint: releaseBoard,
    target_board_hint: targetBoard,
    breakpoint_board_hint: breakpointBoard,
    markers: { foul_line: true, arrows: true, lane_edges: true, pin_deck: true },
  });
  updateLaneCalibrationSummary(fields);
}

function renderLaneBreakdownVisual(fields = null) {
  const visual = document.querySelector("#lane-breakdown-visual");
  const metricsContainer = document.querySelector("#lane-breakdown-metrics");
  const idealContainer = document.querySelector("#lane-ideal-movement");
  const stateLabel = document.querySelector("#lane-breakdown-state");
  if (!visual || !metricsContainer) return;

  const form = document.querySelector("#shot-form");
  const calibration = laneCalibrationData();
  const formFields = form ? formPayload(form) : {};
  const sourceFields = fields || state.laneVideoAnalysisFields || formFields;
  const isVideoDriven = Boolean(fields || state.laneVideoAnalysisFields);
  const laneValue = (primaryName, fallbackName = "") => laneVisualValue(sourceFields, primaryName, fallbackName, !isVideoDriven);
  const hasTrackData = Boolean(isVideoDriven && (
    laneValue("release_board", "feet_board") ||
    laneValue("arrows_board") ||
    laneValue("breakpoint") ||
    laneValue("entry_board") ||
    laneValue("speed_mph") ||
    laneValue("hook_inches")
  ));
  const releaseBoard = laneBoardValue(laneValue("release_board", "feet_board"), laneMetricNumber(calibration.release_board_hint) ?? 17);
  const arrowsBoard = laneBoardValue(laneValue("arrows_board"), laneMetricNumber(calibration.target_board_hint) ?? 13);
  const breakpointBoard = laneBoardValue(laneValue("breakpoint"), laneMetricNumber(calibration.breakpoint_board_hint) ?? 10.5);
  const entryBoard = laneBoardValue(laneValue("entry_board"), 17.5);
  const pinResultValue = laneValue("pin_result") || laneValue("result");
  const standingPins = laneStandingPinsFromResult(pinResultValue);
  const isDevelopmentEstimate = ["development_estimator", "video_motion_estimator", "vision_review_required"].includes(laneValue("backend_status"))
    || laneValue("analysis_engine") === "development_estimator";
  const hasAnalysis = Boolean(isVideoDriven && (
    laneValue("analysis_run_id") ||
    laneValue("release_board", "feet_board") ||
    laneValue("arrows_board") ||
    laneValue("breakpoint") ||
    laneValue("entry_board") ||
    laneValue("speed_mph") ||
    laneValue("hook_inches") ||
    laneValue("pin_result") ||
    laneValue("pocket_quality")
  ));
  const laneScale = {
    pinDeckY: 34,
    headPinY: 58,
    arrowsY: 214,
    dotsY: 225,
    foulY: 268,
  };
  const markers = [
    { label: "Release", board: releaseBoard, y: 258, className: "release" },
    { label: "Arrows", board: arrowsBoard, y: laneScale.arrowsY, className: "arrows" },
    { label: "Breakpoint", board: breakpointBoard, y: 112, className: "breakpoint" },
    { label: "Entry", board: entryBoard, y: laneScale.headPinY, className: "entry" },
  ].map((marker) => ({ ...marker, x: laneBoardPercent(marker.board) }));
  const motionPath = laneSmoothMotionPath(markers);
  const laneBoards = Array.from({ length: 11 }, (_, index) => 24 + index * 11.2);
  const pinRack = [
    { pin: 7, x: 38, y: 12, scale: 0.92 },
    { pin: 8, x: 66, y: 12, scale: 0.92 },
    { pin: 9, x: 94, y: 12, scale: 0.92 },
    { pin: 10, x: 122, y: 12, scale: 0.92 },
    { pin: 4, x: 52, y: 28, scale: 0.98 },
    { pin: 5, x: 80, y: 28, scale: 0.98 },
    { pin: 6, x: 108, y: 28, scale: 0.98 },
    { pin: 2, x: 66, y: 44, scale: 1.04 },
    { pin: 3, x: 94, y: 44, scale: 1.04 },
    { pin: 1, x: 80, y: 60, scale: 1.12 },
  ];
  const fallenPin3d = [
    { pin: 1, left: 50, top: 76, angle: 86, scale: 1.10 },
    { pin: 2, left: 39, top: 58, angle: -72, scale: 1.00 },
    { pin: 3, left: 61, top: 58, angle: 74, scale: 1.00 },
    { pin: 4, left: 28, top: 40, angle: -84, scale: 0.94 },
    { pin: 5, left: 50, top: 40, angle: 92, scale: 0.94 },
    { pin: 6, left: 72, top: 40, angle: 84, scale: 0.94 },
    { pin: 7, left: 17, top: 22, angle: -76, scale: 0.88 },
    { pin: 8, left: 39, top: 22, angle: 78, scale: 0.88 },
    { pin: 9, left: 61, top: 22, angle: -80, scale: 0.88 },
    { pin: 10, left: 83, top: 22, angle: 76, scale: 0.88 },
  ];
  const fallenPin2d = [
    { pin: 1, x: 80, y: 56, angle: 88, scale: 1.02 },
    { pin: 2, x: 62, y: 42, angle: -72, scale: 0.94 },
    { pin: 3, x: 98, y: 42, angle: 72, scale: 0.94 },
    { pin: 4, x: 48, y: 27, angle: -88, scale: 0.88 },
    { pin: 5, x: 80, y: 28, angle: 86, scale: 0.88 },
    { pin: 6, x: 112, y: 27, angle: 88, scale: 0.88 },
    { pin: 7, x: 38, y: 13, angle: -78, scale: 0.82 },
    { pin: 8, x: 66, y: 13, angle: 82, scale: 0.82 },
    { pin: 9, x: 94, y: 13, angle: -82, scale: 0.82 },
    { pin: 10, x: 122, y: 13, angle: 78, scale: 0.82 },
  ];
  const standingPin3dHtml = Array.from({ length: 10 }, (_, index) => {
    const pinNumber = index + 1;
    return lanePinIsStanding(standingPins, pinNumber) ? `<span class="lane-3d-pin" data-pin="${pinNumber}">${lanePinSvg(pinNumber)}</span>` : "";
  }).join("");
  const fallenPin3dHtml = fallenPin3d.map((pin) => lanePinWasHit(standingPins, pin.pin) ? `
    <span class="lane-3d-fallen-pin" data-pin="${pin.pin}" style="left: ${pin.left}%; top: ${pin.top}%; --fallen-angle: ${pin.angle}deg; --fallen-scale: ${pin.scale};">
      ${lanePinSvg(pin.pin)}
    </span>
  ` : "").join("");
  const pinSpotHtml = [7, 8, 9, 10, 4, 5, 6, 2, 3, 1]
    .map((pin) => `<i data-pin="${pin}" class="${lanePinIsStanding(standingPins, pin) ? "is-covered" : "is-open"}"></i>`)
    .join("");
  const standingPin2dHtml = pinRack.map((pin) => lanePinIsStanding(standingPins, pin.pin) ? `
    <g class="lane-breakdown-pin" transform="translate(${pin.x} ${pin.y}) scale(${pin.scale})">
      <ellipse class="pin-shadow" cx="0" cy="6.8" rx="6.1" ry="2.1"></ellipse>
      <path class="pin-body" d="M-2.0,-7.0 C-4.7,-5.4 -5.8,-1.7 -4.3,1.8 C-3.3,4.2 -5.8,7.1 -3.2,9.0 C-1.3,10.3 1.3,10.3 3.2,9.0 C5.8,7.1 3.3,4.2 4.3,1.8 C5.8,-1.7 4.7,-5.4 2.0,-7.0 C1.1,-7.7 -1.1,-7.7 -2.0,-7.0 Z"></path>
      <path class="pin-band" d="M-3.7,-1.9 C-1.2,-0.9 1.2,-0.9 3.7,-1.9 L4.3,0.7 C1.4,1.7 -1.4,1.7 -4.3,0.7 Z"></path>
      <ellipse class="pin-neck" cx="0" cy="-6.5" rx="2.0" ry="1.4"></ellipse>
    </g>
  ` : "").join("");
  const fallenPin2dHtml = fallenPin2d.map((pin) => lanePinWasHit(standingPins, pin.pin) ? `
    <g class="lane-breakdown-fallen-pin" transform="translate(${pin.x} ${pin.y}) rotate(${pin.angle}) scale(${pin.scale})">
      <ellipse class="pin-shadow" cx="0" cy="6.7" rx="6.8" ry="2.0"></ellipse>
      <path class="pin-body" d="M-2.0,-7.0 C-4.7,-5.4 -5.8,-1.7 -4.3,1.8 C-3.3,4.2 -5.8,7.1 -3.2,9.0 C-1.3,10.3 1.3,10.3 3.2,9.0 C5.8,7.1 3.3,4.2 4.3,1.8 C5.8,-1.7 4.7,-5.4 2.0,-7.0 C1.1,-7.7 -1.1,-7.7 -2.0,-7.0 Z"></path>
      <path class="pin-band" d="M-3.7,-1.9 C-1.2,-0.9 1.2,-0.9 3.7,-1.9 L4.3,0.7 C1.4,1.7 -1.4,1.7 -4.3,0.7 Z"></path>
      <ellipse class="pin-neck" cx="0" cy="-6.5" rx="2.0" ry="1.4"></ellipse>
    </g>
  ` : "").join("");
  const labelSide = entryBoard > 20 ? "left" : "right";
  const mode = state.laneBreakdownView?.mode === "2d" ? "2d" : "3d";
  const rotation = Number(state.laneBreakdownView?.rotation) || 0;
  const zoom = clamp(Number(state.laneBreakdownView?.zoom) || 1, 0.75, 1.65);
  const tilt = clamp(Number(state.laneBreakdownView?.tilt) || 58, 38, 70);
  state.laneBreakdownView = { mode, rotation, zoom, tilt };
  const track3dHtml = hasTrackData ? `
                <path d="${motionPath}" class="lane-breakdown-path-glow"></path>
                <path d="${motionPath}" class="lane-breakdown-path"></path>
                <path d="${motionPath}" class="lane-motion-tracker" data-lane-sync-tracker></path>
                <path d="${motionPath}" class="lane-sync-path-reference" data-lane-sync-path></path>
                <circle r="4.8" class="lane-breakdown-ball lane-breakdown-ball-moving" data-lane-sync-ball></circle>
                <circle r="5.4" class="lane-breakdown-tracker-ring" data-lane-sync-ring></circle>
  ` : "";
  const track2dHtml = hasTrackData ? `
        <path d="${motionPath}" class="lane-breakdown-path-glow"></path>
        <path d="${motionPath}" class="lane-breakdown-path"></path>
        <path d="${motionPath}" class="lane-motion-tracker" data-lane-sync-tracker></path>
        <path d="${motionPath}" class="lane-sync-path-reference" data-lane-sync-path></path>
        <circle cx="${markers[0].x}" cy="${markers[0].y}" r="3.2" class="lane-breakdown-ball-start"></circle>
        <circle r="4.8" class="lane-breakdown-ball lane-breakdown-ball-moving" data-lane-sync-ball></circle>
        <circle r="5.4" class="lane-breakdown-tracker-ring" data-lane-sync-ring></circle>
  ` : "";

  const marker3dHtml = hasTrackData ? markers.map((marker) => `
                <span class="lane-3d-marker ${marker.className}" style="left: ${(marker.x / 160) * 100}%; top: ${(marker.y / 300) * 100}%;">
                  <b>${marker.label}</b>
                  <small>B${Math.round(marker.board * 10) / 10}</small>
                </span>
              `).join("") : "";
  const marker2dHtml = hasTrackData ? markers.map((marker) => `
          <g class="lane-breakdown-marker ${marker.className}">
            <text x="${labelSide === "left" ? marker.x - 5 : marker.x + 5}" y="${marker.y - 6}" text-anchor="${labelSide === "left" ? "end" : "start"}">${marker.label}</text>
            <text x="${labelSide === "left" ? marker.x - 5 : marker.x + 5}" y="${marker.y + 7}" text-anchor="${labelSide === "left" ? "end" : "start"}">B${Math.round(marker.board * 10) / 10}</text>
          </g>
        `).join("") : "";

  if (stateLabel) stateLabel.textContent = hasAnalysis ? (hasTrackData ? (isDevelopmentEstimate ? "Estimate" : "Analysis") : "Needs Review") : "Preview";
  document.querySelectorAll("[data-lane-breakdown-view]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.laneBreakdownView === mode);
  });
  visual.innerHTML = `
    <div class="lane-breakdown-viewer is-${mode}" style="--lane-3d-rotation: ${rotation}deg; --lane-3d-zoom: ${zoom}; --lane-3d-tilt: ${tilt}deg;">
      <div class="lane-breakdown-3d" data-lane-breakdown-drag aria-label="3D lane review">
        <div class="lane-3d-hud">
          <span>Drag to rotate</span>
          <span>${Math.round(((rotation % 360) + 360) % 360)} deg</span>
          <span>${Math.round(zoom * 100)}%</span>
        </div>
        <div class="lane-3d-stage">
          <div class="lane-3d-table">
            <div class="lane-3d-gutter left"></div>
            <div class="lane-3d-surface">
              <div class="lane-3d-backstop"></div>
              <div class="lane-3d-pin-deck"></div>
              <div class="lane-3d-zone lane-3d-zone-backend"><span>Backend 40-60 ft</span></div>
              <div class="lane-3d-zone lane-3d-zone-midlane"><span>Midlane 20-40 ft</span></div>
              <div class="lane-3d-zone lane-3d-zone-heads"><span>Heads 0-20 ft</span></div>
              <div class="lane-3d-oil"></div>
              <div class="lane-3d-approach"></div>
              <div class="lane-3d-foul"></div>
              <div class="lane-3d-arrows"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
              <div class="lane-3d-dots"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
              <div class="lane-3d-pin-spots" aria-hidden="true">${pinSpotHtml}</div>
              <div class="lane-3d-pins">${fallenPin3dHtml}${standingPin3dHtml}</div>
              <span class="lane-3d-distance lane-3d-distance-foul">Foul line</span>
              <span class="lane-3d-distance lane-3d-distance-arrows">15 ft arrows</span>
              <span class="lane-3d-distance lane-3d-distance-pins">60 ft head pin</span>
              <span class="lane-3d-distance lane-3d-distance-deck">62 ft 10 in deck</span>
              <span class="lane-3d-width-label">41.5 in lane | 39 boards</span>
              <svg class="lane-3d-path" viewBox="0 0 160 300" preserveAspectRatio="none" aria-hidden="true" data-lane-sync-scope>
                ${track3dHtml}
              </svg>
              ${marker3dHtml}
            </div>
            <div class="lane-3d-gutter right"></div>
          </div>
        </div>
      </div>
      <div class="lane-breakdown-map">
      <div class="lane-breakdown-board-labels" aria-hidden="true">
        <span>1</span><span>10</span><span>20</span><span>30</span><span>39</span>
      </div>
      <svg class="lane-breakdown-svg" viewBox="0 0 160 300" role="img" aria-label="Bowling ball path from release to pins" data-lane-sync-scope>
        <defs>
          <linearGradient id="laneWoodGradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="#f0c66f"></stop>
            <stop offset="38%" stop-color="#d9983f"></stop>
            <stop offset="72%" stop-color="#f6d58a"></stop>
            <stop offset="100%" stop-color="#a9662c"></stop>
          </linearGradient>
          <linearGradient id="laneOilSheen" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0"></stop>
            <stop offset="46%" stop-color="#ffffff" stop-opacity="0.30"></stop>
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0"></stop>
          </linearGradient>
          <pattern id="laneWoodPattern" width="12" height="300" patternUnits="userSpaceOnUse">
            <rect width="12" height="300" fill="url(#laneWoodGradient)"></rect>
            <path d="M2 0 C5 28, 3 62, 7 98 S11 166, 5 206 S3 258, 10 300" stroke="rgba(96,49,18,0.24)" stroke-width="0.7" fill="none"></path>
            <path d="M10 0 C7 36, 9 78, 5 124 S1 208, 4 300" stroke="rgba(255,242,185,0.18)" stroke-width="0.55" fill="none"></path>
          </pattern>
          <radialGradient id="laneBallGradient" cx="35%" cy="28%" r="70%">
            <stop offset="0%" stop-color="#ffffff"></stop>
            <stop offset="35%" stop-color="#4cc9f0"></stop>
            <stop offset="100%" stop-color="#073b78"></stop>
          </radialGradient>
          <linearGradient id="laneTrackGradient" x1="0" x2="1" y1="1" y2="0">
            <stop offset="0%" stop-color="#ff2d55"></stop>
            <stop offset="55%" stop-color="#ff1744"></stop>
            <stop offset="100%" stop-color="#ffb3c1"></stop>
          </linearGradient>
          <filter id="laneTrackGlow">
            <feGaussianBlur stdDeviation="1.9" result="blur"></feGaussianBlur>
            <feMerge>
              <feMergeNode in="blur"></feMergeNode>
              <feMergeNode in="SourceGraphic"></feMergeNode>
            </feMerge>
          </filter>
          <filter id="laneBallShadow">
            <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" flood-color="#000000" flood-opacity="0.42"></feDropShadow>
          </filter>
          <linearGradient id="laneGutterGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stop-color="#020409"></stop>
            <stop offset="46%" stop-color="#193656"></stop>
            <stop offset="100%" stop-color="#020409"></stop>
          </linearGradient>
          <linearGradient id="laneBackstopGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#2a3544"></stop>
            <stop offset="58%" stop-color="#080b10"></stop>
            <stop offset="100%" stop-color="#020305"></stop>
          </linearGradient>
          <linearGradient id="lanePinDeckGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#f5c879" stop-opacity="0.46"></stop>
            <stop offset="52%" stop-color="#b5682a" stop-opacity="0.26"></stop>
            <stop offset="100%" stop-color="#2a1308" stop-opacity="0.34"></stop>
          </linearGradient>
          <linearGradient id="lanePinBodyGradient" x1="15%" x2="88%" y1="0%" y2="100%">
            <stop offset="0%" stop-color="#ffffff"></stop>
            <stop offset="38%" stop-color="#fff3dc"></stop>
            <stop offset="72%" stop-color="#d2a065"></stop>
            <stop offset="100%" stop-color="#7b421c"></stop>
          </linearGradient>
          <linearGradient id="lanePinBandGradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="#ff7468"></stop>
            <stop offset="52%" stop-color="#c91f2b"></stop>
            <stop offset="100%" stop-color="#620813"></stop>
          </linearGradient>
          <filter id="laneObjectShadow">
            <feDropShadow dx="1.4" dy="2.4" stdDeviation="1.6" flood-color="#000000" flood-opacity="0.44"></feDropShadow>
          </filter>
        </defs>
        <rect x="0.5" y="0.5" width="159" height="299" rx="6" class="lane-breakdown-room"></rect>
        <rect x="18" y="0.5" width="124" height="22" rx="3" class="lane-breakdown-backstop"></rect>
        <rect x="4" y="0.5" width="20" height="299" rx="6" class="lane-breakdown-gutter"></rect>
        <rect x="136" y="0.5" width="20" height="299" rx="6" class="lane-breakdown-gutter"></rect>
        <rect x="24" y="0.5" width="112" height="299" class="lane-breakdown-surface"></rect>
        <rect x="24" y="0.5" width="112" height="72" class="lane-breakdown-pin-deck"></rect>
        <rect x="24" y="58" width="112" height="70" class="lane-breakdown-zone-fill lane-breakdown-zone-backend"></rect>
        <rect x="24" y="128" width="112" height="70" class="lane-breakdown-zone-fill lane-breakdown-zone-midlane"></rect>
        <rect x="24" y="198" width="112" height="70" class="lane-breakdown-zone-fill lane-breakdown-zone-heads"></rect>
        <rect x="24" y="72" width="112" height="148" class="lane-breakdown-oil"></rect>
        <rect x="24" y="${laneScale.foulY}" width="112" height="${300 - laneScale.foulY}" class="lane-breakdown-approach"></rect>
        <rect x="24" y="0.5" width="112" height="299" class="lane-breakdown-lane-shine"></rect>
        ${laneBoards.map((x) => `<line x1="${x}" y1="0" x2="${x}" y2="300" class="lane-breakdown-board"></line>`).join("")}
        <line x1="24" y1="${laneScale.foulY}" x2="136" y2="${laneScale.foulY}" class="lane-breakdown-reference lane-breakdown-foul"></line>
        <line x1="24" y1="${laneScale.arrowsY}" x2="136" y2="${laneScale.arrowsY}" class="lane-breakdown-reference"></line>
        <line x1="24" y1="${laneScale.headPinY}" x2="136" y2="${laneScale.headPinY}" class="lane-breakdown-reference"></line>
        <line x1="24" y1="${laneScale.pinDeckY}" x2="136" y2="${laneScale.pinDeckY}" class="lane-breakdown-reference lane-breakdown-pin-deck-line"></line>
        <line x1="144" y1="${laneScale.foulY}" x2="144" y2="${laneScale.headPinY}" class="lane-breakdown-measure"></line>
        <line x1="141" y1="${laneScale.foulY}" x2="147" y2="${laneScale.foulY}" class="lane-breakdown-measure"></line>
        <line x1="141" y1="${laneScale.headPinY}" x2="147" y2="${laneScale.headPinY}" class="lane-breakdown-measure"></line>
        <line x1="24" y1="290" x2="136" y2="290" class="lane-breakdown-width-measure"></line>
        <line x1="24" y1="287" x2="24" y2="293" class="lane-breakdown-width-measure"></line>
        <line x1="136" y1="287" x2="136" y2="293" class="lane-breakdown-width-measure"></line>
        <text x="9" y="${laneScale.foulY - 3}" class="lane-breakdown-zone">Foul</text>
        <text x="7" y="${laneScale.foulY + 17}" class="lane-breakdown-zone">Approach</text>
        <text x="8" y="232" class="lane-breakdown-zone">Heads</text>
        <text x="7" y="162" class="lane-breakdown-zone">Midlane</text>
        <text x="7" y="100" class="lane-breakdown-zone">Backend</text>
        <text x="7" y="${laneScale.arrowsY - 3}" class="lane-breakdown-zone">15 ft</text>
        <text x="7" y="${laneScale.headPinY - 3}" class="lane-breakdown-zone">60 ft</text>
        <text x="8" y="${laneScale.pinDeckY - 3}" class="lane-breakdown-zone">Deck</text>
        <text x="148" y="166" class="lane-breakdown-measure-label" transform="rotate(90 148 166)">60 ft foul to head pin</text>
        <text x="80" y="286" class="lane-breakdown-measure-label" text-anchor="middle">41.5 in | 39 boards</text>
        <g class="lane-breakdown-dots" aria-hidden="true">
          <circle cx="42" cy="${laneScale.dotsY}" r="1.6"></circle><circle cx="55" cy="${laneScale.dotsY}" r="1.6"></circle><circle cx="68" cy="${laneScale.dotsY}" r="1.6"></circle>
          <circle cx="80" cy="${laneScale.dotsY}" r="1.6"></circle><circle cx="92" cy="${laneScale.dotsY}" r="1.6"></circle><circle cx="105" cy="${laneScale.dotsY}" r="1.6"></circle><circle cx="118" cy="${laneScale.dotsY}" r="1.6"></circle>
        </g>
        <g class="lane-breakdown-arrows" aria-hidden="true">
          <polygon points="42,205 38.8,217 45.2,217"></polygon><polygon points="55,205 51.8,217 58.2,217"></polygon>
          <polygon points="68,205 64.8,217 71.2,217"></polygon><polygon points="80,205 76.8,217 83.2,217"></polygon>
          <polygon points="92,205 88.8,217 95.2,217"></polygon><polygon points="105,205 101.8,217 108.2,217"></polygon><polygon points="118,205 114.8,217 121.2,217"></polygon>
        </g>
        <g class="lane-breakdown-pins" aria-hidden="true">
          ${fallenPin2dHtml}${standingPin2dHtml}
        </g>
        ${track2dHtml}
        ${marker2dHtml}
      </svg>
      </div>
    </div>
  `;

  const speed = laneValue("speed_mph") || laneValue("ball_speed");
  const hook = laneValue("hook_inches");
  const boards = laneValue("boards_crossed");
  const pocket = laneValue("pocket_quality") || "Pending";
  const pins = pinResultValue || "Pending";
  const confidence = laneValue("confidence");
  const motionPoints = laneValue("motion_points");
  const analysisSource = laneValue("analysis_source") || (hasTrackData ? "Detected video motion" : "Pending");
  const qualityLabel = laneValue("confidence_label") || (hasTrackData ? "Motion estimate" : "Needs review");
  const metrics = [
    ["Source", escapeHtml(analysisSource)],
    ["Quality", escapeHtml(qualityLabel)],
    ["Motion Points", motionPoints ? escapeHtml(motionPoints) : "Pending"],
    ["Speed", laneMetricText(speed, " mph") || escapeHtml(speed) || "Pending"],
    ["Hook", laneMetricText(hook, " in") || "Pending"],
    ["Boards", laneMetricText(boards) || "Pending"],
    ["Pocket", escapeHtml(pocket)],
    ["Pins", escapeHtml(pins)],
    ["Confidence", confidence ? `${escapeHtml(confidence)}%` : "Pending"],
  ];
  metricsContainer.innerHTML = `
    ${metrics.map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`).join("")}
    <p>${hasAnalysis ? (hasTrackData ? (isDevelopmentEstimate ? "Motion-based path mapped from the source video. Verify pin fall and correct the track if the ball was obscured." : "Video analysis mapped to the visual path and shot metrics. Open notes for the full breakdown.") : "No stable ball path was detected from this video, so StrikeIQ is not drawing a track yet. Use source video review or correction fields.") : (isVideoDriven ? "Video analysis is being prepared; detected lane values will drive this view." : "Manual preview is shown until a video analysis fills the shot data.")}</p>
  `;
  renderLaneSourceMotionOverlay(sourceFields);
  if (idealContainer) {
    const recommendation = laneAdjustmentRecommendation({
      ...sourceFields,
      release_board: releaseBoard,
      arrows_board: arrowsBoard,
      speed_mph: speed,
      pin_result: pinResultValue,
      handedness: laneValue("handedness") || laneValue("bowling_hand"),
      use_profile_context: laneValue("use_profile_context") || "true",
    });
    const movement = laneIdealMovementModel({
      releaseBoard,
      arrowsBoard,
      breakpointBoard,
      entryBoard,
      speed,
      pinResult: pinResultValue,
      handedness: laneValue("handedness") || laneValue("bowling_hand"),
      use_profile_context: laneValue("use_profile_context") || "true",
    });
    idealContainer.innerHTML = `
      <div class="lane-ideal-heading">
        <div>
          <p class="eyebrow">Documented Movement Model</p>
          <h3>Ideal vs Your Shot</h3>
          <p>Uses regulation lane landmarks and the documented skid, hook, roll ball-motion sequence.</p>
        </div>
        <span>${escapeHtml(movement.handedness)} | ${escapeHtml(movement.matchLabel)}</span>
      </div>
      <article class="lane-review-recommendation">
        <div>
          <span>${escapeHtml(recommendation.priority)}</span>
          <strong>${escapeHtml(recommendation.title)}</strong>
        </div>
        <p><b>Adjustment:</b> ${escapeHtml(recommendation.adjustment)}</p>
        <p><b>Next move:</b> ${escapeHtml(recommendation.nextMove)}</p>
        <small>${recommendation.cues.map(escapeHtml).join(" | ")}</small>
      </article>
      <div class="lane-ideal-grid">
        ${movement.phaseItems.map((item) => `
          <article class="${movementStatusClass(item.status)}">
            <span>${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(movementStatusLabel(item.status))}</strong>
            <p><b>Ideal:</b> ${escapeHtml(item.ideal)}</p>
            <p><b>Your shot:</b> ${escapeHtml(item.actual)}</p>
          </article>
        `).join("")}
      </div>
      <p class="lane-ideal-sources">Reference model: USBC lane landmarks plus USBC/BOWL.com skid-hook-roll movement guidance. Exact board targets still depend on pattern, ball, release, and lane transition.</p>
    `;
  }
  bindLaneSourceReviewSync(document.querySelector("#lane-source-review-video"));
  updateLaneVisualSync();
}

function updateLaneBreakdownView(updates = {}) {
  const current = state.laneBreakdownView || { mode: "3d", rotation: 0, zoom: 1, tilt: 58 };
  state.laneBreakdownView = {
    mode: updates.mode || current.mode || "3d",
    rotation: Number.isFinite(updates.rotation) ? updates.rotation : Number(current.rotation) || 0,
    zoom: clamp(Number.isFinite(updates.zoom) ? updates.zoom : Number(current.zoom) || 1, 0.75, 1.65),
    tilt: clamp(Number.isFinite(updates.tilt) ? updates.tilt : Number(current.tilt) || 58, 38, 70),
  };
  renderLaneBreakdownVisual();
  queueAppSettingsSave();
}

function laneDetectionOptions() {
  const laneInput = document.querySelector("input[name='detect_lane']");
  if (!laneInput) return { ...defaultLaneDetection(), ...(state.laneDetection || {}) };
  state.laneDetection = {
    lane_boards: Boolean(laneInput.checked),
    ball_path: Boolean(document.querySelector("input[name='detect_ball']")?.checked),
    release_point: Boolean(document.querySelector("input[name='detect_release']")?.checked),
    pin_result: Boolean(document.querySelector("input[name='detect_pins']")?.checked),
  };
  return state.laneDetection;
}

function laneCalibrationData() {
  const calibration = cleanLaneCalibration(state.laneCalibration);
  state.laneCalibration = calibration;
  return {
    ...calibration,
    mode: "auto_video",
    auto_detect: true,
  };
}

function updateLaneCalibrationSummary(fields = {}) {
  const calibration = laneCalibrationData();
  const status = document.querySelector("#lane-calibration-status");
  const summary = document.querySelector("#lane-calibration-summary");
  const hasAnalysis = Boolean(fields.analysis_run_id || fields.release_board || fields.arrows_board || fields.breakpoint);
  if (status) {
    status.textContent = fields.calibration_status || (hasAnalysis ? "Auto Ready" : "Auto");
  }
  if (summary) {
    const hints = [
      calibration.release_board_hint && `release board ${calibration.release_board_hint}`,
      calibration.target_board_hint && `arrow board ${calibration.target_board_hint}`,
      calibration.breakpoint_board_hint && `breakpoint board ${calibration.breakpoint_board_hint}`,
    ].filter(Boolean);
    summary.textContent = fields.calibration_summary || (hasAnalysis
      ? `Auto calibration complete from video analysis${hints.length ? `: ${hints.join(", ")}` : "."}.`
      : "Upload a recorded shot and StrikeIQ will detect the foul line, arrows, lane edges, and pin deck during analysis.");
  }
}

async function uploadLaneVideoFile(file) {
  if (!file) return null;
  if (file.size > maxLaneVideoUploadBytes) {
    throw new Error(`Video upload must be ${formatBytes(maxLaneVideoUploadBytes)} or smaller for local development.`);
  }
  const existingUploadId = document.querySelector("#lane-video-upload-id")?.value;
  if (existingUploadId) {
    return {
      upload_id: existingUploadId,
      name: file.name,
      size: file.size,
      type: file.type || "video",
    };
  }
  let response;
  try {
    response = await fetch("/api/lane-video/upload-binary", {
      method: "POST",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "X-Video-Name": encodeURIComponent(file.name),
        "X-Video-Type": file.type || "video",
      },
      body: file,
    });
  } catch (error) {
    throw new Error("Upload route unavailable. Restart the StrikeIQ backend so the larger video upload endpoint is active.");
  }
  const text = await response.text();
  const upload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Large video upload endpoint is not active. Restart the StrikeIQ backend and try again.");
    }
    throw new Error(upload.error || "Video upload failed");
  }
  const uploadId = document.querySelector("#lane-video-upload-id");
  if (uploadId) uploadId.value = upload.upload_id || "";
  const fileStatus = document.querySelector("#lane-video-file-status");
  if (fileStatus) fileStatus.textContent = `${upload.name || file.name} stored for analysis.`;
  return upload;
}

async function loadLaneVideoAnalyses() {
  state.laneAnalyses = await api("/api/lane-video/analyses").catch(() => []);
  renderLaneAnalysisHistory();
}

function renderLaneAnalysisHistory() {
  const container = document.querySelector("#lane-analysis-history");
  if (!container) return;
  if (!state.laneAnalyses.length) {
    container.innerHTML = `<p class="empty-state">No video analysis runs yet. Upload and analyze a shot to build this history.</p>`;
    return;
  }
  container.innerHTML = state.laneAnalyses.map((analysis) => {
    const fields = analysis.fields || {};
    const metrics = [
      fields.speed_mph && `${formatShotMetric(fields.speed_mph, " mph")}`,
      fields.hook_inches && `${formatShotMetric(fields.hook_inches, " in hook")}`,
      fields.boards_crossed && `${formatShotMetric(fields.boards_crossed, " boards")}`,
      fields.pocket_quality && `Pocket ${fields.pocket_quality}`,
      fields.pin_result && `Pins ${fields.pin_result}`,
    ].filter(Boolean);
    return `
      <article class="lane-analysis-record">
        <div>
          <strong>${escapeHtml(analysis.video_name || "Lane video analysis")}</strong>
          <span>${escapeHtml([analysis.tracking_mode === "live_video" ? "Live Camera" : "Recorded Video", analysis.lane_center, analysis.ball].filter(Boolean).join(" | "))}</span>
          <small>${escapeHtml([analysis.upload_id ? "Stored upload" : "No upload", formatBytes(analysis.video_size), analysis.created_at].filter(Boolean).join(" | "))}</small>
        </div>
        <p>${escapeHtml(metrics.join(" | ") || fields.output_preview || "Analysis fields ready.")}</p>
        <button type="button" class="secondary-button" data-lane-analysis-run="${escapeHtml(analysis.analysis_run_id)}">Apply</button>
      </article>
    `;
  }).join("");
}

function applyLaneAnalysisRun(runId) {
  const analysis = state.laneAnalyses.find((item) => item.analysis_run_id === runId);
  if (!analysis) return;
  applyLaneAnalysisFields(analysis.fields || {});
  const status = document.querySelector("#lane-video-status");
  if (status) status.textContent = `${analysis.video_name || "Analysis"} applied to the shot form.`;
}

function selectedLaneVideoSubject() {
  const selected = document.querySelector("#lane-video-subject-select")?.value || "me";
  const normalized = selected === "guest" ? "guest" : "me";
  const guestName = document.querySelector("#lane-guest-name")?.value.trim() || "";
  const guestPhone = document.querySelector("#lane-guest-phone")?.value.trim() || "";
  return {
    value: normalized,
    label: normalized === "me" ? "Active user" : (guestName ? `Guest user: ${guestName}` : "Guest user"),
    useProfileContext: normalized === "me",
    guestName,
    guestPhone,
    hasGuestContact: Boolean(guestPhone),
  };
}

function syncLaneVideoSubjectFields() {
  const subject = selectedLaneVideoSubject();
  const fields = document.querySelector("[data-lane-guest-fields]");
  if (fields) fields.hidden = subject.value !== "guest";
  return subject;
}

function laneAnalysisShareText(fields = state.laneVideoAnalysisFields || {}) {
  if (!fields || !Object.keys(fields).length) return "";
  const subjectLabel = fields.video_subject_label || titleFromSlug(fields.video_subject || "video shot");
  const lines = [
    "StrikeIQ shot analysis",
    fields.video_name && `Video: ${fields.video_name}`,
    subjectLabel && `Subject: ${subjectLabel}`,
    fields.guest_user_name && `Guest: ${fields.guest_user_name}`,
    fields.guest_user_phone && `Guest phone: ${fields.guest_user_phone}`,
    fields.lane_center && `Center: ${fields.lane_center}`,
    fields.ball && `Ball: ${fields.ball}`,
    fields.release_board && `Board start: ${fields.release_board}`,
    fields.arrows_board && `Arrow start: ${fields.arrows_board}`,
    fields.breakpoint && `Breakpoint: ${fields.breakpoint}`,
    (fields.speed_mph || fields.ball_speed) && `Speed: ${fields.speed_mph || fields.ball_speed}`,
    fields.pin_result && `Pin fall: ${fields.pin_result}`,
    fields.pocket_quality && `Pocket: ${fields.pocket_quality}`,
    fields.adjustment && `Adjustment: ${fields.adjustment}`,
    fields.next_move && `Next move: ${fields.next_move}`,
  ].filter(Boolean);
  return lines.join("\n");
}

function syncLaneAnalysisShareMessage() {
  const message = document.querySelector("#lane-analysis-share-message");
  const stateLabel = document.querySelector("#lane-analysis-share-state");
  const text = laneAnalysisShareText();
  if (message) message.value = text;
  if (stateLabel) stateLabel.textContent = text ? "Ready" : "Pending";
}

function prepareLaneAnalysisShare() {
  const status = document.querySelector("#lane-analysis-share-status");
  const method = document.querySelector("#lane-analysis-share-method")?.value || "email";
  const recipient = document.querySelector("#lane-analysis-share-recipient")?.value.trim() || "";
  const message = laneAnalysisShareText();
  syncLaneAnalysisShareMessage();
  if (!message) {
    if (status) status.textContent = "Analyze a shot first, then StrikeIQ can prepare the completed breakdown.";
    return;
  }
  const encodedBody = encodeURIComponent(message);
  if (method === "text") {
    const phone = recipient.replace(/[^\d+]/g, "");
    window.location.href = `sms:${phone || ""}?&body=${encodedBody}`;
    if (status) status.textContent = "Opening your text app with the completed shot analysis.";
    return;
  }
  const subject = encodeURIComponent("StrikeIQ shot analysis");
  window.location.href = `mailto:${encodeURIComponent(recipient)}?subject=${subject}&body=${encodedBody}`;
  if (status) status.textContent = "Opening your email app with the completed shot analysis.";
}

async function analyzeLaneVideo() {
  const form = document.querySelector("#shot-form");
  if (!form) return;
  const button = document.querySelector("[data-lane-video-analyze]");
  const status = document.querySelector("#lane-video-status");
  const file = document.querySelector("#lane-video-file")?.files?.[0];
  const payload = formPayload(form);
  const isRecorded = (payload.tracking_mode || state.laneVideoMode || "recorded_video") !== "live_video";
  if (isRecorded && !file) {
    if (status) status.textContent = "Select a recorded shot before running analysis.";
    setLaneVideoWorkflow("select", "Select a recorded shot before running analysis.");
    syncLaneVideoAnalyzeAvailability();
    return;
  }
  if (isRecorded && file.size > maxLaneVideoUploadBytes) {
    const message = `Choose a smaller clip. Local uploads are limited to ${formatBytes(maxLaneVideoUploadBytes)}.`;
    if (status) status.textContent = message;
    setLaneVideoWorkflow("select", message);
    syncLaneVideoAnalyzeAvailability();
    return;
  }
  let upload = null;
  const videoSubject = selectedLaneVideoSubject();
  if (videoSubject.value === "guest" && (!videoSubject.guestName || !videoSubject.hasGuestContact)) {
    const message = "Add the guest user's name and cell phone number before analyzing.";
    if (status) status.textContent = message;
    setLaneVideoWorkflow("analyze", message);
    return;
  }
  const request = {
    tracking_mode: payload.tracking_mode || "recorded_video",
    video_name: payload.video_name || file?.name || "",
    video_subject: videoSubject.value,
    video_subject_label: videoSubject.label,
    use_profile_context: videoSubject.useProfileContext,
    guest_user: videoSubject.value === "guest" ? {
      name: videoSubject.guestName,
      phone: videoSubject.guestPhone,
    } : null,
    upload_id: "",
    video: file ? { name: file.name, size: file.size, type: file.type || "video" } : null,
    detection: laneDetectionOptions(),
    calibration: laneCalibrationData(),
    context: {
      lane_center: videoSubject.useProfileContext ? (payload.lane_center || state.profile?.homeCenter || "") : (payload.lane_center || ""),
      ball: videoSubject.useProfileContext ? (payload.ball || profileArsenalItems()[0] || "") : (payload.ball || ""),
      handedness: videoSubject.useProfileContext ? (state.profile?.handedness || "") : "",
      delivery: videoSubject.useProfileContext ? (state.profile?.delivery || "") : "",
      ball_weight: videoSubject.useProfileContext ? (state.profile?.ballWeight || "") : "",
    },
  };
  if (status) status.textContent = file ? "Uploading selected video..." : "Creating live-mode development analysis...";
  setLaneVideoWorkflow("analyze", file ? "Uploading selected video..." : "Creating live-mode development analysis...");
  setLaneAnalysisDetailsVisible(false);
  if (button) button.disabled = true;
  try {
    upload = await uploadLaneVideoFile(file);
    if (upload) {
      request.upload_id = upload.upload_id || "";
      request.video = {
        name: upload.name || file.name,
        size: upload.size || file.size,
        type: upload.type || file.type || "video",
      };
    }
    if (status) status.textContent = "Analyzing stored lane video through the local backend...";
    setLaneVideoWorkflow("analyze", "Analyzing stored lane video through the local backend...");
    const analysis = await api("/api/lane-video/analyze", { method: "POST", body: JSON.stringify(request) });
    applyLaneAnalysisFields(analysis.fields || {});
    if (status) status.textContent = analysis.message || "Analysis complete.";
    setLaneVideoWorkflow("review", "Analysis complete. Review the visual and log the shot.");
    await loadLaneVideoAnalyses();
  } catch (error) {
    if (status) status.textContent = `Analysis unavailable: ${error.message}`;
    setLaneVideoWorkflow(file ? "analyze" : "select", `Analysis unavailable: ${error.message}`);
  } finally {
    syncLaneVideoAnalyzeAvailability({ keepReview: state.laneVideoWorkflowStage === "review" });
  }
}

function parseArsenalItems(value) {
  return String(value || "")
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function profileArsenalItems(profile = state.profile || savedProfile()) {
  return parseArsenalItems(profile?.ballArsenal);
}

function profileArsenalInputs() {
  return [...document.querySelectorAll(".profile-arsenal-ball")];
}

function updateProfileArsenalValue() {
  if (!elements.profileArsenal) return;
  const items = profileArsenalInputs().map((input) => input.value.trim()).filter(Boolean);
  elements.profileArsenal.value = items.join("\n");
}

function setProfileArsenalCount(count) {
  if (!elements.profileArsenalCount || !elements.profileArsenalFields) return;
  const boundedCount = Math.max(1, Math.min(12, Number(count) || 1));
  const existing = profileArsenalInputs().map((input) => input.value.trim());
  elements.profileArsenalCount.value = String(boundedCount);
  elements.profileArsenalFields.innerHTML = Array.from({ length: boundedCount }, (_, index) => {
    const value = existing[index] || "";
    return `
      <label>
        Ball ${index + 1}
        <input class="profile-arsenal-ball" type="text" value="${escapeHtml(value)}" placeholder="Type make, manufacturer, style, or ball name" autocomplete="off">
      </label>
    `;
  }).join("");
  activeArsenalInput = profileArsenalInputs().find((input) => !input.value.trim()) || profileArsenalInputs()[0] || null;
  updateProfileArsenalValue();
  renderProfileArsenalSuggestions();
  renderProfileProgress();
}

function hydrateProfileArsenalFields(savedArsenal, savedCount) {
  const items = parseArsenalItems(savedArsenal);
  const count = Math.max(1, Math.min(12, Number(savedCount) || items.length || 1));
  setProfileArsenalCount(count);
  profileArsenalInputs().forEach((input, index) => {
    input.value = items[index] || "";
  });
  activeArsenalInput = profileArsenalInputs().find((input) => !input.value.trim()) || profileArsenalInputs()[0] || null;
  updateProfileArsenalValue();
  renderProfileArsenalSuggestions();
}

function currentArsenalQuery() {
  return (activeArsenalInput?.value || "").trim().toLowerCase();
}

function selectedArsenalItems() {
  return new Set(profileArsenalInputs().map((input) => input.value.trim().toLowerCase()).filter(Boolean));
}

function ballSearchText(ball) {
  return [
    ball.brand,
    ball.name,
    ball.cover,
    ball.core,
    ball.surface,
    ball.condition,
    ball.motion,
    ball.notes,
  ].filter(Boolean).join(" ").toLowerCase();
}

function renderProfileArsenalSuggestions() {
  if (!elements.profileArsenalSuggestions || !activeArsenalInput) return;
  const query = currentArsenalQuery();
  if (query.length < 2 || !state.balls.length) {
    elements.profileArsenalSuggestions.innerHTML = "";
    elements.profileArsenalSuggestions.classList.remove("is-visible");
    return;
  }

  const selected = selectedArsenalItems();
  const matches = state.balls
    .filter((ball) => {
      const label = [ball.brand, ball.name].filter(Boolean).join(" ").trim();
      return label && !selected.has(label.toLowerCase()) && ballSearchText(ball).includes(query);
    })
    .slice(0, 6);

  if (!matches.length) {
    elements.profileArsenalSuggestions.innerHTML = `<p>No matching balls found.</p>`;
    elements.profileArsenalSuggestions.classList.add("is-visible");
    return;
  }

  elements.profileArsenalSuggestions.innerHTML = matches
    .map((ball) => {
      const label = [ball.brand, ball.name].filter(Boolean).join(" ").trim();
      const meta = [ball.cover, ball.condition, ball.motion].filter(Boolean).join(" | ");
      return `
        <button type="button" data-arsenal-ball="${escapeHtml(label)}">
          <strong>${escapeHtml(label)}</strong>
          ${meta ? `<span>${escapeHtml(meta)}</span>` : ""}
        </button>
      `;
    })
    .join("");
  elements.profileArsenalSuggestions.classList.add("is-visible");
}

function addBallToProfileArsenal(label) {
  if (!activeArsenalInput) return;
  activeArsenalInput.value = label;
  updateProfileArsenalValue();
  const inputs = profileArsenalInputs();
  const nextInput = inputs[inputs.indexOf(activeArsenalInput) + 1];
  activeArsenalInput = nextInput || activeArsenalInput;
  activeArsenalInput.focus();
  elements.profileArsenalSuggestions.innerHTML = "";
  elements.profileArsenalSuggestions.classList.remove("is-visible");
  renderProfileProgress();
}

function formatShotMetric(value, suffix = "") {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  const rounded = Math.round(numeric * 10) / 10;
  return `${rounded}${suffix}`;
}

function formatBytes(value) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return "No file size";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
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
  renderProfileArsenalSuggestions();
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
    queueAppSettingsSave();
  });
  document.querySelector("#spare-session-alley")?.addEventListener("input", (event) => {
    state.spareSession.alley = event.target.value;
    queueAppSettingsSave();
  });
  document.querySelector("#spare-session-games")?.addEventListener("input", handleSpareSessionInput);
  document.querySelector("#spare-session-games")?.addEventListener("change", handleSpareSessionInput);
  document.querySelector("#save-spare-session")?.addEventListener("click", saveSpareSession);
  document.querySelector("#reset-spare-session")?.addEventListener("click", () => {
    state.spareSession = defaultSpareSession();
    renderSpareSessionWorkspace();
    bindSpareSessionControls();
    queueAppSettingsSave();
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
  queueAppSettingsSave();
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
  queueAppSettingsSave();
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
  state.spareSession = normalizeSpareSession(state.spareSession || sessions.latest);
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
  await loadLaneVideoAnalyses();
  state.shotStats = await api("/api/shots/stats").catch(() => ({
    total: state.shots.length,
    video_total: state.shots.filter((shot) => shot.shot_source === "video_analysis_import").length,
    strikes: state.shots.filter((shot) => String(shot.result || "").toLowerCase().includes("strike")).length,
    average_speed: null,
    average_hook: null,
    common_leave: null,
  }));
  renderHomeDashboard();
  hydrateLaneTrackerForm();
  const summary = document.querySelector("#lane-summary");
  if (summary) {
    const isProLane = hasProAccess();
    const strikes = Number(state.shotStats.strikes || 0);
    const videoImports = Number(state.shotStats.video_total || 0);
    const speeds = state.shots
      .map((shot) => Number(shot.speed_mph) || laneMetricNumber(shot.ball_speed))
      .filter(Number.isFinite);
    const hooks = state.shots.map((shot) => Number(shot.hook_inches)).filter(Number.isFinite);
    const avgSpeed = Number(state.shotStats.average_speed) || (speeds.length ? speeds.reduce((sum, value) => sum + value, 0) / speeds.length : null);
    const avgHook = Number(state.shotStats.average_hook) || (hooks.length ? hooks.reduce((sum, value) => sum + value, 0) / hooks.length : null);
    const leaves = state.shots
      .map((shot) => shot.leave_pin)
      .filter(Boolean)
      .reduce((acc, leave) => {
        acc[leave] = (acc[leave] || 0) + 1;
        return acc;
      }, {});
    const commonLeave = state.shotStats.common_leave || Object.entries(leaves).sort((a, b) => b[1] - a[1])[0]?.[0] || "No leaves logged";
    const latest = state.shots[0];
    summary.innerHTML = isProLane
      ? `
        <span><b>${Number(state.shotStats.total || state.shots.length)}</b> shots</span>
        <span><b>${videoImports}</b> video analyzed</span>
        <span><b>${strikes}</b> strikes</span>
        <span><b>${avgSpeed ? formatShotMetric(avgSpeed, " mph") : "No speed"}</b> avg speed</span>
        <span><b>${avgHook ? formatShotMetric(avgHook, " in") : "No hook"}</b> avg hook</span>
        <span><b>${escapeHtml(commonLeave)}</b> common leave</span>
        <span><b>${escapeHtml(latest?.lane_center || state.profile?.homeCenter || "Center not set")}</b> latest center</span>
      `
      : `
        <span><b>${Number(state.shotStats.total || state.shots.length)}</b> shots</span>
        <span><b>${strikes}</b> strikes</span>
        <span><b>${avgSpeed ? formatShotMetric(avgSpeed, " mph") : "No speed"}</b> avg speed</span>
        <span><b>${escapeHtml(latest?.feet_board || "Not set")}</b> last board start</span>
        <span><b>${escapeHtml(latest?.arrows_board || "Not set")}</b> last arrow start</span>
        <span><b>${escapeHtml(latest?.result || "No result")}</b> last pin fall</span>
      `;
  }
  renderProjectList("#shot-list", state.shots, "No lane entries logged yet.", (shot) => `
    <article class="project-record">
      <strong>${escapeHtml(shot.result)}</strong>
      <span>${escapeHtml(hasProAccess() ? [shot.session_date, shot.lane_center, shot.lane_number && `Lane ${shot.lane_number}`, shot.shot_source === "video_analysis_import" && "Video analysis"].filter(Boolean).join(" | ") || "Session not set" : "Basic lane tracker")}</span>
      ${hasProAccess() ? `<p>${escapeHtml([shot.ball || shot.video_name || "Ball not set", shot.pattern_name || "No pattern", shot.lane_condition, shot.confidence_label && `Confidence ${shot.confidence_label}`].filter(Boolean).join(" | "))}</p>` : ""}
      <p>${escapeHtml([
        hasProAccess() && shot.release_board && `Release ${shot.release_board}`,
        shot.feet_board && `Board start ${shot.feet_board}`,
        shot.arrows_board && `Arrow start ${shot.arrows_board}`,
        hasProAccess() && shot.target && shot.shot_source !== "video_analysis_import" && `Target ${shot.target}`,
        hasProAccess() && shot.breakpoint && `Breakpoint ${shot.breakpoint}`,
        hasProAccess() && shot.entry_board && `Entry ${shot.entry_board}`,
        hasProAccess() && shot.speed_mph && formatShotMetric(shot.speed_mph, " mph"),
        hasProAccess() && shot.hook_inches && formatShotMetric(shot.hook_inches, " in hook"),
        hasProAccess() && shot.boards_crossed && formatShotMetric(shot.boards_crossed, " boards"),
        !shot.speed_mph && shot.ball_speed && `${shot.ball_speed}`
      ].filter(Boolean).join(" | ") || "Target not set")}</p>
      ${hasProAccess() && (shot.leave_pin || shot.miss_direction || shot.pocket_quality || shot.pin_result || shot.impact_result) ? `<p>${escapeHtml([shot.miss_direction && `Miss ${shot.miss_direction}`, shot.pocket_quality && `Pocket ${shot.pocket_quality}`, shot.pin_result && `Pins ${shot.pin_result}`, shot.impact_result && `Impact ${shot.impact_result}`, shot.leave_pin && `Leave ${shot.leave_pin}`].filter(Boolean).join(" | "))}</p>` : ""}
      ${hasProAccess() && shot.adjustment ? `<p><b>Adjustment:</b> ${escapeHtml(shot.adjustment)}</p>` : ""}
      ${hasProAccess() && shot.next_move ? `<p><b>Next move:</b> ${escapeHtml(shot.next_move)}</p>` : ""}
      ${hasProAccess() && (shot.quality_label || shot.consistency_label) ? `<p>${escapeHtml([shot.quality_label && `Quality ${shot.quality_label}`, shot.consistency_label && `Consistency ${shot.consistency_label}`].filter(Boolean).join(" | "))}</p>` : ""}
      ${hasProAccess() && shot.notes ? `<small>${escapeHtml(shot.notes)}</small>` : ""}
    </article>
  `);
  renderLaneFreeSnapshot();
  renderLaneShotSavePreview();
}

function renderChat() {
  const channelList = document.querySelector("#chat-channel-list");
  const channelSelect = document.querySelector("#community-channel");
  const activeTitle = document.querySelector("#active-channel-title");
  const profileCard = document.querySelector("#social-profile-card");
  const socialStats = document.querySelector("#social-stats");
  const visiblePosts = state.communityPosts.filter((post) => post.channel === state.chatChannel);
  const totalComments = state.communityPosts.reduce((sum, post) => sum + Number(post.comments_count || 0), 0);
  const totalLikes = state.communityPosts.reduce((sum, post) => sum + Number(post.likes || 0), 0);

  if (profileCard) {
    const profile = state.profile || {};
    const displayName = displayNameForProfile(profile);
    profileCard.innerHTML = `
      <div class="social-avatar">${escapeHtml(displayName.slice(0, 2).toUpperCase())}</div>
      <div>
        <strong>${escapeHtml(displayName)}</strong>
        <span>${escapeHtml(profile.homeCenter || "Home center not set")}</span>
      </div>
    `;
  }
  if (socialStats) {
    socialStats.innerHTML = `
      <article><strong>${state.communityPosts.length}</strong><span>posts</span></article>
      <article><strong>${totalLikes}</strong><span>likes</span></article>
      <article><strong>${totalComments}</strong><span>comments</span></article>
    `;
  }
  if (channelList) {
    channelList.innerHTML = chatChannels
      .map(
        ([channel, description]) => `
          <button type="button" class="${channel === state.chatChannel ? "is-active" : ""}" data-chat-channel="${escapeHtml(channel)}">
            <strong>${escapeHtml(channel)}</strong>
            <span>${escapeHtml(description)}</span>
            <small>${state.communityPosts.filter((post) => post.channel === channel).length}</small>
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
    activeTitle.textContent = `${state.chatChannel} (${visiblePosts.length})`;
  }

  renderCommunityPosts();
  renderProjectList("#chat-list", state.chat, "No coach messages yet.", (message) => `
    <article class="project-record ${message.role === "user" ? "is-user" : ""}">
      <strong>${message.role === "user" ? "You" : "Coach"}</strong>
      <p>${escapeHtml(message.text)}</p>
    </article>
  `);
}

const socialPostTypeLabels = {
  update: "Update",
  video: "Video",
  score: "Score",
  question: "Question",
  gear: "Gear",
};

function renderSocialTags(tags) {
  return String(tags || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 5)
    .map((tag) => `<span>#${escapeHtml(tag.replace(/^#/, ""))}</span>`)
    .join("");
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
              <div class="community-post-header">
                <div class="social-avatar">${escapeHtml(String(post.user_name || "SI").slice(0, 2).toUpperCase())}</div>
                <div>
                  <span>${escapeHtml(post.user_name || "StrikeIQ member")} · ${escapeHtml(socialPostTypeLabels[post.post_type] || "Post")}</span>
                  <strong>${escapeHtml(post.title || "Untitled post")}</strong>
                </div>
              </div>
              ${post.score ? `<p class="social-score">${escapeHtml(post.score)}</p>` : ""}
              ${post.body ? `<p>${escapeHtml(post.body)}</p>` : ""}
              ${post.shot_type ? `<p class="community-meta">Shot type: ${escapeHtml(post.shot_type)}</p>` : ""}
              ${post.feedback_request ? `<p>${escapeHtml(post.feedback_request)}</p>` : ""}
              ${post.video_url ? `<a href="${escapeHtml(post.video_url)}" target="_blank" rel="noopener">Open Video</a>` : ""}
              ${post.video_name && !post.video_url ? `<small>${escapeHtml(post.video_name)}</small>` : ""}
              ${post.tags ? `<div class="social-tags">${renderSocialTags(post.tags)}</div>` : ""}
              <div class="social-actions">
                <button type="button" data-social-like="${post.id}">Like <span>${Number(post.likes || 0)}</span></button>
                <span>${Number(post.comments_count || 0)} comments</span>
              </div>
              ${(post.comments || []).length ? `
                <div class="social-comments">
                  ${(post.comments || []).map((comment) => `
                    <article>
                      <strong>${escapeHtml(comment.user_name || "StrikeIQ member")}</strong>
                      <p>${escapeHtml(comment.body)}</p>
                    </article>
                  `).join("")}
                </div>
              ` : ""}
              <form class="social-comment-form" data-post-id="${post.id}">
                <input name="body" placeholder="Write a comment" aria-label="Write a comment" required>
                <button type="submit">Comment</button>
              </form>
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
      queueAppSettingsSave();
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
      queueAppSettingsSave();
      redraw();
    });
  });

  panel.querySelector("[data-target-path-reset]")?.addEventListener("click", () => {
    state.targetPath = null;
    panel.querySelectorAll("[data-target-path]").forEach((input) => {
      input.value = Math.round(defaultTargetPath(pattern)[input.dataset.targetPath]);
    });
    queueAppSettingsSave();
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
  syncLaneVideoSubjectFields();
  elements.loginForm.addEventListener("submit", handleLogin);
  elements.profileForm.addEventListener("submit", handleProfileSubmit);
  elements.findHomeCenters?.addEventListener("click", findNearbyHomeCenters);
  elements.nearbyHomeCenters?.addEventListener("change", () => {
    if (elements.nearbyHomeCenters.value) {
      elements.profileCenter.value = elements.nearbyHomeCenters.value;
      renderProfileProgress();
    }
  });
  elements.profileArsenalCount?.addEventListener("change", () => setProfileArsenalCount(elements.profileArsenalCount.value));
  document.addEventListener("change", (event) => {
    if (event.target.closest("#profile-form")) {
      renderProfileProgress();
    }
    const laneSelect = event.target.closest("#nearby-lane-centers");
    const laneInput = document.querySelector("#lane-session-center");
    if (laneSelect?.value && laneInput) {
      laneInput.value = laneSelect.value;
    }
    const modeInput = event.target.closest("input[name='tracking_mode_choice']");
    if (modeInput) {
      updateLaneVideoMode(modeInput.value, true);
    }
    if (event.target.closest("input[name='detect_lane'], input[name='detect_ball'], input[name='detect_release'], input[name='detect_pins']")) {
      laneDetectionOptions();
      queueAppSettingsSave();
    }
    if (event.target.closest("#lane-video-subject-select")) {
      const subject = syncLaneVideoSubjectFields();
      const status = document.querySelector("#lane-video-status");
      if (status) {
        status.textContent = subject.useProfileContext
          ? "Profile context will be used only as fallback for this video."
          : "Add guest details, then analysis will rely on the clip instead of the active profile.";
      }
    }
    const videoFile = event.target.closest("#lane-video-file");
    if (videoFile) {
      handleLaneVideoFile(videoFile);
    }
    if (event.target.closest(".lane-calibration-panel")) {
      updateLaneCalibrationSummary();
      renderLaneBreakdownVisual();
      queueAppSettingsSave();
    }
  });
  document.addEventListener("input", (event) => {
    if (event.target.closest("#profile-form")) {
      renderProfileProgress();
    }
    const arsenalInput = event.target.closest(".profile-arsenal-ball");
    if (arsenalInput) {
      activeArsenalInput = arsenalInput;
      updateProfileArsenalValue();
      renderProfileArsenalSuggestions();
    }
    if (event.target.closest(".lane-calibration-panel")) {
      updateLaneCalibrationSummary();
      renderLaneBreakdownVisual();
      queueAppSettingsSave();
    }
    if (event.target.closest("#shot-form")) {
      if (laneRecommendationDriverChanged(event.target)) {
        const fieldName = event.target.closest("input, select, textarea")?.name || "";
        const sourceLabel = fieldName === "result" || fieldName === "pin_result"
          ? "Auto from pin result"
          : "Auto from latest shot";
        syncLaneAutoNextMove({ overwrite: true, source: sourceLabel });
      } else if (["adjustment", "next_move"].includes(event.target.closest("input, select, textarea")?.name || "")) {
        state.laneAutoNextMoveSource = "Manual override";
        updateLaneAutoNextMoveState();
      }
      renderLaneFreeSnapshot();
      renderLaneShotSavePreview();
      renderLaneBreakdownVisual();
    }
  });
  document.addEventListener("pointerdown", (event) => {
    const viewer = event.target.closest("[data-lane-breakdown-drag]");
    if (!viewer) return;
    const current = state.laneBreakdownView || { mode: "3d", rotation: 0, zoom: 1, tilt: 58 };
    state.laneBreakdownDrag = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      rotation: Number(current.rotation) || 0,
      tilt: Number(current.tilt) || 58,
    };
    viewer.setPointerCapture?.(event.pointerId);
    viewer.classList.add("is-dragging");
  });
  document.addEventListener("pointermove", (event) => {
    const drag = state.laneBreakdownDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const nextRotation = drag.rotation + (event.clientX - drag.x) * 0.55;
    const nextTilt = clamp(drag.tilt - (event.clientY - drag.y) * 0.16, 38, 70);
    updateLaneBreakdownView({ mode: "3d", rotation: nextRotation, tilt: nextTilt });
  });
  document.addEventListener("pointerup", (event) => {
    if (state.laneBreakdownDrag?.pointerId !== event.pointerId) return;
    document.querySelector("[data-lane-breakdown-drag]")?.classList.remove("is-dragging");
    state.laneBreakdownDrag = null;
  });
  document.addEventListener("pointercancel", (event) => {
    if (state.laneBreakdownDrag?.pointerId !== event.pointerId) return;
    document.querySelector("[data-lane-breakdown-drag]")?.classList.remove("is-dragging");
    state.laneBreakdownDrag = null;
  });
  document.addEventListener("click", (event) => {
    const quickResult = event.target.closest("[data-lane-result]");
    if (quickResult) {
      applyLaneQuickResult(quickResult.dataset.laneResult || "");
      return;
    }
    if (event.target.closest("[data-lane-result-custom]")) {
      document.querySelector("input[name='result']")?.focus();
    }
  });
  document.addEventListener("wheel", (event) => {
    if (!event.target.closest("[data-lane-breakdown-drag]")) return;
    event.preventDefault();
    const current = state.laneBreakdownView || { mode: "3d", rotation: 0, zoom: 1, tilt: 58 };
    updateLaneBreakdownView({
      mode: "3d",
      zoom: (Number(current.zoom) || 1) + (event.deltaY < 0 ? 0.08 : -0.08),
    });
  }, { passive: false });
  document.addEventListener("focusin", (event) => {
    const arsenalInput = event.target.closest(".profile-arsenal-ball");
    if (!arsenalInput) return;
    activeArsenalInput = arsenalInput;
    renderProfileArsenalSuggestions();
  });
  elements.authToggle.addEventListener("click", () => setAuthMode(authMode === "create" ? "login" : "create"));
  elements.logout.addEventListener("click", handleLogout);
  elements.upgradeButton.addEventListener("click", () => setProject("upgrade"));

  document.addEventListener("click", async (event) => {
    if (event.target.closest("#find-lane-centers")) {
      findNearbyLaneCenters();
      return;
    }

    if (event.target.closest("[data-lane-video-analyze]")) {
      analyzeLaneVideo();
      return;
    }
    if (event.target.closest("[data-lane-share-analysis]")) {
      prepareLaneAnalysisShare();
      return;
    }
    if (event.target.closest("[data-lane-track-apply]")) {
      applyLaneTrackCorrection();
      return;
    }

    if (event.target.closest("[data-lane-review-shot]")) {
      document.querySelector("#lane-shot-save-preview")?.scrollIntoView({ behavior: "smooth", block: "center" });
      document.querySelector("input[name='result']")?.focus({ preventScroll: true });
      return;
    }

    const breakdownViewButton = event.target.closest("[data-lane-breakdown-view]");
    if (breakdownViewButton) {
      updateLaneBreakdownView({ mode: breakdownViewButton.dataset.laneBreakdownView });
      return;
    }

    const breakdownRotateButton = event.target.closest("[data-lane-breakdown-rotate]");
    if (breakdownRotateButton) {
      const current = state.laneBreakdownView || { mode: "3d", rotation: 0, zoom: 1, tilt: 58 };
      updateLaneBreakdownView({
        mode: "3d",
        rotation: (Number(current.rotation) || 0) + Number(breakdownRotateButton.dataset.laneBreakdownRotate || 0),
      });
      return;
    }

    const breakdownZoomButton = event.target.closest("[data-lane-breakdown-zoom]");
    if (breakdownZoomButton) {
      const current = state.laneBreakdownView || { mode: "3d", rotation: 0, zoom: 1, tilt: 58 };
      updateLaneBreakdownView({
        mode: "3d",
        zoom: (Number(current.zoom) || 1) + Number(breakdownZoomButton.dataset.laneBreakdownZoom || 0) * 0.15,
      });
      return;
    }

    const breakdownTiltButton = event.target.closest("[data-lane-breakdown-tilt]");
    if (breakdownTiltButton) {
      const current = state.laneBreakdownView || { mode: "3d", rotation: 0, zoom: 1, tilt: 58 };
      updateLaneBreakdownView({
        mode: "3d",
        tilt: (Number(current.tilt) || 58) + Number(breakdownTiltButton.dataset.laneBreakdownTilt || 0),
      });
      return;
    }

    if (event.target.closest("[data-lane-breakdown-reset]")) {
      updateLaneBreakdownView({ mode: "3d", rotation: 0, zoom: 1, tilt: 58 });
      return;
    }

    if (event.target.closest("[data-lane-calibration-preview]")) {
      updateLaneCalibrationSummary();
      const status = document.querySelector("#lane-video-status");
      if (status) status.textContent = "Calibration confirmed for the next analysis run.";
      queueAppSettingsSave();
      return;
    }

    if (event.target.closest("[data-refresh-lane-analyses]")) {
      loadLaneVideoAnalyses();
      return;
    }

    const laneAnalysisButton = event.target.closest("[data-lane-analysis-run]");
    if (laneAnalysisButton) {
      applyLaneAnalysisRun(laneAnalysisButton.dataset.laneAnalysisRun);
      return;
    }

    if (event.target.closest("[data-lane-live-preview]")) {
      startLaneLiveCamera();
      return;
    }

    if (event.target.closest("[data-lane-live-stop]")) {
      stopLaneLiveCamera();
      return;
    }

    if (event.target.closest("[data-lane-recorded-fallback]")) {
      updateLaneVideoMode("recorded_video", true);
      return;
    }

    const arsenalButton = event.target.closest("[data-arsenal-ball]");
    if (arsenalButton) {
      addBallToProfileArsenal(arsenalButton.dataset.arsenalBall);
      return;
    }

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

    const laneBallButton = event.target.closest("[data-lane-ball]");
    if (laneBallButton) {
      const ballSelect = document.querySelector("#lane-shot-ball");
      if (ballSelect) {
        ballSelect.value = laneBallButton.dataset.laneBall;
      }
      return;
    }

    const profileHomeButton = event.target.closest("[data-profile-home]");
    if (profileHomeButton) {
      showAppShell();
      return;
    }

    const channelButton = event.target.closest("[data-chat-channel]");
    if (channelButton) {
      state.chatChannel = channelButton.dataset.chatChannel;
      renderChat();
      queueAppSettingsSave();
      return;
    }

    const likeButton = event.target.closest("[data-social-like]");
    if (likeButton) {
      likeButton.disabled = true;
      try {
        state.communityPosts = await api(`/api/chat/posts/${likeButton.dataset.socialLike}/reactions`, { method: "POST" });
        renderChat();
      } catch {
        likeButton.disabled = false;
      }
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

    if (form.classList.contains("social-comment-form")) {
      event.preventDefault();
      const postId = form.dataset.postId;
      const payload = formPayload(form);
      payload.user_name = displayNameForProfile(state.profile) || "StrikeIQ member";
      await api(`/api/chat/posts/${postId}/comments`, { method: "POST", body: JSON.stringify(payload) });
      form.reset();
      await loadCommunityPosts();
    } else if (form.id === "custom-pattern-form") {
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
      const isProShot = hasProAccess();
      payload.pattern_slug = isProShot ? state.selectedSlug || "" : "";
      payload.lane_center = isProShot ? payload.lane_center || state.profile?.homeCenter || "" : "";
      payload.ball = isProShot ? payload.ball || profileArsenalItems()[0] || "" : "";
      if (!isProShot) {
        payload.shot_source = "free_basic";
        payload.tracking_mode = "manual_basic";
        payload.pin_result = payload.result || "";
      }
      await api("/api/shots", { method: "POST", body: JSON.stringify(payload) });
      form.reset();
      hydrateLaneTrackerForm();
      await loadShots();
    } else if (form.id === "community-post-form") {
      event.preventDefault();
      const payload = formPayload(form);
      payload.user_name = displayNameForProfile(state.profile) || "StrikeIQ member";
      state.chatChannel = String(payload.channel || state.chatChannel);
      queueAppSettingsSave();
      const status = document.querySelector("#community-post-status");
      if (status) status.textContent = "Publishing post...";
      await api("/api/chat/posts", { method: "POST", body: JSON.stringify(payload) });
      form.reset();
      if (status) status.textContent = "Post published.";
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
  if (elements.copyrightYear) {
    elements.copyrightYear.textContent = String(new Date().getFullYear());
  }
  syncMobileFilterState();
  window.addEventListener("resize", syncMobileFilterState);
  bindEvents();
  await loadAppSettings();
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
