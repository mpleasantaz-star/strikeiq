PRAGMA foreign_keys = ON;

INSERT INTO pattern_tags (name) VALUES
  ('beginner-friendly'),
  ('league'),
  ('tournament'),
  ('short'),
  ('medium'),
  ('long'),
  ('outside-line'),
  ('inside-line'),
  ('spare-shooting-important'),
  ('high-friction'),
  ('low-forgiveness'),
  ('multiple-angles')
ON CONFLICT(name) DO NOTHING;

INSERT INTO oil_patterns (
  slug,
  name,
  organization,
  pattern_type,
  length_ft,
  volume_ml,
  ratio,
  difficulty,
  summary,
  play_strategy,
  ball_motion,
  suggested_line_right,
  suggested_line_left,
  recommended_equipment,
  common_adjustments
) VALUES
(
  'typical-house-shot',
  'Typical House Shot',
  'Bowling center',
  'house',
  40,
  NULL,
  'High ratio',
  1,
  'A forgiving league pattern with more oil in the middle and drier outside boards.',
  'Use the dry outside area as recovery and keep the ball near the track area. Misses toward the gutter can recover, while misses inside tend to hold.',
  'Predictable skid through the front with a readable move off the dry boards.',
  'Start around 15 with the feet and project toward 8-10 at the arrows or breakpoint.',
  'Start around 25 with the feet and project toward 30-32 at the arrows or breakpoint.',
  'Medium reactive ball for most bowlers; stronger cover if the lane has heavier volume.',
  'Move inside as the track dries. If the ball over-hooks, add speed, move in, or switch to a cleaner cover.'
),
(
  'sport-flat',
  'Flat Sport Pattern',
  'Tournament',
  'sport',
  40,
  NULL,
  'Low ratio',
  5,
  'A demanding pattern with little side-to-side help from the lane.',
  'Keep angles controlled and prioritize pocket hits. Accuracy, speed control, and spare shooting matter more than creating a big hook.',
  'Misses do not self-correct much; shots pushed right tend to stay right and tugged shots can cross high.',
  'Use a direct line near the oil edge for your speed and rev rate, often around 10-13 at the arrows.',
  'Use a direct line near the oil edge for your speed and rev rate, often around 27-30 at the arrows.',
  'Smooth benchmark reactive or urethane depending on friction; avoid overly sharp backend motion early.',
  'Make small one-and-one moves. If carry is weak, adjust entry angle before changing balls.'
),
(
  'pba-cheetah-style',
  'Cheetah Style',
  'PBA-style reference',
  'pba',
  33,
  27.05,
  'Sport',
  4,
  'A short pattern that encourages outside angles and early friction.',
  'Keep the breakpoint closer to the gutter and use the early dry boards to shape the shot. Avoid sending the ball too far inside early.',
  'Earlier hook with strong response to friction.',
  'Play outside, often around 5-8 at the arrows with a breakpoint near 3-5.',
  'Play outside from the left side, often around 32-35 at the arrows with a breakpoint near 36-38.',
  'Urethane, smooth reactive, or lower-flare equipment can control the early friction.',
  'If the ball jumps, move left and keep the breakpoint outside. If it misses right, square up or use more surface.'
),
(
  'pba-chameleon-style',
  'Chameleon Style',
  'PBA-style reference',
  'pba',
  39,
  33.5,
  'Sport',
  3,
  'A medium pattern that can support more than one playable angle.',
  'Read the lane during practice and choose the best blend of hold and friction. Both direct and moderate inside lines can work.',
  'Balanced shape with enough length to choose different launch angles.',
  'Start near 12-15 at the arrows and adjust based on friction and carry.',
  'Start near 25-28 at the arrows and adjust based on friction and carry.',
  'Benchmark reactive is a good starting point; adjust surface for lane friction.',
  'Move in as the track opens. If the backend is too sharp, use a smoother cover or more forward roll.'
),
(
  'pba-scorpion-style',
  'Scorpion Style',
  'PBA-style reference',
  'pba',
  42,
  30.55,
  'Sport',
  4,
  'A medium-long pattern that rewards controlled ball motion and good launch angles.',
  'Avoid giving away the pocket with too much side rotation. Blend the wet/dry and keep the ball in front of you until transition is clear.',
  'Skids longer than medium house conditions and needs a controlled move downlane.',
  'Start near 14-17 at the arrows with a breakpoint around 8-10.',
  'Start near 23-26 at the arrows with a breakpoint around 31-33.',
  'Solid reactive or hybrid reactive with moderate surface for control.',
  'If the ball labors, move right or use more surface. If it jumps late, move in and smooth the shape.'
),
(
  'pba-shark-style',
  'Shark Style',
  'PBA-style reference',
  'pba',
  48,
  30.0,
  'Sport',
  5,
  'A long pattern where the ball hooks later and outside misses have less recovery.',
  'Keep the ball in the oil longer and avoid early outside angles. Create pocket control with straighter launch and forward roll.',
  'Long skid with late, controlled hook when matched correctly.',
  'Play inside or direct through the track, often 18-22 at the arrows with a breakpoint near 10-13.',
  'Play inside or direct from the left side, often 18-22 boards mirrored from the left with a breakpoint near 28-31.',
  'Strong solid reactive with surface for most players; straighter players may need less surface to retain energy.',
  'If the ball never corners, add surface or move right. If it reads too early, reduce surface or move deeper.'
),
(
  'pba-bear-style',
  'Bear Style',
  'PBA-style reference',
  'pba',
  41,
  29.85,
  'Very low ratio',
  5,
  'A low-forgiveness sport pattern that exposes misses quickly.',
  'Use a controlled target window and commit to spare shooting. The goal is repeatable pocket control, not maximum hook.',
  'Minimal built-in hold or recovery; small misses create large result changes.',
  'Use a direct line matched to your ball speed, commonly around 10-14 at the arrows.',
  'Use a direct line matched to your ball speed, commonly around 26-30 at the arrows.',
  'Smooth solid reactive, urethane, or a benchmark ball with surface depending on lane friction.',
  'Make smaller moves than on a house shot. Change ball shape when pocket control disappears.'
),
(
  'pba-wolf-style',
  'Wolf Style',
  'PBA-style reference',
  'pba',
  32,
  27.55,
  'Sport',
  4,
  'A very short pattern with early friction and outside scoring opportunities.',
  'Keep the breakpoint outside and manage early hook. Straighter angles often beat big swing early.',
  'Early read and strong friction response.',
  'Play very outside, often near 3-6 at the arrows with a breakpoint close to the gutter.',
  'Play very outside on the left side, often near 34-37 at the arrows with a breakpoint close to the gutter.',
  'Urethane or smooth low-flare reactive to control overreaction.',
  'If the ball hooks too early, move inside but keep the breakpoint outside. If it misses the headpin, square up or add surface.'
),
(
  'challenge-blended-42',
  'Blended Challenge 42',
  'Training reference',
  'challenge',
  42,
  28.5,
  'Medium ratio',
  3,
  'A bridge pattern between house and sport conditions with some hold in the middle and less free recovery outside.',
  'Use the track area first, then decide whether the outside friction or the middle hold gives the best carry. Miss room exists, but it is narrower than a house shot.',
  'Readable midlane motion with a controlled backend move when the breakpoint is repeated.',
  'Start around 13-16 at the arrows with a breakpoint near 8-11.',
  'Start around 25-28 at the arrows with a breakpoint near 30-33.',
  'Benchmark reactive or smooth hybrid with moderate surface.',
  'Move in small pairs as the track develops. If over/under appears, smooth the ball motion before chasing deeper angles.'
),
(
  'custom-practice-template',
  'Custom Practice Template',
  'User-defined',
  'custom',
  40,
  NULL,
  'Editable reference',
  2,
  'A flexible template pattern for bowlers or centers to model a local lane condition before official graph data is imported.',
  'Use this as a baseline for entering local observations: where the ball skids, where it reads, and which boards create hold or recovery.',
  'Neutral reaction shape intended to be adjusted from bowler notes and observed transition.',
  'Start near 12-15 at the arrows and update the line from practice shots.',
  'Start near 26-29 at the arrows and update the line from practice shots.',
  'Benchmark reactive first, then adjust by lane friction and user notes.',
  'Update the zones, target boards, and ball notes as the center condition is learned.'
)
ON CONFLICT(slug) DO UPDATE SET
  name = excluded.name,
  organization = excluded.organization,
  pattern_type = excluded.pattern_type,
  length_ft = excluded.length_ft,
  volume_ml = excluded.volume_ml,
  ratio = excluded.ratio,
  difficulty = excluded.difficulty,
  summary = excluded.summary,
  play_strategy = excluded.play_strategy,
  ball_motion = excluded.ball_motion,
  suggested_line_right = excluded.suggested_line_right,
  suggested_line_left = excluded.suggested_line_left,
  recommended_equipment = excluded.recommended_equipment,
  common_adjustments = excluded.common_adjustments,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO oil_pattern_tags (oil_pattern_id, tag_id)
SELECT p.id, t.id
FROM oil_patterns p
JOIN pattern_tags t ON t.name IN ('beginner-friendly', 'league', 'medium', 'multiple-angles')
WHERE p.slug = 'typical-house-shot'
ON CONFLICT DO NOTHING;

INSERT INTO oil_pattern_tags (oil_pattern_id, tag_id)
SELECT p.id, t.id
FROM oil_patterns p
JOIN pattern_tags t ON t.name IN ('tournament', 'medium', 'low-forgiveness', 'spare-shooting-important')
WHERE p.slug = 'sport-flat'
ON CONFLICT DO NOTHING;

INSERT INTO oil_pattern_tags (oil_pattern_id, tag_id)
SELECT p.id, t.id
FROM oil_patterns p
JOIN pattern_tags t ON t.name IN ('tournament', 'short', 'outside-line', 'high-friction')
WHERE p.slug IN ('pba-cheetah-style', 'pba-wolf-style')
ON CONFLICT DO NOTHING;

INSERT INTO oil_pattern_tags (oil_pattern_id, tag_id)
SELECT p.id, t.id
FROM oil_patterns p
JOIN pattern_tags t ON t.name IN ('tournament', 'medium', 'multiple-angles')
WHERE p.slug = 'pba-chameleon-style'
ON CONFLICT DO NOTHING;

INSERT INTO oil_pattern_tags (oil_pattern_id, tag_id)
SELECT p.id, t.id
FROM oil_patterns p
JOIN pattern_tags t ON t.name IN ('tournament', 'medium', 'inside-line', 'spare-shooting-important')
WHERE p.slug IN ('pba-scorpion-style', 'pba-bear-style')
ON CONFLICT DO NOTHING;

INSERT INTO oil_pattern_tags (oil_pattern_id, tag_id)
SELECT p.id, t.id
FROM oil_patterns p
JOIN pattern_tags t ON t.name IN ('tournament', 'long', 'inside-line', 'low-forgiveness')
WHERE p.slug = 'pba-shark-style'
ON CONFLICT DO NOTHING;

