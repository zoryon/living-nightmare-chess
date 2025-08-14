import { $Enums } from "@/generated/prisma";
import { JsonValue } from "@/generated/prisma/runtime/library";

export type MatchState =
  | { status: "idle" }
  | { status: "searching" }
  | { status: "starting"; gameId: number }
  | { status: "resumed"; gameId: number }
  | { status: "error"; message: string };

export type GameState = ({
  match_piece: {
    id: number;
    status: JsonValue;
    matchId: number;
    playerId: number | null;
    type: $Enums.match_piece_type;
    posX: number | null;
    posY: number | null;
    usedAbility: number | null;
    captured: number | null;
  }[];
  match_player: {
    userId: number | null;
    id: number;
    matchId: number;
    color: $Enums.match_player_color;
    dreamEnergy: number;
  }[];
} & {
  id: number;
  createdAt: Date | null;
  status: $Enums.match_status;
  winnerId: number | null;
  turn: number;
}) | null

export type MatchPiece = {
  id: number;
  playerId: number | null;
  type: string; // Cambiato da pieceType per coerenza con il backend
  status?: Record<string, any> | null;
};

export type Match = {
  id: number;
  turn: number;
  status: string;
  match_player: Array<{ id: number; userId: number | null; color: "WHITE" | "BLACK" }>;
  pieces: MatchPiece[]; // Cambiato da match_piece per coerenza con il context
  [k: string]: any;
};
