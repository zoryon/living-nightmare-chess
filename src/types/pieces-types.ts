import { PIECES } from "@/constants";

export type Ability = {
  name: string;
  trigger: "active" | "passive";
  cost?: number;          // Dream Energy cost if active
  maxUses?: number;       // Only for active abilities
  description: string;    // Tooltip or UI
  effect: (ctx: any) => void; // Logic (game context passed in)
};

export type PieceType = {
  name: string;
  quantity: number;
  defaultMovement: "king" | "queen" | "rook" | "bishop" | "knight" | "pawn" | "custom";
  activeAbility?: Ability;
  passiveAbility?: Ability;
};

export type PieceInstance = {
  id: string;
  type: keyof typeof PIECES; // Reference to pieceTypes
  color: Color;
  position: { row: number; col: number };
  abilityUses?: Record<string, number>; // Tracks per ability
  status?: Record<string, any>; // e.g., { immobilizedTurns: 1 }
};

export type Color = "white" | "black";

export type PieceImagesType = Record<
  string,
  { white: string; black: string }
>;