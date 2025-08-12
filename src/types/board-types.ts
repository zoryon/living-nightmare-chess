import { $Enums } from "@/generated/prisma";
import { JsonValue } from "@/generated/prisma/runtime/library";

export type BoardCell = {
  id: number;
  type: $Enums.match_piece_type; // piece type, e.g. "pawn", "queen"
  playerId: number | null;
  usedAbility: number | null;
  captured: number | null;
  status: JsonValue;
}; // Stores PieceInstance.id or null

export type BoardType = (BoardCell | null)[][]; // 8x8 Board