INSERT INTO oil_pattern_tags (oil_pattern_id, tag_id)
SELECT p.id, t.id
FROM oil_patterns p
JOIN pattern_tags t ON t.name IN ('tournament', 'medium', 'multiple-angles')
WHERE p.slug = 'challenge-blended-42'
ON CONFLICT DO NOTHING;

INSERT INTO oil_pattern_tags (oil_pattern_id, tag_id)
SELECT p.id, t.id
FROM oil_patterns p
JOIN pattern_tags t ON t.name IN ('league', 'medium', 'beginner-friendly')
WHERE p.slug = 'custom-practice-template'
ON CONFLICT DO NOTHING;

DELETE FROM pattern_zones;

INSERT INTO pattern_zones (
  oil_pattern_id,
  board_start,
  board_end,
  distance_start_ft,
  distance_end_ft,
  oil_level,
  note
)
SELECT id, 1, 7, 0, length_ft, 25, 'Outside boards have less oil and provide recovery on missed shots.'
FROM oil_patterns WHERE slug = 'typical-house-shot'
UNION ALL
SELECT id, 8, 15, 0, length_ft, 60, 'Track area has blend between hold and recovery.'
FROM oil_patterns WHERE slug = 'typical-house-shot'
UNION ALL
SELECT id, 16, 25, 0, length_ft, 85, 'Middle boards hold the ball and protect tugged shots.'
FROM oil_patterns WHERE slug = 'typical-house-shot'
UNION ALL
SELECT id, 1, 40, 0, length_ft, 55, 'Oil is more even across the lane, so misses receive little help.'
FROM oil_patterns WHERE slug = 'sport-flat'
UNION ALL
SELECT id, 1, 8, 0, length_ft, 20, 'Early dry boards create fast response to friction.'
FROM oil_patterns WHERE slug IN ('pba-cheetah-style', 'pba-wolf-style')
UNION ALL
SELECT id, 9, 25, 0, length_ft, 60, 'Middle oil encourages controlled launch angles.'
FROM oil_patterns WHERE slug IN ('pba-cheetah-style', 'pba-wolf-style')
UNION ALL
SELECT id, 7, 18, 0, length_ft, 55, 'Blend area can support several angles depending on transition.'
FROM oil_patterns WHERE slug = 'pba-chameleon-style'
UNION ALL
SELECT id, 12, 25, 0, length_ft, 70, 'More hold in the middle, but recovery is less forgiving than a house shot.'
FROM oil_patterns WHERE slug IN ('pba-scorpion-style', 'pba-bear-style')
UNION ALL
SELECT id, 15, 30, 0, length_ft, 80, 'Long oil keeps the ball in skid longer and reduces outside recovery.'
FROM oil_patterns WHERE slug = 'pba-shark-style'
UNION ALL
SELECT id, 1, 8, 0, length_ft, 34, 'Outside boards have some recovery, but less than a house pattern.'
FROM oil_patterns WHERE slug = 'challenge-blended-42'
UNION ALL
SELECT id, 9, 18, 0, length_ft, 58, 'Track zone blends hold and recovery for controlled angles.'
FROM oil_patterns WHERE slug = 'challenge-blended-42'
UNION ALL
SELECT id, 19, 28, 0, length_ft, 72, 'Middle oil provides hold without creating a full house-shot wall.'
FROM oil_patterns WHERE slug = 'challenge-blended-42'
UNION ALL
SELECT id, 1, 10, 0, length_ft, 38, 'Baseline outside friction area for user observation.'
FROM oil_patterns WHERE slug = 'custom-practice-template'
UNION ALL
SELECT id, 11, 25, 0, length_ft, 62, 'Baseline track and middle blend for local practice notes.'
FROM oil_patterns WHERE slug = 'custom-practice-template'
UNION ALL
SELECT id, 26, 40, 0, length_ft, 42, 'Mirrored outside zone for left-handed reads and custom edits.'
FROM oil_patterns WHERE slug = 'custom-practice-template';

DELETE FROM pattern_play_profiles;

INSERT INTO pattern_play_profiles (
  oil_pattern_id,
  rule_of_31_board,
  breakpoint_range,
  ideal_axis_rotation,
  friction_response,
  inside_miss_room,
  outside_miss_room,
  hold_area,
  recovery_area,
  speed_control,
  rev_rate_matchup,
  spare_priority
)
SELECT p.id, d.rule_of_31_board, d.breakpoint_range, d.ideal_axis_rotation, d.friction_response,
  d.inside_miss_room, d.outside_miss_room, d.hold_area, d.recovery_area, d.speed_control,
  d.rev_rate_matchup, d.spare_priority
FROM oil_patterns p
JOIN (
  SELECT 'typical-house-shot' AS slug, 9 AS rule_of_31_board, '7-11 board at the breakpoint' AS breakpoint_range,
    'Moderate axis rotation, enough side roll to use friction without over-skidding.' AS ideal_axis_rotation,
    'Strong recovery outside with hold in the middle; the lane helps blend common misses.' AS friction_response,
    'Good. Shots leaked two to four boards inside can hold pocket if speed is stable.' AS inside_miss_room,
    'Good. Outside misses often recover unless the cover is too clean or speed is too high.' AS outside_miss_room,
    'Middle oil from roughly 15-25 keeps tugged shots from crossing early.' AS hold_area,
    'Dry boards outside 7-8 are the main recovery zone.' AS recovery_area,
    'Keep speed repeatable. Extra speed can create weak corners; slow speed can make the dry jump.' AS speed_control,
    'Lower rev players can use stronger cover. Higher rev players usually need cleaner shape or more inside room.' AS rev_rate_matchup,
    'Normal spare discipline, but avoid hooking at corner pins once the outside track is burned.' AS spare_priority
  UNION ALL SELECT 'sport-flat', 9, '8-11 board, selected by practice shots rather than free recovery',
    'Lower to moderate rotation with forward roll; control beats sideways recovery.',
    'Low recovery and low hold. The lane does not correct direction errors.',
    'Limited. Tugged shots commonly read high or leave splits.',
    'Limited. Pushed shots tend to stay right and miss the pocket.',
    'Narrow hold near the direct target line, not a true house-shot hold area.',
    'Only the natural friction edge; do not count on free hook from the gutter.',
    'Speed must be within a tight window because speed misses change breakpoint quickly.',
    'High rev players should tame shape with surface/urethane. Lower rev players need enough surface to create readable hook.',
    'High priority. Flat patterns punish open frames more than strike-line misses.'
  UNION ALL SELECT 'pba-cheetah-style', 4, '3-6 board, close to the gutter',
    'Moderate rotation with controlled tilt; too much side roll can make the ball jump sideways.',
    'Very fast response to outside friction with early hook risk.',
    'Small. Inside misses can hang if they never touch friction or jump if they hit dry early.',
    'Moderate if breakpoint stays outside; missed projection too far right can still over-read.',
    'Hold is inside the oil line, but it is not wide. Keep launch angles disciplined.',
    'Primary recovery is the outside 1-5 board area.',
    'Avoid slow, grabby shots. Speed down only when the ball will not pick up.',
    'High rev players should control flare and surface. Lower rev players can use smoother reactive to avoid weak corners.',
    'Corner pins matter. Flatten the hand for 10/7 pins because the outside friction is strong.'
  UNION ALL SELECT 'pba-chameleon-style', 8, '7-10 board, can migrate with transition',
    'Versatile. Moderate rotation works, with forward roll when the backend gets sharp.',
    'Balanced friction response; multiple lines can score if the ball shape is matched.',
    'Moderate. Inside misses hold better than short sport patterns, but not like house.',
    'Moderate. Outside recovery exists when the breakpoint is not too deep.',
    'Middle blend lets direct and mild swing players both find pocket control.',
    'Track friction between 7-10 is usually the first useful recovery area.',
    'Use speed to shape. Faster players may need surface; slower players may need cleaner shells.',
    'Matches many rev rates. Adjust launch angle before making large ball changes.',
    'Medium-high priority. It can play scorable, but transition creates washout and bucket leaves.'
  UNION ALL SELECT 'pba-scorpion-style', 11, '9-12 board, with controlled projection',
    'Forward-rolling release with moderate axis rotation; avoid excessive side rotation.',
    'Length creates delayed response. The ball must read the midlane without burning up.',
    'Small to moderate. Tugged shots hold briefly but can drive high late.',
    'Small. Outside misses often lack recovery if they cross the oil edge too late.',
    'Hold sits around the middle-track blend; deeper misses can skate.',
    'Recovery is around the outside of the track, not the gutter.',
    'Keep speed from floating high. Too much speed makes the ball miss the spot downlane.',
    'Higher rev players can open angles once friction develops. Lower rev players need surface early.',
    'High priority because pocket control can leave makeable spares if misses stay small.'
  UNION ALL SELECT 'pba-shark-style', 17, '13-17 board, usually deeper and straighter',
    'Forward roll, lower axis rotation, and controlled tilt to keep the ball from skidding past the breakpoint.',
    'Late response with little outside recovery. Shape must be created through oil, not dry boards.',
    'Moderate hold inside, but shots can sail if the ball never reads.',
    'Low. Outside misses are the danger because long oil delays recovery.',
    'The oil volume inside helps hold, but too much hold becomes flat corners or washouts.',
    'Recovery is deeper than most patterns, often near 12-15 rather than the gutter.',
    'Avoid throwing through the breakpoint. Slight speed reduction or more surface may be needed.',
    'High rev players can blend the pattern from deeper. Lower rev players usually need stronger solid covers.',
    'Very high priority. Long patterns create buckets, washouts, and weak corners when speed/shape misses.'
  UNION ALL SELECT 'pba-bear-style', 9, '8-11 board, narrow and accuracy dependent',
    'Forward roll with minimal shape. Keep the ball stable through the breakpoint.',
    'Low forgiveness. Both hold and recovery are narrow.',
    'Low. Inside misses can check early or leave difficult splits.',
    'Low. Outside misses rarely recover enough without perfect speed and surface.',
    'Small hold zone around the target line; do not assume free hold inside.',
    'Small recovery window just outside target. Bigger swing creates trouble.',
    'Speed repeatability is critical. Half-mile-per-hour misses can change the pocket.',
    'Higher rev players should reduce response. Lower rev players need surface but must avoid early roll-out.',
    'Highest priority. Scores survive through clean frames and simple spare systems.'
  UNION ALL SELECT 'pba-wolf-style', 1, '1-4 board, extremely outside',
    'Forward to moderate rotation; keep the ball from standing up too early.',
    'Immediate friction response and early hook. Overreaction is the main threat.',
    'Small. Tugged shots can hang in oil or jump when they find friction at the wrong angle.',
    'Moderate only if the ball stays outside. Missing the breakpoint right can still hook early.',
    'Hold is very limited because the pattern is short and friction appears early.',
    'Gutter-adjacent boards are the scoring recovery zone.',
    'Do not get slow early. Speed helps keep the ball online through the heads.',
    'High rev players usually need urethane or very smooth weak covers. Lower rev players can use controlled reactive.',
    'High priority. Outside friction makes corner-pin spare shooting sensitive.'
  UNION ALL SELECT 'challenge-blended-42', 11, '9-12 board with controllable recovery',
    'Moderate rotation with a stable roll. Too much side rotation can create over/under as the track opens.',
    'Balanced response. The lane gives some recovery but still requires repeatable projection.',
    'Moderate. Middle hold exists, but tugged shots can still check high once friction develops.',
    'Moderate. Outside misses can recover if they see friction before the end of the pattern.',
    'Boards 18-28 provide usable hold without a full house-shot wall.',
    'Track friction around 7-11 is the first recovery zone.',
    'Keep speed repeatable and make smaller moves than on a house shot.',
    'Lower rev players can start with stronger cover. Higher rev players should smooth response.',
    'Medium-high priority. This pattern is scorable, but opens appear when angle misses grow.'
  UNION ALL SELECT 'custom-practice-template', 9, '8-11 board, update from practice shots',
    'Use a neutral release first, then record how axis rotation changes breakpoint.',
    'User-defined response based on the local center condition and notes.',
    'Unknown until observed. Use the first game to mark whether tugged shots hold.',
    'Unknown until observed. Track whether pushed shots recover or hang.',
    'Baseline middle zone can be edited from user observation.',
    'Baseline outside zone can be edited from user observation.',
    'Record speed misses and whether the ball reads early or skids past the spot.',
    'Use notes to compare lower and higher rev reactions on the same condition.',
    'Normal spare discipline while the custom pattern is being mapped.'
) d ON d.slug = p.slug;

