PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS oil_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  organization TEXT,
  pattern_type TEXT NOT NULL CHECK (
    pattern_type IN ('house', 'sport', 'challenge', 'pba', 'custom')
  ),
  length_ft INTEGER NOT NULL CHECK (length_ft > 0),
  volume_ml REAL CHECK (volume_ml IS NULL OR volume_ml > 0),
  ratio TEXT,
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  summary TEXT NOT NULL,
  play_strategy TEXT NOT NULL,
  ball_motion TEXT NOT NULL,
  suggested_line_right TEXT NOT NULL,
  suggested_line_left TEXT NOT NULL,
  recommended_equipment TEXT NOT NULL,
  common_adjustments TEXT NOT NULL,
  source_note TEXT NOT NULL DEFAULT 'Use as an app reference. Verify official lane graphs before tournament play.',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pattern_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS oil_pattern_tags (
  oil_pattern_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (oil_pattern_id, tag_id),
  FOREIGN KEY (oil_pattern_id) REFERENCES oil_patterns(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES pattern_tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pattern_zones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  oil_pattern_id INTEGER NOT NULL,
  board_start INTEGER NOT NULL CHECK (board_start BETWEEN 1 AND 40),
  board_end INTEGER NOT NULL CHECK (board_end BETWEEN 1 AND 40),
  distance_start_ft INTEGER NOT NULL CHECK (distance_start_ft >= 0),
  distance_end_ft INTEGER NOT NULL CHECK (distance_end_ft > distance_start_ft),
  oil_level INTEGER NOT NULL CHECK (oil_level BETWEEN 0 AND 100),
  note TEXT NOT NULL,
  FOREIGN KEY (oil_pattern_id) REFERENCES oil_patterns(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pattern_play_profiles (
  oil_pattern_id INTEGER PRIMARY KEY,
  rule_of_31_board INTEGER NOT NULL CHECK (rule_of_31_board BETWEEN 1 AND 40),
  breakpoint_range TEXT NOT NULL,
  ideal_axis_rotation TEXT NOT NULL,
  friction_response TEXT NOT NULL,
  inside_miss_room TEXT NOT NULL,
  outside_miss_room TEXT NOT NULL,
  hold_area TEXT NOT NULL,
  recovery_area TEXT NOT NULL,
  speed_control TEXT NOT NULL,
  rev_rate_matchup TEXT NOT NULL,
  spare_priority TEXT NOT NULL,
  FOREIGN KEY (oil_pattern_id) REFERENCES oil_patterns(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pattern_transition_phases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  oil_pattern_id INTEGER NOT NULL,
  phase_order INTEGER NOT NULL CHECK (phase_order > 0),
  phase_name TEXT NOT NULL,
  frame_window TEXT NOT NULL,
  what_to_watch TEXT NOT NULL,
  move_strategy TEXT NOT NULL,
  ball_change TEXT NOT NULL,
  FOREIGN KEY (oil_pattern_id) REFERENCES oil_patterns(id) ON DELETE CASCADE,
  UNIQUE (oil_pattern_id, phase_order)
);

CREATE TABLE IF NOT EXISTS pattern_equipment_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  oil_pattern_id INTEGER NOT NULL,
  option_order INTEGER NOT NULL CHECK (option_order > 0),
  bowler_style TEXT NOT NULL,
  ball_type TEXT NOT NULL,
  surface TEXT NOT NULL,
  when_to_use TEXT NOT NULL,
  FOREIGN KEY (oil_pattern_id) REFERENCES oil_patterns(id) ON DELETE CASCADE,
  UNIQUE (oil_pattern_id, option_order)
);

CREATE TABLE IF NOT EXISTS pattern_lane_intelligence (
  oil_pattern_id INTEGER PRIMARY KEY,
  oil_shape TEXT NOT NULL,
  volume_class TEXT NOT NULL,
  friction_expectation TEXT NOT NULL,
  scoring_pace TEXT NOT NULL,
  target_window_right TEXT NOT NULL,
  target_window_left TEXT NOT NULL,
  breakpoint_window TEXT NOT NULL,
  miss_risk TEXT NOT NULL,
  first_move_trigger TEXT NOT NULL,
  surface_guidance TEXT NOT NULL,
  practice_focus TEXT NOT NULL,
  FOREIGN KEY (oil_pattern_id) REFERENCES oil_patterns(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pattern_external_refs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  oil_pattern_id INTEGER NOT NULL,
  source_name TEXT NOT NULL,
  source_home_url TEXT NOT NULL,
  pattern_page_url TEXT,
  search_url TEXT NOT NULL,
  pdf_url TEXT,
  download_url TEXT,
  kosi_url TEXT,
  reference_note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (oil_pattern_id) REFERENCES oil_patterns(id) ON DELETE CASCADE,
  UNIQUE (oil_pattern_id, source_name)
);

CREATE TABLE IF NOT EXISTS source_catalog_status (
  source_name TEXT PRIMARY KEY,
  source_home_url TEXT NOT NULL,
  official_count INTEGER NOT NULL CHECK (official_count >= 0),
  imported_count INTEGER NOT NULL DEFAULT 0 CHECK (imported_count >= 0),
  source_note TEXT NOT NULL,
  checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS source_catalog_backlog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_name TEXT NOT NULL,
  pattern_name TEXT NOT NULL,
  pattern_page_url TEXT,
  pdf_url TEXT,
  kosi_url TEXT,
  length_ft INTEGER CHECK (length_ft IS NULL OR length_ft > 0),
  volume_ml REAL CHECK (volume_ml IS NULL OR volume_ml > 0),
  import_status TEXT NOT NULL DEFAULT 'not_imported' CHECK (
    import_status IN ('not_imported', 'queued', 'imported', 'blocked')
  ),
  note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (source_name, pattern_name)
);

CREATE TABLE IF NOT EXISTS sync_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_name TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  checked_count INTEGER NOT NULL DEFAULT 0,
  changed_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  message TEXT
);

CREATE TABLE IF NOT EXISTS external_ref_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sync_run_id INTEGER NOT NULL,
  external_ref_id INTEGER NOT NULL,
  url_type TEXT NOT NULL CHECK (url_type IN ('source_home', 'pattern_page', 'pdf', 'download', 'kosi')),
  url TEXT NOT NULL,
  http_status INTEGER,
  content_hash TEXT,
  content_length INTEGER,
  changed INTEGER NOT NULL DEFAULT 0 CHECK (changed IN (0, 1)),
  needs_review INTEGER NOT NULL DEFAULT 0 CHECK (needs_review IN (0, 1)),
  error_message TEXT,
  checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sync_run_id) REFERENCES sync_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (external_ref_id) REFERENCES pattern_external_refs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS official_pattern_imports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  oil_pattern_id INTEGER,
  source_name TEXT NOT NULL DEFAULT 'Kegel Pattern Library',
  source_url TEXT,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  extracted_name TEXT,
  extracted_length_ft INTEGER,
  extracted_volume_ml REAL,
  extracted_ratio TEXT,
  raw_text TEXT,
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    review_status IN ('pending', 'approved', 'rejected')
  ),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  FOREIGN KEY (oil_pattern_id) REFERENCES oil_patterns(id) ON DELETE SET NULL,
  UNIQUE (file_hash)
);

