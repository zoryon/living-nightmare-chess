// Exhaustive list of server error codes we surface to the UI.
// Includes a few client-only buckets (e.g., connection_error, move_blocked) for heuristics.
export type MatchErrorCode =
    | "not_your_turn"
    | "piece_not_found"
    | "piece_captured"
    | "piece_offboard"
    | "must_complete_psychic_gateway"
    | "piece_immobilized"
    | "not_your_piece"
    | "mismatch_from"
    | "out_of_bounds"
    | "cannot_capture_ally"
    | "cannot_capture_king"
    | "unstable_capture_restricted_to_larva_or_doppelganger"
    | "gateway_capture_restricted_to_larva"
    | "target_camouflaged"
    | "unstable_must_step_one_square_diagonal"
    | "illegal_move"
    | "echo_declaration_required"
    | "echo_move_mismatch"
    | "fearful_terrain_insufficient_de"
    | "king_in_check"
    | "must_complete_unstable_form"
    // Promotion API
    | "not_larva"
    | "no_promotion_pending"
    | "invalid_summon_type"
    | "need_three_positions"
    | "must_be_on_start_row"
    | "square_occupied"
    // Match/game level
    | "time_forfeit"
    | "match_already_finished"
    | "not_eligible"
    // Abilities framework and handlers
    | "abilities_disabled_in_calm"
    | "ability_blocked_by_field_of_fear"
    | "insufficient_de"
    | "unknown_ability"
    | "wrong_piece_type"
    | "missing_target"
    | "target_not_found"
    | "no_piece_at_target"
    | "invalid_target"
    | "target_captured"
    | "target_is_ally"
    | "not_adjacent"
    | "movement_unknown"
    | "illegal_destination"
    | "must_land_on_empty"
    | "blocked_by_enemy"
    | "cannot_capture_during_swap"
    | "must_be_horizontally_adjacent"
    | "no_captured_larva_available"
    | "cannot_copy_king"
    | "cannot_capture_sleepless_or_matriarch_with_terror_leap"
    // Client-only buckets
    | "ability_failed"
    | "connection_error"
    | "piece_not_owned"
    | "target_invalid"
    | "move_blocked"
    | "match_not_found"
    | "unknown";

const KNOWN_CODES = new Set<MatchErrorCode>([
    "not_your_turn",
    "piece_not_found",
    "piece_captured",
    "piece_offboard",
    "must_complete_psychic_gateway",
    "piece_immobilized",
    "not_your_piece",
    "mismatch_from",
    "out_of_bounds",
    "cannot_capture_ally",
    "cannot_capture_king",
    "unstable_capture_restricted_to_larva_or_doppelganger",
    "gateway_capture_restricted_to_larva",
    "target_camouflaged",
    "unstable_must_step_one_square_diagonal",
    "illegal_move",
    "echo_declaration_required",
    "echo_move_mismatch",
    "fearful_terrain_insufficient_de",
    "king_in_check",
    "must_complete_unstable_form",
    "not_larva",
    "no_promotion_pending",
    "invalid_summon_type",
    "need_three_positions",
    "must_be_on_start_row",
    "square_occupied",
    "time_forfeit",
    "match_already_finished",
    "not_eligible",
    "abilities_disabled_in_calm",
    "ability_blocked_by_field_of_fear",
    "insufficient_de",
    "unknown_ability",
    "wrong_piece_type",
    "missing_target",
    "target_not_found",
    "no_piece_at_target",
    "invalid_target",
    "target_captured",
    "target_is_ally",
    "not_adjacent",
    "movement_unknown",
    "illegal_destination",
    "must_land_on_empty",
    "blocked_by_enemy",
    "cannot_capture_during_swap",
    "must_be_horizontally_adjacent",
    "no_captured_larva_available",
    "cannot_copy_king",
    "cannot_capture_sleepless_or_matriarch_with_terror_leap",
    // client buckets
    "ability_failed",
    "connection_error",
    "piece_not_owned",
    "target_invalid",
    "move_blocked",
    "match_not_found",
    "unknown",
]);