DELETE FROM pattern_transition_phases;

INSERT INTO pattern_transition_phases (
  oil_pattern_id,
  phase_order,
  phase_name,
  frame_window,
  what_to_watch,
  move_strategy,
  ball_change
)
SELECT p.id, d.phase_order, d.phase_name, d.frame_window, d.what_to_watch, d.move_strategy, d.ball_change
FROM oil_patterns p
JOIN (
  SELECT 'typical-house-shot' AS slug, 1 AS phase_order, 'Fresh' AS phase_name, 'Game 1 / early practice' AS frame_window,
    'Ball reads the dry and drives through the pins with miss room both ways.' AS what_to_watch,
    'Start near the track and confirm the outside recovery board.' AS move_strategy,
    'Benchmark reactive is usually enough.' AS ball_change
  UNION ALL SELECT 'typical-house-shot', 2, 'Track opens', 'Middle of set',
    'High flush hits, flat 10s, or shots crossing high as the outside dries.',
    'Move feet and eyes inside together, usually 2-and-1 or 3-and-2.',
    'Stay with the same ball if carry holds; go cleaner if it reads too soon.'
  UNION ALL SELECT 'typical-house-shot', 3, 'Carrydown or cliff', 'Late set',
    'Ball either jumps off dry or skids past carrydown downlane.',
    'Blend the cliff by moving in and reducing launch angle.',
    'Cleaner cover for early hook, stronger surface for skid/weak corners.'
  UNION ALL SELECT 'sport-flat', 1, 'Fresh', 'Practice through Game 1',
    'Pocket hits are tied directly to target and speed quality.',
    'Use a direct line and make very small moves.',
    'Smooth benchmark, urethane, or controlled solid based on friction.'
  UNION ALL SELECT 'sport-flat', 2, 'Subtle track burn', 'Middle of block',
    'Shots that were flush start reading high or leaving flat corners.',
    'Move in small increments and keep the same breakpoint shape.',
    'Change only if the motion window disappears.'
  UNION ALL SELECT 'sport-flat', 3, 'Defined lane shape', 'Late block',
    'A playable shim may appear, but misses are still costly.',
    'Follow the friction gradually; do not chase big swing angles.',
    'Cleaner benchmark if fronts are gone, smoother cover if backend is sharp.'
  UNION ALL SELECT 'pba-cheetah-style', 1, 'Fresh outside', 'Practice / Game 1',
    'Ball reads very early when it touches outside friction.',
    'Keep launch direct and breakpoint near the gutter.',
    'Urethane or smooth reactive controls the first read.'
  UNION ALL SELECT 'pba-cheetah-style', 2, 'Outside burn', 'Middle of set',
    'Ball hooks too early or leaves weak corners after burning energy.',
    'Move in with the feet while keeping breakpoint outside.',
    'Go cleaner or weaker if the ball burns up.'
  UNION ALL SELECT 'pba-cheetah-style', 3, 'Deep friction blend', 'Late set',
    'Players can open the lane, but over/under appears quickly.',
    'Project through the track without sending it past the gutter friction.',
    'Use cleaner angular reactive only when carry requires it.'
  UNION ALL SELECT 'pba-chameleon-style', 1, 'Read options', 'Practice',
    'Several lines may look usable; carry tells which is real.',
    'Compare direct and moderate swing, then commit.',
    'Benchmark reactive first.'
  UNION ALL SELECT 'pba-chameleon-style', 2, 'Best line emerges', 'Game 1-2',
    'One zone starts giving better carry and miss room.',
    'Follow the best friction pair with controlled moves.',
    'Surface change before drastic ball change.'
  UNION ALL SELECT 'pba-chameleon-style', 3, 'Transition choice', 'Late set',
    'Direct players lose hold or swing players lose recovery.',
    'Either move in and shape more, or square up with smoother motion.',
    'Cleaner pearl/hybrid for more angle; solid for control.'
  UNION ALL SELECT 'pba-scorpion-style', 1, 'Fresh length', 'Practice / Game 1',
    'Ball skids farther and may leave weak corners if it misses midlane.',
    'Use surface and keep the launch angle in front of you.',
    'Solid or hybrid with readable midlane.'
  UNION ALL SELECT 'pba-scorpion-style', 2, 'Midlane develops', 'Middle of set',
    'Ball starts reading sooner in the track.',
    'Move in gradually and preserve downlane angle.',
    'Cleaner cover if early roll appears.'
  UNION ALL SELECT 'pba-scorpion-style', 3, 'Backend shape changes', 'Late set',
    'Shots jump from friction or skate through carrydown.',
    'Choose control or angle based on carry, not just pocket hits.',
    'Ball up for carrydown; ball down for early hook.'
  UNION ALL SELECT 'pba-shark-style', 1, 'Fresh long oil', 'Practice / Game 1',
    'Ball delays hook and outside misses do not recover.',
    'Play deeper/direct and make the ball read before the breakpoint.',
    'Strong solid with surface for most bowlers.'
  UNION ALL SELECT 'pba-shark-style', 2, 'Track read appears', 'Middle of set',
    'The ball finally starts picking up in the midlane.',
    'Move with the oil line and keep breakpoint inside the dry.',
    'Stay strong if corners are weak; cleaner only if fronts are gone.'
  UNION ALL SELECT 'pba-shark-style', 3, 'Carrydown vs friction', 'Late set',
    'One shot checks early, the next skids too far.',
    'Reduce shape and control speed; avoid chasing the gutter.',
    'Surface adjustment can be more useful than a large ball change.'
  UNION ALL SELECT 'pba-bear-style', 1, 'Fresh flat', 'Practice / Game 1',
    'Every miss shows immediately. Pocket control is fragile.',
    'Pick a direct line and repeat speed.',
    'Smooth solid, urethane, or benchmark depending on friction.'
  UNION ALL SELECT 'pba-bear-style', 2, 'Tiny friction change', 'Middle of set',
    'Two-board misses produce different leaves.',
    'Make small moves and keep eyes disciplined.',
    'Change to smooth out shape, not to create more hook.'
  UNION ALL SELECT 'pba-bear-style', 3, 'Survival phase', 'Late set',
    'Lane shape may still be narrow while spares decide score.',
    'Play the highest-percentage pocket-control line.',
    'Use whatever gives the simplest spare leaves.'
  UNION ALL SELECT 'pba-wolf-style', 1, 'Fresh short', 'Practice / Game 1',
    'Ball reads immediately outside and can over-hook early.',
    'Play very direct to an outside breakpoint.',
    'Urethane or weak smooth reactive.'
  UNION ALL SELECT 'pba-wolf-style', 2, 'Early burn', 'Middle of set',
    'Shots hook at the arrows or leave weak corners from early roll.',
    'Move in, keep breakpoint outside, and add speed if needed.',
    'Cleaner/weaker cover when urethane burns up.'
  UNION ALL SELECT 'pba-wolf-style', 3, 'Open lane', 'Late set',
    'Inside friction lets some players create more angle.',
    'Open only enough to keep the ball from reading too soon.',
    'Controlled reactive can replace urethane when carry disappears.'
) d ON d.slug = p.slug;

DELETE FROM pattern_equipment_options;