CREATE TABLE IF NOT EXISTS user_pattern_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  oil_pattern_id INTEGER NOT NULL,
  user_id TEXT,
  lane_center TEXT,
  ball_used TEXT,
  starting_line TEXT,
  score INTEGER CHECK (score IS NULL OR score BETWEEN 0 AND 300),
  note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (oil_pattern_id) REFERENCES oil_patterns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_oil_patterns_length ON oil_patterns(length_ft);
CREATE INDEX IF NOT EXISTS idx_oil_patterns_type ON oil_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_oil_patterns_difficulty ON oil_patterns(difficulty);
CREATE INDEX IF NOT EXISTS idx_pattern_zones_pattern ON pattern_zones(oil_pattern_id);
CREATE INDEX IF NOT EXISTS idx_transition_pattern ON pattern_transition_phases(oil_pattern_id);
CREATE INDEX IF NOT EXISTS idx_equipment_pattern ON pattern_equipment_options(oil_pattern_id);
CREATE INDEX IF NOT EXISTS idx_lane_intelligence_pattern ON pattern_lane_intelligence(oil_pattern_id);
CREATE INDEX IF NOT EXISTS idx_external_refs_pattern ON pattern_external_refs(oil_pattern_id);
CREATE INDEX IF NOT EXISTS idx_source_backlog_status ON source_catalog_backlog(source_name, import_status);
CREATE INDEX IF NOT EXISTS idx_external_checks_ref ON external_ref_checks(external_ref_id);
CREATE INDEX IF NOT EXISTS idx_external_checks_review ON external_ref_checks(needs_review, checked_at);
CREATE INDEX IF NOT EXISTS idx_official_imports_status ON official_pattern_imports(review_status, created_at);
CREATE INDEX IF NOT EXISTS idx_sync_runs_source ON sync_runs(source_name, started_at);
CREATE INDEX IF NOT EXISTS idx_user_notes_pattern ON user_pattern_notes(oil_pattern_id);

CREATE VIEW IF NOT EXISTS oil_pattern_cards AS
SELECT
  id,
  slug,
  name,
  organization,
  pattern_type,
  length_ft,
  volume_ml,
  ratio,
  difficulty,
  summary,
  suggested_line_right,
  suggested_line_left,
  recommended_equipment
FROM oil_patterns;