export function parseMatchError(raw?: string | null | undefined): MatchErrorCode {
    const s = (raw || "").toString().trim().toLowerCase();
    // Exact code from server
    if (KNOWN_CODES.has(s as MatchErrorCode)) return s as MatchErrorCode;
    // Try to find a known code contained within (defensive)
    for (const code of KNOWN_CODES) {
        if (!code || code === "unknown") continue;
        if (s.includes(code)) return code;
    }
    // Heuristics for free-form errors
    if (s.includes("not your turn")) return "not_your_turn";
    if (s.includes("illegal") || s.includes("invalid move")) return "illegal_move";
    if (s.includes("ability")) return "ability_failed";
    if (s.includes("not owner") || s.includes("not your piece")) return "piece_not_owned";
    if (s.includes("not found") && s.includes("piece")) return "piece_not_found";
    if (s.includes("invalid target") || s.includes("target")) return "target_invalid";
    if (s.includes("blocked") || s.includes("path")) return "move_blocked";
    if (s.includes("match not found")) return "match_not_found";
    if (s.includes("network") || s.includes("socket") || s.includes("connection")) return "connection_error";
    return "unknown";
}

export function getFriendlyError(code: MatchErrorCode): { title: string; description?: string; level: "warning" | "error" } {
    switch (code) {
        case "not_your_turn":
            return { title: "Not your turn", description: "Wait for your opponent to move, then try again.", level: "warning" };
        case "piece_not_found":
        case "piece_captured":
            return { title: "Piece missing", description: "That piece is no longer available on the board.", level: "error" };
        case "piece_offboard":
            return { title: "Piece off the board", description: "That action can’t be performed; the piece isn’t on the board.", level: "error" };
        case "must_complete_psychic_gateway":
            return { title: "Complete Psychic Gateway", description: "You must move the same piece again to finish the gateway follow‑up.", level: "warning" };
        case "piece_immobilized":
            return { title: "Immobilized", description: "This piece is immobilized for this turn and cannot move.", level: "warning" };
        case "not_your_piece":
        case "piece_not_owned":
            return { title: "Not your piece", description: "You can only act with your own pieces.", level: "error" };
        case "mismatch_from":
            return { title: "Position mismatch", description: "The piece moved from a different square than expected. Try selecting it again.", level: "warning" };
        case "out_of_bounds":
            return { title: "Out of bounds", description: "That square is outside the board.", level: "warning" };
        case "cannot_capture_ally":
            return { title: "Can’t capture ally", description: "Choose an empty square or an enemy piece.", level: "warning" };
        case "cannot_capture_king":
            return { title: "King cannot be captured", description: "The enemy Sleepless Eye cannot be captured in this scenario.", level: "warning" };
        case "unstable_capture_restricted_to_larva_or_doppelganger":
            return { title: "Unstable capture restricted", description: "During the Unstable step you can only capture a Larva or a Doppelgänger.", level: "warning" };
        case "gateway_capture_restricted_to_larva":
            return { title: "Gateway restriction", description: "During the Gateway follow‑up you can only capture a Psychic Larva.", level: "warning" };
        case "target_camouflaged":
            return { title: "Camouflaged", description: "That Shadow Hunter is camouflaged and can’t be targeted by a Larva right now.", level: "warning" };
        case "unstable_must_step_one_square_diagonal":
            return { title: "Unstable step required", description: "The forced Unstable step must be exactly one diagonal square.", level: "warning" };
        case "illegal_move":
            return { title: "Illegal move", description: "That move isn’t legal from the selected square. Pick a highlighted square or select another piece.", level: "warning" };
        case "echo_declaration_required":
            return { title: "Echo not declared", description: "You must declare the Echo move before playing it this turn.", level: "warning" };
        case "echo_move_mismatch":
            return { title: "Echo mismatch", description: "Your move doesn’t match the Echo declaration for this turn.", level: "warning" };
        case "fearful_terrain_insufficient_de":
            return { title: "Need more Dream Energy", description: "Crossing uneasy ground costs 1 Dream Energy and you don’t have enough.", level: "warning" };
        case "king_in_check":
            return { title: "King safety", description: "This action would leave your king in check.", level: "warning" };
        case "must_complete_unstable_form":
            return { title: "Complete Unstable Form", description: "Finish the forced Unstable step with the same Doppelgänger first.", level: "warning" };
        case "not_larva":
            return { title: "Promotion requires a Larva", description: "Only a Psychic Larva can be promoted.", level: "warning" };
        case "no_promotion_pending":
            return { title: "No promotion pending", description: "This Larva isn’t ready to promote yet.", level: "warning" };
        case "invalid_summon_type":
            return { title: "Invalid summon", description: "Choose a valid piece type to summon.", level: "warning" };
        case "need_three_positions":
            return { title: "Three positions required", description: "Pick exactly three empty squares on your starting row.", level: "warning" };
        case "must_be_on_start_row":
            return { title: "Must be on starting row", description: "All chosen squares must be on your starting row.", level: "warning" };
        case "square_occupied":
            return { title: "Square occupied", description: "Choose an empty square.", level: "warning" };
        case "time_forfeit":
            return { title: "Time forfeited", description: "A clock ran out. The game is over.", level: "error" };
        case "match_already_finished":
            return { title: "Match already finished", description: "This game has concluded.", level: "error" };
        case "not_eligible":
            return { title: "Not eligible", description: "You can’t perform this action in the current state.", level: "error" };
        case "abilities_disabled_in_calm":
            return { title: "Abilities disabled", description: "Active abilities are disabled during the Calm phase.", level: "warning" };
        case "ability_blocked_by_field_of_fear":
            return { title: "Blocked by Field of Fear", description: "An enemy Phobic Leaper’s aura prevents this ability.", level: "warning" };
        case "insufficient_de":
            return { title: "Need more Dream Energy", description: "You don’t have enough Dream Energy to use this ability.", level: "warning" };
        case "unknown_ability":
            return { title: "Unknown ability", description: "This ability isn’t available.", level: "error" };
        case "wrong_piece_type":
            return { title: "Wrong piece", description: "That ability can’t be used by this piece.", level: "warning" };
        case "missing_target":
        case "target_not_found":
        case "no_piece_at_target":
        case "invalid_target":
            return { title: "Invalid target", description: "Select a valid target square or piece for this ability.", level: "warning" };
        case "target_captured":
            return { title: "Target captured", description: "The selected target is no longer on the board.", level: "warning" };
        case "target_is_ally":
            return { title: "Ally target", description: "This ability can only target enemies.", level: "warning" };
        case "not_adjacent":
            return { title: "Not adjacent", description: "Select a piece in an adjacent square.", level: "warning" };
        case "movement_unknown":
            return { title: "Cannot mimic movement", description: "That piece’s movement can’t be copied.", level: "warning" };
        case "illegal_destination":
            return { title: "Illegal destination", description: "You can’t end this ability on that square.", level: "warning" };
        case "must_land_on_empty":
            return { title: "Destination must be empty", description: "Pick an empty square.", level: "warning" };
        case "blocked_by_enemy":
            return { title: "Path blocked by enemy", description: "You can’t pass through an enemy piece.", level: "warning" };
        case "cannot_capture_during_swap":
            return { title: "Cannot capture during swap", description: "Shadow swap can’t capture enemy pieces.", level: "warning" };
        case "must_be_horizontally_adjacent":
            return { title: "Must be horizontally adjacent", description: "Choose a left or right adjacent empty square.", level: "warning" };
        case "no_captured_larva_available":
            return { title: "No Larva to resurrect", description: "You have no captured Larva to summon.", level: "warning" };
        case "cannot_copy_king":
            return { title: "Cannot copy the king", description: "Mimicry can’t copy the Sleepless Eye.", level: "warning" };
        case "cannot_capture_sleepless_or_matriarch_with_terror_leap":
            return { title: "Capture not allowed", description: "Terror Leap can’t capture the Sleepless Eye or Phantom Matriarch.", level: "warning" };
        case "ability_failed":
            return { title: "Ability unavailable", description: "You can’t use this ability in the current state or on that target.", level: "warning" };
        case "match_not_found":
            return { title: "Match not found", description: "This game is no longer active. Return to home to find a new match.", level: "error" };
        case "connection_error":
            return { title: "Connection issue", description: "We couldn’t reach the server. Please check your network and retry.", level: "error" };
        case "move_blocked":
            return { title: "Path blocked", description: "A piece is blocking the path to that square. Try a different route or move another piece first.", level: "warning" };
        default:
            return { title: "Action failed", description: "That didn’t work. Try a different move or wait for the next turn.", level: "error" };
    }
}