INSERT INTO pattern_equipment_options (
  oil_pattern_id,
  option_order,
  bowler_style,
  ball_type,
  surface,
  when_to_use
)
SELECT p.id, d.option_order, d.bowler_style, d.ball_type, d.surface, d.when_to_use
FROM oil_patterns p
JOIN (
  SELECT 'typical-house-shot' AS slug, 1 AS option_order, 'Tweener / benchmark' AS bowler_style,
    'Symmetric reactive' AS ball_type, '3000-4000 grit or lane shine' AS surface,
    'Best first look when the lane has normal league volume.' AS when_to_use
  UNION ALL SELECT 'typical-house-shot', 2, 'Lower rev / higher speed', 'Stronger solid or hybrid reactive', '2000-3000 grit',
    'Use when the ball misses the breakpoint or leaves weak 10s/7s.'
  UNION ALL SELECT 'typical-house-shot', 3, 'High rev / lower speed', 'Cleaner symmetric or weak pearl', 'Polished or 4000 grit',
    'Use when the outside friction makes the ball jump too early.'
  UNION ALL SELECT 'sport-flat', 1, 'Control player', 'Smooth solid reactive', '2000-3000 grit',
    'Use when you need readable midlane without a sharp backend move.'
  UNION ALL SELECT 'sport-flat', 2, 'High rev player', 'Urethane or low-diff reactive', '1000-3000 grit',
    'Use to keep the pocket in play and reduce sideways miss.'
  UNION ALL SELECT 'sport-flat', 3, 'Lower rev player', 'Benchmark solid reactive', '1000-2000 grit',
    'Use when the ball cannot create enough pocket angle.'
  UNION ALL SELECT 'pba-cheetah-style', 1, 'Control player', 'Urethane', '1000-2000 grit',
    'Use when outside friction is strong and early hook must be controlled.'
  UNION ALL SELECT 'pba-cheetah-style', 2, 'Reactive option', 'Smooth low-flare reactive', '2000-4000 grit',
    'Use if urethane leaves weak corners or cannot continue.'
  UNION ALL SELECT 'pba-cheetah-style', 3, 'Late transition', 'Cleaner pearl reactive', '4000 grit or polish',
    'Use only after the lane opens enough to need more continuation.'
  UNION ALL SELECT 'pba-chameleon-style', 1, 'First read', 'Benchmark symmetric reactive', '3000 grit',
    'Use to identify whether direct or mild swing has better carry.'
  UNION ALL SELECT 'pba-chameleon-style', 2, 'Control shape', 'Solid reactive', '2000 grit',
    'Use when backend is too fast or the pocket is unstable.'
  UNION ALL SELECT 'pba-chameleon-style', 3, 'Angle shape', 'Hybrid or pearl reactive', '4000 grit',
    'Use when fronts go away and you need more downlane recovery.'
  UNION ALL SELECT 'pba-scorpion-style', 1, 'First read', 'Solid reactive', '2000 grit',
    'Use to make the ball see the midlane on fresh medium-long oil.'
  UNION ALL SELECT 'pba-scorpion-style', 2, 'Higher rev player', 'Controlled hybrid reactive', '3000 grit',
    'Use when solid covers read too early but pearl is too sharp.'
  UNION ALL SELECT 'pba-scorpion-style', 3, 'Late block', 'Cleaner reactive', '4000 grit',
    'Use when the fronts are burned and you still need continuation.'
  UNION ALL SELECT 'pba-shark-style', 1, 'Fresh / lower rev', 'Strong solid reactive', '1000-2000 grit',
    'Use to create midlane traction and avoid skidding through the breakpoint.'
  UNION ALL SELECT 'pba-shark-style', 2, 'Higher rev player', 'Strong asym or smooth solid', '2000-3000 grit',
    'Use to blend the long oil without burning up too early.'
  UNION ALL SELECT 'pba-shark-style', 3, 'Transition', 'Cleaner solid or hybrid', '3000-4000 grit',
    'Use when the heads hook but carry still requires a strong shape.'
  UNION ALL SELECT 'pba-bear-style', 1, 'Control player', 'Smooth benchmark solid', '2000-3000 grit',
    'Use when repeatable pocket control is the main goal.'
  UNION ALL SELECT 'pba-bear-style', 2, 'High rev player', 'Urethane or low-response reactive', '1000-3000 grit',
    'Use to reduce backend violence and avoid splits.'
  UNION ALL SELECT 'pba-bear-style', 3, 'Lower rev player', 'Solid reactive with surface', '1000-2000 grit',
    'Use when the ball cannot face up enough at the pocket.'
  UNION ALL SELECT 'pba-wolf-style', 1, 'Fresh short', 'Urethane', '1000-2000 grit',
    'Use to control early friction and keep the ball close to the pocket.'
  UNION ALL SELECT 'pba-wolf-style', 2, 'High speed / low rev', 'Smooth reactive', '2000-3000 grit',
    'Use if urethane does not create enough entry angle.'
  UNION ALL SELECT 'pba-wolf-style', 3, 'Late transition', 'Cleaner weak reactive', '4000 grit or polish',
    'Use after the fronts burn and urethane starts leaving weak corners.'
) d ON d.slug = p.slug;

DELETE FROM pattern_lane_intelligence;

INSERT INTO pattern_lane_intelligence (
  oil_pattern_id,
  oil_shape,
  volume_class,
  friction_expectation,
  scoring_pace,
  target_window_right,
  target_window_left,
  breakpoint_window,
  miss_risk,
  first_move_trigger,
  surface_guidance,
  practice_focus
)
SELECT p.id, d.oil_shape, d.volume_class, d.friction_expectation, d.scoring_pace,
  d.target_window_right, d.target_window_left, d.breakpoint_window, d.miss_risk,
  d.first_move_trigger, d.surface_guidance, d.practice_focus
FROM oil_patterns p
JOIN (
  SELECT 'typical-house-shot' AS slug,
    'Crowned house shape with heavier middle oil and dry outside boards.' AS oil_shape,
    'Medium house volume' AS volume_class,
    'Outside friction should be available early; middle boards should hold most common tug misses.' AS friction_expectation,
    'High scoring if spare shooting stays clean and the ball clears the fronts.' AS scoring_pace,
    'Feet 14-18, eyes 8-11, breakpoint 7-10 as a first look.' AS target_window_right,
    'Feet 22-26, eyes 29-32, breakpoint 31-34 as a first look.' AS target_window_left,
    'Use the dry outside edge first, then migrate in as the track burns.' AS breakpoint_window,
    'Main risk is over/under after transition: jump off dry or skid through carrydown.' AS miss_risk,
    'Move when flush hits become high, flat corners appear, or the ball reads before the arrows.' AS first_move_trigger,
    'Start 3000-4000 grit or lane shine; add surface only when volume beats the cover.' AS surface_guidance,
    'Confirm outside recovery and inside hold with one miss-room test each direction.' AS practice_focus
  UNION ALL SELECT 'sport-flat',
    'Flat, low-ratio oil with very little built-in side-to-side help.',
    'Medium sport volume',
    'Friction is narrow and honest; misses usually continue in the direction they were missed.',
    'Lower scoring pace where clean frames beat chasing maximum hook.',
    'Feet 12-16, eyes 9-13, breakpoint 8-11 depending on rev rate.',
    'Feet 24-28, eyes 27-31, breakpoint 30-33 depending on rev rate.',
    'Keep breakpoint near the selected oil edge; avoid throwing to the gutter for free recovery.',
    'Biggest risk is opening the lane too soon and leaving splits from small misses.',
    'Move only after multiple quality shots show the same high/weak response.',
    'Smooth 2000-3000 grit benchmark or urethane; avoid sharp covers early.',
    'Spend practice finding the safest pocket-control line and spare reaction off the dry.' 
  UNION ALL SELECT 'pba-cheetah-style',
    'Short outside pattern that creates early friction near the gutter.',
    'Short sport volume',
    'Fast response outside; balls with too much backend can stand up early.',
    'High scoring for players who control launch and keep the breakpoint outside.',
    'Feet 6-12, eyes 4-8, breakpoint 3-5.',
    'Feet 28-34, eyes 32-36, breakpoint 36-38.',
    'Breakpoint must stay close to the gutter early; moving it too far inside creates hang.',
    'Main risk is early hook and weak corners from burning energy too soon.',
    'Move when the ball hooks before the breakpoint or drives high from good shots.',
    'Urethane or smooth low-flare reactive at 1000-3000 grit; cleaner only after burn.',
    'Confirm how far right the breakpoint can go before overreaction appears.'
  UNION ALL SELECT 'pba-chameleon-style',
    'Blended medium pattern that can support more than one angle.',
    'Medium sport volume',
    'Friction response is readable but not automatic; carry decides the best zone.',
    'Medium to high scoring once the best line is identified.',
    'Feet 14-18, eyes 11-15, breakpoint 7-10.',
    'Feet 22-26, eyes 25-29, breakpoint 31-34.',
    'Breakpoint can migrate with transition; direct and mild swing may both work.',
    'Main risk is committing to a line that hits pocket but carries poorly.',
    'Move when one side of the pocket starts leaving repeated weak corners or buckets.',
    'Benchmark 3000 grit first; adjust surface before making a drastic ball change.',
    'Compare a direct line and a mild swing line, then choose the one with better carry.'
  UNION ALL SELECT 'pba-scorpion-style',
    'Medium-long pattern with more hold inside and delayed downlane response.',
    'Medium-heavy sport volume',
    'Ball needs to read the midlane; too-clean equipment can skate past the breakpoint.',
    'Medium scoring with premium on entry angle control.',
    'Feet 16-22, eyes 14-18, breakpoint 9-12.',
    'Feet 18-24, eyes 22-26, breakpoint 29-32.',
    'Breakpoint is usually outside the track but not gutter-adjacent.',
    'Main risk is weak corners from skid or high splits when the ball sees friction late.',
    'Move when the ball starts reading the track earlier or repeated flat corners appear.',
    'Solid or controlled hybrid at 2000-3000 grit for a readable midlane.',
    'Use practice to test whether stronger surface creates continuation or roll-out.'
  UNION ALL SELECT 'pba-shark-style',
    'Long oil pattern that pushes breakpoint deeper and limits outside recovery.',
    'Heavy long sport volume',
    'Outside friction is delayed; shots leaked too far right often stay right.',
    'Lower to medium scoring unless the ball matches volume and entry angle.',
    'Feet 22-28, eyes 17-22, breakpoint 13-17.',
    'Feet 12-18, eyes 18-23, breakpoint 24-28.',
    'Keep breakpoint inside the dry edge; long oil usually rewards deeper control.',
    'Main risk is washouts and weak corners from throwing through the breakpoint.',
    'Move or add surface when good shots cannot face up or corners are consistently flat.',
    'Strong solid at 1000-2000 grit early; reduce surface only when fronts disappear.',
    'Confirm the earliest board where the ball reads without burning up.'
  UNION ALL SELECT 'pba-bear-style',
    'Flat sport pattern with narrow hold and narrow recovery.',
    'Medium sport volume',
    'Friction is honest and unforgiving; the lane exposes speed and target misses.',
    'Low scoring pace where spare conversion and simple leaves matter.',
    'Feet 13-17, eyes 10-14, breakpoint 8-11.',
    'Feet 23-27, eyes 26-30, breakpoint 30-33.',
    'Use the highest-percentage direct breakpoint window; avoid unnecessary swing.',
    'Main risk is turning small misses into splits by forcing shape.',
    'Move after repeated high-quality shots show the same miss, not after one bad shot.',
    'Smooth solid, low-response reactive, or urethane at 1000-3000 grit.',
    'Find the line that leaves the easiest spares when the pocket is missed.'
  UNION ALL SELECT 'pba-wolf-style',
    'Very short pattern with immediate outside friction and early hook.',
    'Short sport volume',
    'Friction appears quickly in the front and outside part of the lane.',
    'Medium to high scoring if early hook is controlled.',
    'Feet 4-10, eyes 3-6, breakpoint 1-4.',
    'Feet 30-36, eyes 34-37, breakpoint 37-40.',
    'Breakpoint must stay extremely outside early; shape opens only after transition.',
    'Main risk is hooking at the arrows or leaving weak corners from roll-out.',
    'Move when the ball stands up early or the same good shot starts crossing high.',
    'Urethane or weak smooth reactive at 1000-2000 grit; cleaner covers after burn.',
    'Test launch speed and hand position so the ball does not read before the arrows.'
) d ON d.slug = p.slug;

INSERT OR IGNORE INTO pattern_external_refs (
  oil_pattern_id,
  source_name,
  source_home_url,
  pattern_page_url,
  search_url,
  pdf_url,
  kosi_url,
  reference_note
)
SELECT
  p.id,
  'Kegel Pattern Library',
  'https://patternlibrary.kegel.net/',
  NULL,
  'https://patternlibrary.kegel.net/',
  NULL,
  NULL,
  'Open Kegel Pattern Library to search this pattern name and verify official graph, load, PDF, and KOSI data before tournament or machine use.'
FROM oil_patterns p
;

UPDATE pattern_external_refs
SET
  source_home_url = 'https://patternlibrary.kegel.net/',
  search_url = 'https://patternlibrary.kegel.net/'
