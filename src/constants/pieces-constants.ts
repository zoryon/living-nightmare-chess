import { PieceImagesType, PieceType } from "@/types";

export const PIECES: Record<string, PieceType> = {
    SLEEPLESS_EYE: {
        name: "Sleepless Eye",
        quantity: 1,
        defaultMovement: "king",
        activeAbility: {
            name: "Terrifying Gaze",
            trigger: "active",
            cost: 2,
            maxUses: 2,
            description: "Force an enemy piece 1 square away (no obstacles, not check)",
            // Note: effect is implemented in engine/abilities.ts; this object is used for UI/metadata only.
            effect: () => {}
        },
        passiveAbility: {
            name: "Field of Fear",
            trigger: "passive",
            description: "Enemy pieces adjacent cannot use active abilities",
            // Enforced in engine/abilities.ts: adjacent enemies cannot activate abilities (radius doubles in Chaos)
            effect: () => {}
        }
    },
    PHANTOM_MATRIARCH: {
        name: "Phantom Matriarch",
        quantity: 1,
        defaultMovement: "queen",
        activeAbility: {
            name: "Ethereal Passage",
            trigger: "active",
            cost: 5,
            maxUses: 1,
            description: "Move on a legal square ignoring all pieces (cannot capture nor check the Sleepless Eye)",
            // Implemented in engine/abilities.ts
            effect: () => {}
        },
        passiveAbility: {
            name: "Funeral Wail",
            trigger: "passive",
                description: "On capture, captor loses 1 Dream Energy at the start of its turn for 3 turns",
            // Implemented via wailDrainRemaining status + per-turn drain in engine/tx-helpers.ts
            effect: () => {}
        }
    },
    SHADOW_HUNTER: {
        name: "Shadow Hunter",
        quantity: 2,
        defaultMovement: "rook",
        activeAbility: {
            name: "Shadow swap",
            trigger: "active",
            cost: 2,
            maxUses: 2,
            description: "Move normally and optionally swap places with one friendly piece along the path. Cannot capture during this move.",
            // Implemented in engine/abilities.ts
            effect: () => {}
        },
        passiveAbility: {
            name: "Camouflage",
            trigger: "passive",
            description: "If the Hunter does not move on its turn, it cannot be captured by Psychic Larvas  on the opponent's next turn.",
            // Implemented in engine/validator.ts: set camouflagedUntilTurn for idle Hunters (larva-only restriction)
            effect: () => {}
        }
    },
    DOPPELGANGER: {
        name: "Doppelgänger",
        quantity: 2,
        defaultMovement: "bishop",
        activeAbility: {
            name: "Mimicry",
            trigger: "active",
            cost: 6,
            maxUses: 1,
            description: "Copy the default movement of an adjacent piece (excluding the King), for one turn",
            // Implemented in engine/abilities.ts
            effect: () => {}
        },
        passiveAbility: {
            name: "Unstable Form",
            trigger: "passive",
            description: "If possible, immediately move 1 additional legal square (can only capture Larvas or Doppelgangers)",
            // Implemented in engine/validator.ts: require an immediate extra step after
            effect: () => {}
        }
    },
    PHOBIC_LEAPER: {
        name: "Phobic Leaper",
        quantity: 2,
        defaultMovement: "knight",
        activeAbility: {
            name: "Terror Leap",
            trigger: "active",
            cost: 3,
            maxUses: 2,
            description: "Make a long jump in an L-shape of 3x2 squares. May capture normally (including the Sleepless Eye), but cannot capture the Phantom Matriarch.",
            // Implemented in engine/abilities.ts
            effect: () => {}
        },
        passiveAbility: {
            name: "Fearful Terrain",
            trigger: "passive",
            description: "Squares the Leaper attacks are 'uneasy'. If a sliding piece starts inside the Leaper's attack range and moves through an uneasy square to exit that range, it must spend 1 Dream Energy to complete the move.",
            // Implemented in engine/validator.ts: sliding movers pay 1 DE when exiting enemy Leaper range through an uneasy square; blocked if insufficient DE
            effect: () => {}
        }
    },
    PSYCHIC_LARVA: {
        name: "Psychic Larva",
        quantity: 8,
        defaultMovement: "pawn",
        activeAbility: {
            name: "Whispering Swarm",
            trigger: "active",
            cost: 2,
            maxUses: 1,
            description: "If one friendly Psychic Larva has been captured by the enemy, you may summon one new Larva on an empty square horizontally adjacent to this piece.",
            // Implemented in engine/abilities.ts and enforced on capture in engine/validator.ts
            effect: () => {}
        },
        passiveAbility: {
            name: "Psychic Gateway",
            trigger: "passive",
            description: "When two Larvas are aligned diagonally with exactly one empty square between them, that square becomes a 'psychic gateway'. Any friendly piece moving into it may immediately move again (can only capture Larvas).",
            // TODO: Implement in engine/validator.ts: detect friendly diagonal Larva pair -> mark middle square; on landing there, allow an optional immediate extra move with the same piece.
            effect: () => {}
        }
    },
};

export const PIECE_IMAGES: PieceImagesType = {
    SLEEPLESS_EYE: {
        white: "/pieces/sleepless-eye/white-sleepless-eye.png",
        black: "/pieces/sleepless-eye/black-sleepless-eye.png",
    },
    PHANTOM_MATRIARCH: {
        white: "/pieces/phantom-matriarch/white-phantom-matriarch.png",
        black: "/pieces/phantom-matriarch/black-phantom-matriarch.png",
    },
    SHADOW_HUNTER: {
        white: "/pieces/shadow-hunter/white-shadow-hunter.png",
        black: "/pieces/shadow-hunter/black-shadow-hunter.png",
    },
    DOPPELGANGER: {
        white: "/pieces/doppelganger/white-doppelganger.png",
        black: "/pieces/doppelganger/black-doppelganger.png",
    },
    PHOBIC_LEAPER: {
        white: "/pieces/phobic-leaper/white-phobic-leaper.png",
        black: "/pieces/phobic-leaper/black-phobic-leaper.png",
    },
    PSYCHIC_LARVA: {
        white: "/pieces/psychic-larva/white-psychic-larva.png",
        black: "/pieces/psychic-larva/black-psychic-larva.png",
    },
};