WHERE source_name = 'Kegel Pattern Library';

INSERT INTO pattern_external_refs (
  oil_pattern_id,
  source_name,
  source_home_url,
  pattern_page_url,
  search_url,
  pdf_url,
  kosi_url,
  reference_note
)
SELECT
  p.id,
  'BOWL.com USBC/PBA Experience',
  'https://bowl.com/',
  'https://bowl.com/sport-bowling/pba-experience-information%2C-patterns',
  'https://bowl.com/sport-bowling/pba-experience-information%2C-patterns',
  d.pdf_url,
  NULL,
  d.reference_note
FROM oil_patterns p
JOIN (
  SELECT 'pba-bear-style' AS slug,
    'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_Bear41.pdf' AS pdf_url,
    'BOWL.com lists Bear as a 41-foot PBA Experience animal pattern and links the official Kegel PDF with 29.85 mL total oil.' AS reference_note
  UNION ALL SELECT 'pba-chameleon-style',
    'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_Chameleon39.pdf',
    'BOWL.com lists Chameleon as a 39-foot PBA Experience animal pattern and links the official Kegel PDF with 33.5 mL total oil.'
  UNION ALL SELECT 'pba-cheetah-style',
    'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_Cheetah33.pdf',
    'BOWL.com lists Cheetah as a 33-foot PBA Experience animal pattern and links the official Kegel PDF with 27.05 mL total oil.'
  UNION ALL SELECT 'pba-scorpion-style',
    'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_Scorpion42.pdf',
    'BOWL.com lists Scorpion as a 42-foot PBA Experience animal pattern and links the official Kegel PDF with 30.55 mL total oil.'
  UNION ALL SELECT 'pba-shark-style',
    'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_Shark48.pdf',
    'BOWL.com lists Shark as a 48-foot PBA Experience animal pattern and links the official Kegel PDF with 30.0 mL total oil.'
  UNION ALL SELECT 'pba-wolf-style',
    'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_Wolf32.pdf',
    'BOWL.com lists Wolf as a 32-foot PBA Experience animal pattern and links the official Kegel PDF with 27.55 mL total oil.'
) d ON d.slug = p.slug
ON CONFLICT(oil_pattern_id, source_name) DO UPDATE SET
  source_home_url = excluded.source_home_url,
  pattern_page_url = excluded.pattern_page_url,
  search_url = excluded.search_url,
  pdf_url = excluded.pdf_url,
  reference_note = excluded.reference_note;

INSERT INTO source_catalog_status (
  source_name,
  source_home_url,
  official_count,
  imported_count,
  source_note
)
SELECT
  'Kegel Pattern Library',
  'https://patternlibrary.kegel.net/',
  77,
  COUNT(*),
  'Kegel Pattern Library currently shows 77 patterns. StrikeIQ tracks imported patterns locally and keeps a backlog for patterns that still need official detail import.'
FROM oil_patterns
WHERE 1 = 1
ON CONFLICT(source_name) DO UPDATE SET
  source_home_url = excluded.source_home_url,
  official_count = excluded.official_count,
  imported_count = excluded.imported_count,
  source_note = excluded.source_note,
  checked_at = CURRENT_TIMESTAMP;

INSERT INTO source_catalog_status (
  source_name,
  source_home_url,
  official_count,
  imported_count,
  source_note
)
SELECT
  'BOWL.com USBC/PBA Experience',
  'https://bowl.com/sport-bowling/pba-experience-information%2C-patterns',
  29,
  COUNT(*),
  'BOWL.com lists PBA Experience animal, hall-of-fame, and major-event patterns with official PDF links. StrikeIQ imports verified PDFs as local patterns.'
FROM oil_patterns
WHERE EXISTS (
  SELECT 1
  FROM pattern_external_refs r
  WHERE r.oil_pattern_id = oil_patterns.id
    AND r.source_name = 'BOWL.com USBC/PBA Experience'
)
AND 1 = 1
ON CONFLICT(source_name) DO UPDATE SET
  source_home_url = excluded.source_home_url,
  official_count = excluded.official_count,
  imported_count = excluded.imported_count,
  source_note = excluded.source_note,
  checked_at = CURRENT_TIMESTAMP;

INSERT INTO source_catalog_backlog (
  source_name,
  pattern_name,
  pattern_page_url,
  pdf_url,
  kosi_url,
  length_ft,
  volume_ml,
  import_status,
  note
)
VALUES
  ('Kegel Pattern Library', 'Remaining Kegel catalog patterns', 'https://patternlibrary.kegel.net/', NULL, NULL, NULL, NULL, 'not_imported', 'Kegel reports 77 total patterns. StrikeIQ has imported 18 so far; remaining Kegel-only entries need official page/PDF/KOSI capture before becoming local strategy records.'),
  ('BOWL.com USBC/PBA Experience', 'Del Ballard Jr.', 'https://bowl.com/sport-bowling/pba-experience-information%2C-patterns', 'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_DelBallardJr34.pdf', NULL, 34, NULL, 'not_imported', 'Listed by BOWL.com as a 2019 Hall of Fame pattern; PDF details still need import.'),
  ('BOWL.com USBC/PBA Experience', 'Billy Hardwick', 'https://bowl.com/sport-bowling/pba-experience-information%2C-patterns', 'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_BillyHardwick44.pdf', NULL, 44, NULL, 'not_imported', 'Listed by BOWL.com as a 2019 Hall of Fame pattern; PDF details still need import.'),
  ('BOWL.com USBC/PBA Experience', 'Marshall Holman', 'https://bowl.com/sport-bowling/pba-experience-information%2C-patterns', 'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_MarshallHolman41.pdf', NULL, 41, NULL, 'not_imported', 'Listed by BOWL.com as a 2019 Hall of Fame pattern; PDF details still need import.'),
  ('BOWL.com USBC/PBA Experience', 'Chris Paul', 'https://bowl.com/sport-bowling/pba-experience-information%2C-patterns', 'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_ChrisPaul42.pdf', NULL, 42, NULL, 'not_imported', 'Listed by BOWL.com under Majors/Others; PDF details still need import.'),
  ('BOWL.com USBC/PBA Experience', 'PBA World Championship', 'https://bowl.com/sport-bowling/pba-experience-information%2C-patterns', NULL, NULL, NULL, NULL, 'not_imported', 'Listed by BOWL.com under Majors/Others with Kegel, AMF, and Brunswick links.'),
  ('BOWL.com USBC/PBA Experience', '2017 Tournament of Champions', 'https://bowl.com/sport-bowling/pba-experience-information%2C-patterns', NULL, NULL, NULL, NULL, 'not_imported', 'Listed by BOWL.com under Majors/Others with Kegel, AMF, and Brunswick links.'),
  ('BOWL.com USBC/PBA Experience', '2012 U.S. Open', 'https://bowl.com/sport-bowling/pba-experience-information%2C-patterns', NULL, NULL, NULL, NULL, 'not_imported', 'Listed by BOWL.com under Majors/Others with Kegel, AMF, and Brunswick links.')
ON CONFLICT(source_name, pattern_name) DO UPDATE SET
  pattern_page_url = excluded.pattern_page_url,
  pdf_url = excluded.pdf_url,
  kosi_url = excluded.kosi_url,
  length_ft = excluded.length_ft,
  volume_ml = excluded.volume_ml,
  import_status = excluded.import_status,
  note = excluded.note;

INSERT INTO source_catalog_status (
  source_name,
  source_home_url,
  official_count,
  imported_count,
  source_note
)
SELECT
  'PBA.com Official Oil Patterns',
  'https://www.pba.com/player-resources/oil-patterns',
  38,
  COUNT(*),
  'PBA.com publishes current regional, event, legend, animal, and PBA Jr. oil-pattern downloads. StrikeIQ uses this source for current PBA-specific ZIP downloads.'
FROM oil_patterns p
WHERE EXISTS (
  SELECT 1
  FROM pattern_external_refs r
  WHERE r.oil_pattern_id = p.id
    AND r.source_name = 'PBA.com Official Oil Patterns'
)
OR p.slug IN (
  'pba-bear-style',
  'pba-chameleon-style',
  'pba-cheetah-style',
  'pba-dragon-style',
  'pba-scorpion-style',
  'pba-shark-style',
  'pba-viper-style',
  'pba-wolf-style',
  'pba-carmen-salvino-style',
  'pba-dick-weber-style',
  'pba-don-carter-style',
  'pba-don-johnson-style',
  'pba-earl-anthony-style',
  'pba-johnny-petraglia-style',
  'pba-mark-roth-style',
  'pba-mike-aulby-style'
)
ON CONFLICT(source_name) DO UPDATE SET
  source_home_url = excluded.source_home_url,
  official_count = excluded.official_count,
  imported_count = excluded.imported_count,
  source_note = excluded.source_note,
  checked_at = CURRENT_TIMESTAMP;

INSERT INTO source_catalog_status (
  source_name,
  source_home_url,
  official_count,
  imported_count,
  source_note
)
VALUES (
  'Brunswick Pattern Library',
  'https://www.dropbox.com/scl/fo/1wcd61pyhemhpycbfhaac/ALqu1R_WvOpYsTOq8FzIBNY?rlkey=mg2dzh93xz248750bsnsbj9pz&e=1&st=8zgtziwx&dl=0',
  0,
  0,
  'Shared Brunswick Pattern Library Dropbox folder. Download the archive and run scripts/import_pattern_archive.py to queue official pattern files for review.'
)
ON CONFLICT(source_name) DO UPDATE SET
  source_home_url = excluded.source_home_url,
  source_note = excluded.source_note,
  checked_at = CURRENT_TIMESTAMP;

INSERT INTO source_catalog_backlog (
  source_name,
  pattern_name,
  pattern_page_url,
  pdf_url,
  kosi_url,
  length_ft,
  volume_ml,
  import_status,
  note
)
VALUES (
  'Brunswick Pattern Library',
  'Dropbox archive import',
  'https://www.dropbox.com/scl/fo/1wcd61pyhemhpycbfhaac/ALqu1R_WvOpYsTOq8FzIBNY?rlkey=mg2dzh93xz248750bsnsbj9pz&e=1&st=8zgtziwx&dl=0',
  NULL,
  NULL,
  NULL,
  NULL,
  'queued',
  'The shared folder downloads as a large ZIP containing Brunswick Pattern Library folders and machine pattern files. Use scripts/import_pattern_archive.py after the ZIP finishes downloading.'
)
ON CONFLICT(source_name, pattern_name) DO UPDATE SET
  pattern_page_url = excluded.pattern_page_url,
  import_status = excluded.import_status,
  note = excluded.note;

WITH pba_downloads(pattern_name, slug, length_ft, download_url, category) AS (
  VALUES
    ('2026 PBA Regional Oil Pattern - 37', NULL, 37, 'https://www.pba.com/sites/pba/files/2026-02/2026PBARegional-OilPattern-37.zip', 'Regionals'),
    ('2026 PBA Regional Oil Pattern - 40', NULL, 40, 'https://www.pba.com/sites/pba/files/2026-02/2026PBARegional-OilPattern-40.zip', 'Regionals'),
    ('2026 PBA Regional Oil Pattern - 40 V2', NULL, 40, 'https://www.pba.com/sites/pba/files/2026-04/2026PBARegionalOilPattern-40V2.zip', 'Regionals'),
    ('2026 PBA Regional Oil Pattern - 43', NULL, 43, 'https://www.pba.com/sites/pba/files/2026-02/2026PBARegional-OilPattern-43.zip', 'Regionals'),
    ('2026 PBA Regional Oil Pattern - 46', NULL, 46, 'https://www.pba.com/sites/pba/files/2026-02/2026PBARegional-OilPattern-46.zip', 'Regionals'),
    ('2026 PBA Tournament of Champions - PTQ', NULL, NULL, 'https://www.pba.com/sites/pba/files/2026-01/26-TOC-PTQ.zip', 'Misc'),
    ('2026 PBA WSOB PTQ', NULL, NULL, 'https://www.pba.com/sites/pba/files/2026-03/2026-pba-wsob-ptq.zip', 'Misc'),
    ('2026 PBA50 World Championship', NULL, 44, 'https://www.pba.com/sites/pba/files/2026-02/2026-pba50-worldchampionship-44.zip', 'Misc'),
    ('2026 PBA50 WSOB PTQ', NULL, 43, 'https://www.pba.com/sites/pba/files/2026-02/2026-pba-50wsob-ptq-43.zip', 'Misc'),
    ('Amleto Monacelli', NULL, 40, 'https://www.pba.com/sites/pba/files/2026-02/2026-pba-monacelli-40.zip', 'Legend Pattern'),
    ('Billy Hardwick', NULL, 44, 'https://www.pba.com/sites/pba/files/2025-02/2025-pba-hardwick-44.zip', 'Legend Pattern'),
    ('Carmen Salvino', 'pba-carmen-salvino-style', 43, 'https://www.pba.com/sites/pba/files/2026-01/26-pba-salvino-43.zip', 'Legend Pattern'),
    ('Del Ballard', NULL, 36, 'https://www.pba.com/sites/pba/files/2026-03/2026-pba-delballard-36.zip', 'Legend Pattern'),
    ('Dick Weber', 'pba-dick-weber-style', 45, 'https://www.pba.com/sites/pba/files/2026-01/26-pba-weber-45.zip', 'Legend Pattern'),
    ('Don Carter', 'pba-don-carter-style', 39, 'https://www.pba.com/sites/pba/files/2026-05/26-pba-carter-39.zip', 'Legend Pattern'),
    ('Don Johnson', 'pba-don-johnson-style', 40, 'https://www.pba.com/sites/pba/files/2026-01/26-pba-johnson-40.zip', 'Legend Pattern'),
    ('Earl Anthony', 'pba-earl-anthony-style', 42, 'https://www.pba.com/sites/pba/files/2026-03/2026-pba-earlanthony-42.zip', 'Legend Pattern'),
    ('Johnny Petraglia', 'pba-johnny-petraglia-style', 46, 'https://www.pba.com/sites/pba/files/2026-03/2026-pba-johnnypetraglia-46.zip', 'Legend Pattern'),
    ('Mark Roth', 'pba-mark-roth-style', 42, 'https://www.pba.com/sites/pba/files/2026-01/26-pba-roth-42.zip', 'Legend Pattern'),
    ('Marshall Holman', NULL, 38, 'https://www.pba.com/sites/pba/files/2026-01/26-pba-holman-38.zip', 'Legend Pattern'),
    ('Mike Aulby', 'pba-mike-aulby-style', 39, 'https://www.pba.com/sites/pba/files/2026-01/26-pba-aulby-39.zip', 'Legend Pattern'),
    ('Norm Duke', NULL, 39, 'https://www.pba.com/sites/pba/files/2026-03/2026-pba-normduke-39.zip', 'Legend Pattern'),
    ('Wayne Webb', NULL, 37, 'https://www.pba.com/sites/pba/files/2025-02/2025-PBA-WEBB-37.zip', 'Legend Pattern'),
    ('Badger', NULL, 50, 'https://www.pba.com/sites/pba/files/2026-01/26-pba-badger-50.zip', 'Animal Patterns'),
    ('Bat', NULL, 37, 'https://www.pba.com/sites/pba/files/2026-02/2026-pba-bat-37.zip', 'Animal Patterns'),
    ('Bear', 'pba-bear-style', 38, 'https://www.pba.com/sites/pba/files/2026-01/26-pba-bear-38.zip', 'Animal Patterns'),
    ('Chameleon', 'pba-chameleon-style', 39, 'https://www.pba.com/sites/pba/files/2026-03/2026-pba-animal-chameleon-39.zip', 'Animal Patterns'),
    ('Cheetah', 'pba-cheetah-style', 35, 'https://www.pba.com/sites/pba/files/2026-03/2026-pba-animal-cheetah-35.zip', 'Animal Patterns'),
    ('Dragon', 'pba-dragon-style', 47, 'https://www.pba.com/sites/pba/files/2026-01/26-pba-dragon-47.zip', 'Animal Patterns'),
    ('Scorpion', 'pba-scorpion-style', 43, 'https://www.pba.com/sites/pba/files/2026-03/2026-pba-animal-scorpion-43.zip', 'Animal Patterns'),
    ('Shark', 'pba-shark-style', 48, 'https://www.pba.com/sites/pba/files/2026-03/2026-pba-animal-shark-48.zip', 'Animal Patterns'),
    ('Viper', 'pba-viper-style', 37, 'https://www.pba.com/sites/pba/files/2026-01/26-pba-viper-37.zip', 'Animal Patterns'),
    ('Wolf', 'pba-wolf-style', 34, 'https://www.pba.com/sites/pba/files/2025-02/2025-pba-wolf-34.zip', 'Animal Patterns'),
    ('Bill ONeill', NULL, 36, 'https://www.pba.com/sites/pba/files/2026-03/2026-pba-billoneill-36.zip', 'PBA JR'),
    ('Danielle McEwan', NULL, 41, 'https://www.pba.com/sites/pba/files/2026-03/2026-pba-daniellemcewan-41.zip', 'PBA JR'),
    ('EJ Tackett', NULL, 44, 'https://www.pba.com/sites/pba/files/2026-03/2026-pba-ejtackett-44.zip', 'PBA JR'),
    ('Francois Lavoie', NULL, 39, 'https://www.pba.com/sites/pba/files/2026-01/26-pba-lavoie-39.zip', 'PBA JR'),
    ('Verity Crawley', NULL, 46, 'https://www.pba.com/sites/pba/files/2026-01/26-pba-crawley-46.zip', 'PBA JR')
)
INSERT INTO source_catalog_backlog (
  source_name,
  pattern_name,
  pattern_page_url,
  pdf_url,
  kosi_url,
  length_ft,
  volume_ml,
  import_status,
  note
)
SELECT
  'PBA.com Official Oil Patterns',
  d.pattern_name,
  'https://www.pba.com/player-resources/oil-patterns',
  NULL,
  NULL,
  d.length_ft,
  NULL,
  CASE WHEN p.id IS NULL THEN 'not_imported' ELSE 'imported' END,
  d.category || ' download from PBA.com. ZIP: ' || d.download_url
FROM pba_downloads d
LEFT JOIN oil_patterns p ON p.slug = d.slug
ON CONFLICT(source_name, pattern_name) DO UPDATE SET
  pattern_page_url = excluded.pattern_page_url,
  length_ft = excluded.length_ft,
  import_status = excluded.import_status,
  note = excluded.note;

WITH pba_downloads(pattern_name, slug, length_ft, download_url, category) AS (
  VALUES
    ('Carmen Salvino', 'pba-carmen-salvino-style', 43, 'https://www.pba.com/sites/pba/files/2026-01/26-pba-salvino-43.zip', 'Legend Pattern'),
    ('Dick Weber', 'pba-dick-weber-style', 45, 'https://www.pba.com/sites/pba/files/2026-01/26-pba-weber-45.zip', 'Legend Pattern'),
    ('Don Carter', 'pba-don-carter-style', 39, 'https://www.pba.com/sites/pba/files/2026-05/26-pba-carter-39.zip', 'Legend Pattern'),
    ('Don Johnson', 'pba-don-johnson-style', 40, 'https://www.pba.com/sites/pba/files/2026-01/26-pba-johnson-40.zip', 'Legend Pattern'),
    ('Earl Anthony', 'pba-earl-anthony-style', 42, 'https://www.pba.com/sites/pba/files/2026-03/2026-pba-earlanthony-42.zip', 'Legend Pattern'),
    ('Johnny Petraglia', 'pba-johnny-petraglia-style', 46, 'https://www.pba.com/sites/pba/files/2026-03/2026-pba-johnnypetraglia-46.zip', 'Legend Pattern'),
    ('Mark Roth', 'pba-mark-roth-style', 42, 'https://www.pba.com/sites/pba/files/2026-01/26-pba-roth-42.zip', 'Legend Pattern'),
    ('Mike Aulby', 'pba-mike-aulby-style', 39, 'https://www.pba.com/sites/pba/files/2026-01/26-pba-aulby-39.zip', 'Legend Pattern'),
    ('Bear', 'pba-bear-style', 38, 'https://www.pba.com/sites/pba/files/2026-01/26-pba-bear-38.zip', 'Animal Patterns'),
    ('Chameleon', 'pba-chameleon-style', 39, 'https://www.pba.com/sites/pba/files/2026-03/2026-pba-animal-chameleon-39.zip', 'Animal Patterns'),
    ('Cheetah', 'pba-cheetah-style', 35, 'https://www.pba.com/sites/pba/files/2026-03/2026-pba-animal-cheetah-35.zip', 'Animal Patterns'),
    ('Dragon', 'pba-dragon-style', 47, 'https://www.pba.com/sites/pba/files/2026-01/26-pba-dragon-47.zip', 'Animal Patterns'),
    ('Scorpion', 'pba-scorpion-style', 43, 'https://www.pba.com/sites/pba/files/2026-03/2026-pba-animal-scorpion-43.zip', 'Animal Patterns'),
    ('Shark', 'pba-shark-style', 48, 'https://www.pba.com/sites/pba/files/2026-03/2026-pba-animal-shark-48.zip', 'Animal Patterns'),
    ('Viper', 'pba-viper-style', 37, 'https://www.pba.com/sites/pba/files/2026-01/26-pba-viper-37.zip', 'Animal Patterns'),
    ('Wolf', 'pba-wolf-style', 34, 'https://www.pba.com/sites/pba/files/2025-02/2025-pba-wolf-34.zip', 'Animal Patterns')
)
INSERT INTO pattern_external_refs (
  oil_pattern_id,
  source_name,
  source_home_url,
  pattern_page_url,
  search_url,
  pdf_url,
  download_url,
  kosi_url,
  reference_note
)
SELECT
  p.id,
  'PBA.com Official Oil Patterns',
  'https://www.pba.com/',
  'https://www.pba.com/player-resources/oil-patterns',
  'https://www.pba.com/player-resources/oil-patterns',
  NULL,
  d.download_url,
  NULL,
  'PBA.com lists ' || d.pattern_name || ' as a current ' || d.category || ' oil pattern download. Current PBA versions may differ from legacy BOWL.com/Kegel PDF versions.'
FROM pba_downloads d
JOIN oil_patterns p ON p.slug = d.slug
WHERE 1 = 1
ON CONFLICT(oil_pattern_id, source_name) DO UPDATE SET
  source_home_url = excluded.source_home_url,
  pattern_page_url = excluded.pattern_page_url,
  search_url = excluded.search_url,
  download_url = excluded.download_url,
  reference_note = excluded.reference_note;

WITH new_official_patterns (
  slug, name, length_ft, volume_ml, difficulty, pdf_url, pattern_family
) AS (
  VALUES
    ('pba-dragon-style', 'Dragon Style', 45, 31.8, 4, 'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_Dragon45.pdf', 'animal'),
    ('pba-viper-style', 'Viper Style', 36, 29.85, 4, 'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_Viper36.pdf', 'animal'),
    ('pba-earl-anthony-style', 'Earl Anthony Style', 43, 30.2, 4, 'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_EarlAnthony43.pdf', 'hall-of-fame'),
    ('pba-don-carter-style', 'Don Carter Style', 39, 29.35, 4, 'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_DonCarter39.pdf', 'hall-of-fame'),
    ('pba-don-johnson-style', 'Don Johnson Style', 40, 30.7, 4, 'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_DonJohnson40.pdf', 'hall-of-fame'),
    ('pba-johnny-petraglia-style', 'Johnny Petraglia Style', 37, 29.85, 4, 'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_JohnnyPetraglia37.pdf', 'hall-of-fame'),
    ('pba-mark-roth-style', 'Mark Roth Style', 42, 27.9, 4, 'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_MarkRoth42.pdf', 'hall-of-fame'),
    ('pba-carmen-salvino-style', 'Carmen Salvino Style', 44, 29.4, 4, 'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_CarmenSalvino44.pdf', 'hall-of-fame'),
    ('pba-dick-weber-style', 'Dick Weber Style', 45, 26.25, 4, 'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_DickWeber45.pdf', 'hall-of-fame'),
    ('pba-mike-aulby-style', 'Mike Aulby Style', 38, 30.55, 4, 'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_MikeAulby38.pdf', 'hall-of-fame')
)
INSERT INTO oil_patterns (
  slug,
  name,
  organization,
  pattern_type,
  length_ft,
  volume_ml,
  ratio,
  difficulty,
  summary,
  play_strategy,
  ball_motion,
  suggested_line_right,
  suggested_line_left,
  recommended_equipment,
  common_adjustments
)
SELECT
  slug,
  name,
  'BOWL.com PBA Experience reference',
  'pba',
  length_ft,
  volume_ml,
  'Sport',
  difficulty,
  'An official BOWL.com PBA Experience ' || replace(pattern_family, '-', ' ') || ' pattern with verified PDF length and volume.',
  CASE
    WHEN length_ft <= 36 THEN 'Keep launch angles direct and use the outside friction without letting the ball hook too early.'
    WHEN length_ft BETWEEN 37 AND 42 THEN 'Find the best blended target window during practice and keep the ball motion smooth through the breakpoint.'
    ELSE 'Keep the ball in the oil longer, control speed, and avoid giving away the pocket with too much early angle.'
  END,
  CASE
    WHEN length_ft <= 36 THEN 'Earlier read with faster response to friction.'
    WHEN length_ft BETWEEN 37 AND 42 THEN 'Balanced midlane read with controlled downlane motion.'
    ELSE 'Longer skid phase with later, more controlled hook.'
  END,
  CASE
    WHEN length_ft <= 36 THEN 'Start outside, often around 5-9 at the arrows, with a breakpoint near the gutter-side friction.'
    WHEN length_ft BETWEEN 37 AND 42 THEN 'Start near 11-16 at the arrows and adjust based on the strongest blend of hold and recovery.'
    ELSE 'Start deeper or more direct, often around 16-22 at the arrows, keeping the breakpoint inside the dry edge.'
  END,
  CASE
    WHEN length_ft <= 36 THEN 'Start outside from the left side, often around 31-35 at the arrows, with a breakpoint near the gutter-side friction.'
    WHEN length_ft BETWEEN 37 AND 42 THEN 'Start near 24-29 at the arrows and adjust based on the strongest blend of hold and recovery.'
    ELSE 'Start deeper or more direct from the left side, often around 18-24 at the arrows, keeping the breakpoint inside the dry edge.'
  END,
  CASE
    WHEN length_ft <= 36 THEN 'Urethane or smooth low-flare reactive to control early friction.'
    WHEN length_ft BETWEEN 37 AND 42 THEN 'Benchmark reactive or controlled solid with surface matched to lane friction.'
    ELSE 'Stronger solid or hybrid reactive with enough surface to read the midlane.'
  END,
  'Make small moves, watch repeated leaves, and change surface or ball shape only after the same reaction appears on quality shots.'
FROM new_official_patterns
WHERE 1 = 1
ON CONFLICT(slug) DO UPDATE SET
  name = excluded.name,
  organization = excluded.organization,
  pattern_type = excluded.pattern_type,
  length_ft = excluded.length_ft,
  volume_ml = excluded.volume_ml,
  ratio = excluded.ratio,
  difficulty = excluded.difficulty,
  summary = excluded.summary,
  play_strategy = excluded.play_strategy,
  ball_motion = excluded.ball_motion,
  suggested_line_right = excluded.suggested_line_right,
  suggested_line_left = excluded.suggested_line_left,
  recommended_equipment = excluded.recommended_equipment,
  common_adjustments = excluded.common_adjustments,
  updated_at = CURRENT_TIMESTAMP;

WITH new_slugs(slug) AS (
  VALUES
    ('pba-dragon-style'),
    ('pba-viper-style'),
    ('pba-earl-anthony-style'),
    ('pba-don-carter-style'),
    ('pba-don-johnson-style'),
    ('pba-johnny-petraglia-style'),
    ('pba-mark-roth-style'),
    ('pba-carmen-salvino-style'),
    ('pba-dick-weber-style'),
    ('pba-mike-aulby-style')
)
INSERT INTO oil_pattern_tags (oil_pattern_id, tag_id)
SELECT p.id, t.id
FROM oil_patterns p
JOIN new_slugs s ON s.slug = p.slug
JOIN pattern_tags t ON t.name IN (
  'tournament',
  CASE WHEN p.length_ft <= 36 THEN 'short' WHEN p.length_ft >= 43 THEN 'long' ELSE 'medium' END,
  CASE WHEN p.length_ft <= 36 THEN 'outside-line' ELSE 'inside-line' END,
  'spare-shooting-important'
)
ON CONFLICT DO NOTHING;

DELETE FROM pattern_zones
WHERE oil_pattern_id IN (
  SELECT id FROM oil_patterns WHERE slug IN (
    'pba-dragon-style',
    'pba-viper-style',
    'pba-earl-anthony-style',
    'pba-don-carter-style',
    'pba-don-johnson-style',
    'pba-johnny-petraglia-style',
    'pba-mark-roth-style',
    'pba-carmen-salvino-style',
    'pba-dick-weber-style',
    'pba-mike-aulby-style'
  )
);

WITH new_patterns AS (
  SELECT id, slug, length_ft
  FROM oil_patterns
  WHERE slug IN (
    'pba-dragon-style',
    'pba-viper-style',
    'pba-earl-anthony-style',
    'pba-don-carter-style',
    'pba-don-johnson-style',
    'pba-johnny-petraglia-style',
    'pba-mark-roth-style',
    'pba-carmen-salvino-style',
    'pba-dick-weber-style',
    'pba-mike-aulby-style'
  )
)
INSERT INTO pattern_zones (
  oil_pattern_id,
  board_start,
  board_end,
  distance_start_ft,
  distance_end_ft,
  oil_level,
  note
)
SELECT id, 1, 8, 0, length_ft, CASE WHEN length_ft <= 36 THEN 22 ELSE 40 END,
  'Outside zone; short patterns expose this area early, while longer patterns reduce free recovery.'
FROM new_patterns
UNION ALL
SELECT id, 9, 25, 0, length_ft, CASE WHEN length_ft >= 43 THEN 78 ELSE 64 END,
  'Track and middle blend; match ball speed, surface, and launch angle to this zone.'
FROM new_patterns
UNION ALL
SELECT id, 26, 40, 0, length_ft, CASE WHEN length_ft >= 43 THEN 70 ELSE 55 END,
  'Mirror-side oil shape for left-side read and cross-lane visual balance.'
FROM new_patterns;

INSERT OR REPLACE INTO pattern_play_profiles (
  oil_pattern_id,
  rule_of_31_board,
  breakpoint_range,
  ideal_axis_rotation,
  friction_response,
  inside_miss_room,
  outside_miss_room,
  hold_area,
  recovery_area,
  speed_control,
  rev_rate_matchup,
  spare_priority
)
SELECT
  id,
  max(1, min(40, length_ft - 31)),
  'Rule-of-31 estimate near board ' || max(1, min(40, length_ft - 31)) || ', then refine from practice shots.',
  CASE WHEN length_ft <= 36 THEN 'Forward to moderate rotation for early friction control.' ELSE 'Moderate to forward roll to control midlane read and entry angle.' END,
  CASE WHEN length_ft <= 36 THEN 'Fast friction response outside; overreaction is the first risk.' WHEN length_ft >= 43 THEN 'Delayed response; the ball must read before the breakpoint.' ELSE 'Balanced response with a narrow but playable blend.' END,
  'Limited to moderate. Treat inside misses as information, not automatic hold.',
  CASE WHEN length_ft <= 36 THEN 'Useful only if the breakpoint stays outside and speed is stable.' ELSE 'Limited. Outside misses can skate if they cross the oil edge too late.' END,
  'Small hold area around the selected target window.',
  CASE WHEN length_ft <= 36 THEN 'Recovery is closest to the gutter-side friction.' ELSE 'Recovery is closer to the track than the gutter.' END,
  'Repeat speed first; speed misses change breakpoint faster than target moves.',
  'Higher rev players should smooth response. Lower rev players may need stronger surface to create shape.',
  'High priority. Sport conditions reward clean frames and simple spare leaves.'
FROM oil_patterns
WHERE slug IN (
  'pba-dragon-style',
  'pba-viper-style',
  'pba-earl-anthony-style',
  'pba-don-carter-style',
  'pba-don-johnson-style',
  'pba-johnny-petraglia-style',
  'pba-mark-roth-style',
  'pba-carmen-salvino-style',
  'pba-dick-weber-style',
  'pba-mike-aulby-style'
);

DELETE FROM pattern_transition_phases
WHERE oil_pattern_id IN (
  SELECT id FROM oil_patterns WHERE slug IN (
    'pba-dragon-style',
    'pba-viper-style',
    'pba-earl-anthony-style',
    'pba-don-carter-style',
    'pba-don-johnson-style',
    'pba-johnny-petraglia-style',
    'pba-mark-roth-style',
    'pba-carmen-salvino-style',
    'pba-dick-weber-style',
    'pba-mike-aulby-style'
  )
);

WITH new_patterns AS (
  SELECT id, length_ft
  FROM oil_patterns
  WHERE slug IN (
    'pba-dragon-style',
    'pba-viper-style',
    'pba-earl-anthony-style',
    'pba-don-carter-style',
    'pba-don-johnson-style',
    'pba-johnny-petraglia-style',
    'pba-mark-roth-style',
    'pba-carmen-salvino-style',
    'pba-dick-weber-style',
    'pba-mike-aulby-style'
  )
)
INSERT INTO pattern_transition_phases (
  oil_pattern_id,
  phase_order,
  phase_name,
  frame_window,
  what_to_watch,
  move_strategy,
  ball_change
)
SELECT id, 1, 'Fresh read', 'Practice / Game 1',
  'Confirm whether the ball reads early, blends, or skids past the breakpoint.',
  'Start with the official length-based target window and make small moves from repeated shots.',
  CASE WHEN length_ft <= 36 THEN 'Urethane or smooth low-flare reactive.' WHEN length_ft >= 43 THEN 'Stronger solid or hybrid with surface.' ELSE 'Benchmark reactive or controlled solid.' END
FROM new_patterns
UNION ALL
SELECT id, 2, 'Track develops', 'Middle of set',
  'Watch for repeated high hits, weak corners, buckets, or washouts from the same good shot.',
  'Move with the friction while preserving the breakpoint window.',
  'Change surface or cover only when the current shape no longer controls the pocket.'
FROM new_patterns
UNION ALL
SELECT id, 3, 'Late transition', 'Late set',
  'Front-lane friction and carrydown may create over/under.',
  'Choose the line that leaves the easiest spares and protects the pocket.',
  'Cleaner cover if fronts are burned; more surface if the ball skids through the spot.'
FROM new_patterns;

DELETE FROM pattern_equipment_options
WHERE oil_pattern_id IN (
  SELECT id FROM oil_patterns WHERE slug IN (
    'pba-dragon-style',
    'pba-viper-style',
    'pba-earl-anthony-style',
    'pba-don-carter-style',
    'pba-don-johnson-style',
    'pba-johnny-petraglia-style',
    'pba-mark-roth-style',
    'pba-carmen-salvino-style',
    'pba-dick-weber-style',
    'pba-mike-aulby-style'
  )
);

WITH new_patterns AS (
  SELECT id, length_ft
  FROM oil_patterns
  WHERE slug IN (
    'pba-dragon-style',
    'pba-viper-style',
    'pba-earl-anthony-style',
    'pba-don-carter-style',
    'pba-don-johnson-style',
    'pba-johnny-petraglia-style',
    'pba-mark-roth-style',
    'pba-carmen-salvino-style',
    'pba-dick-weber-style',
    'pba-mike-aulby-style'
  )
)
INSERT INTO pattern_equipment_options (
  oil_pattern_id,
  option_order,
  bowler_style,
  ball_type,
  surface,
  when_to_use
)
SELECT id, 1, 'First read',
  CASE WHEN length_ft <= 36 THEN 'Urethane or smooth reactive' WHEN length_ft >= 43 THEN 'Strong solid reactive' ELSE 'Benchmark reactive' END,
  CASE WHEN length_ft <= 36 THEN '1000-3000 grit' WHEN length_ft >= 43 THEN '1000-2000 grit' ELSE '2000-3000 grit' END,
  'Use for the first look at the official pattern before chasing transition.'
FROM new_patterns
UNION ALL
SELECT id, 2, 'Control option', 'Smooth solid or low-response cover', '2000-4000 grit',
  'Use when backend motion is too sharp or pocket control is fragile.'
FROM new_patterns
UNION ALL
SELECT id, 3, 'Transition option', 'Cleaner reactive', '4000 grit or polish',
  'Use when the fronts are gone and the current ball loses continuation.'
FROM new_patterns;

INSERT OR REPLACE INTO pattern_lane_intelligence (
  oil_pattern_id,
  oil_shape,
  volume_class,
  friction_expectation,
  scoring_pace,
  target_window_right,
  target_window_left,
  breakpoint_window,
  miss_risk,
  first_move_trigger,
  surface_guidance,
  practice_focus
)
SELECT
  id,
  CASE WHEN length_ft <= 36 THEN 'Short sport pattern with early outside friction.' WHEN length_ft >= 43 THEN 'Longer sport pattern that pushes breakpoint deeper.' ELSE 'Medium sport pattern with a blended target window.' END,
  printf('Official BOWL.com volume %.2f mL', volume_ml),
  CASE WHEN length_ft <= 36 THEN 'Friction appears early and can make the ball stand up before the breakpoint.' WHEN length_ft >= 43 THEN 'Friction is delayed; the ball must pick up before it reaches the end of the pattern.' ELSE 'Friction is present but narrow; repeat launch angle and speed.' END,
  CASE WHEN length_ft <= 36 THEN 'Can score when early hook is controlled.' WHEN length_ft >= 43 THEN 'Lower to medium scoring unless ball motion matches volume.' ELSE 'Medium scoring with accurate target control.' END,
  CASE WHEN length_ft <= 36 THEN 'Feet 6-12, eyes 4-9, breakpoint near the outside friction.' WHEN length_ft >= 43 THEN 'Feet 18-26, eyes 16-22, breakpoint inside the dry edge.' ELSE 'Feet 13-18, eyes 10-16, breakpoint near the rule-of-31 board.' END,
  CASE WHEN length_ft <= 36 THEN 'Feet 28-34, eyes 31-36, breakpoint near the outside friction.' WHEN length_ft >= 43 THEN 'Feet 14-22, eyes 18-24, breakpoint inside the dry edge.' ELSE 'Feet 22-27, eyes 24-30, breakpoint near the mirrored rule-of-31 board.' END,
  'Start near board ' || max(1, min(40, length_ft - 31)) || ' from the rule of 31, then refine from practice.',
  CASE WHEN length_ft <= 36 THEN 'Main risk is early hook and weak corners from roll-out.' WHEN length_ft >= 43 THEN 'Main risk is washouts or weak corners from skidding through the breakpoint.' ELSE 'Main risk is over-adjusting before the best blend is confirmed.' END,
  'Move after repeated good shots show the same leave or breakpoint change.',
  CASE WHEN length_ft <= 36 THEN 'Control cover and surface first; cleaner pieces come later.' WHEN length_ft >= 43 THEN 'Use enough surface to read the midlane without burning up.' ELSE 'Start benchmark, then tune surface for backend response.' END,
  'Use practice to confirm breakpoint board, spare reaction, and the first move direction.'
FROM oil_patterns
WHERE slug IN (
  'pba-dragon-style',
  'pba-viper-style',
  'pba-earl-anthony-style',
  'pba-don-carter-style',
  'pba-don-johnson-style',
  'pba-johnny-petraglia-style',
  'pba-mark-roth-style',
  'pba-carmen-salvino-style',
  'pba-dick-weber-style',
  'pba-mike-aulby-style'
);

INSERT INTO pattern_external_refs (
  oil_pattern_id,
  source_name,
  source_home_url,
  pattern_page_url,
  search_url,
  pdf_url,
  kosi_url,
  reference_note
)
SELECT
  p.id,
  'Kegel Pattern Library',
  'https://patternlibrary.kegel.net/',
  NULL,
  'https://patternlibrary.kegel.net/',
  NULL,
  NULL,
  'Open Kegel Pattern Library to search this pattern name and verify official graph, load, PDF, and KOSI data before tournament or machine use.'
FROM oil_patterns p
WHERE p.slug IN (
  'pba-dragon-style',
  'pba-viper-style',
  'pba-earl-anthony-style',
  'pba-don-carter-style',
  'pba-don-johnson-style',
  'pba-johnny-petraglia-style',
  'pba-mark-roth-style',
  'pba-carmen-salvino-style',
  'pba-dick-weber-style',
  'pba-mike-aulby-style'
)
ON CONFLICT(oil_pattern_id, source_name) DO NOTHING;

WITH new_official_patterns (
  slug, clean_name, length_ft, volume_ml, pdf_url
) AS (
  VALUES
    ('pba-dragon-style', 'Dragon', 45, 31.8, 'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_Dragon45.pdf'),
    ('pba-viper-style', 'Viper', 36, 29.85, 'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_Viper36.pdf'),
    ('pba-earl-anthony-style', 'Earl Anthony', 43, 30.2, 'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_EarlAnthony43.pdf'),
    ('pba-don-carter-style', 'Don Carter', 39, 29.35, 'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_DonCarter39.pdf'),
    ('pba-don-johnson-style', 'Don Johnson', 40, 30.7, 'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_DonJohnson40.pdf'),
    ('pba-johnny-petraglia-style', 'Johnny Petraglia', 37, 29.85, 'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_JohnnyPetraglia37.pdf'),
    ('pba-mark-roth-style', 'Mark Roth', 42, 27.9, 'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_MarkRoth42.pdf'),
    ('pba-carmen-salvino-style', 'Carmen Salvino', 44, 29.4, 'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_CarmenSalvino44.pdf'),
    ('pba-dick-weber-style', 'Dick Weber', 45, 26.25, 'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_DickWeber45.pdf'),
    ('pba-mike-aulby-style', 'Mike Aulby', 38, 30.55, 'https://images.bowl.com/bowl/media/legacy/internap/bowl/sportbowling/pdfs/Patterns18/KEGEL_MikeAulby38.pdf')
)
INSERT INTO pattern_external_refs (
  oil_pattern_id,
  source_name,
  source_home_url,
  pattern_page_url,
  search_url,
  pdf_url,
  kosi_url,
  reference_note
)
SELECT
  p.id,
  'BOWL.com USBC/PBA Experience',
  'https://bowl.com/',
  'https://bowl.com/sport-bowling/pba-experience-information%2C-patterns',
  'https://bowl.com/sport-bowling/pba-experience-information%2C-patterns',
  d.pdf_url,
  NULL,
  'BOWL.com lists ' || d.clean_name || ' as a ' || d.length_ft || '-foot PBA Experience pattern and links the official Kegel PDF with ' || d.volume_ml || ' mL total oil.'
FROM oil_patterns p
JOIN new_official_patterns d ON d.slug = p.slug
WHERE 1 = 1
ON CONFLICT(oil_pattern_id, source_name) DO UPDATE SET
  source_home_url = excluded.source_home_url,
  pattern_page_url = excluded.pattern_page_url,
  search_url = excluded.search_url,
  pdf_url = excluded.pdf_url,
  reference_note = excluded.reference_note;
