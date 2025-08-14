import { PieceImagesType, PieceType } from "@/types";

export const PIECES: Record<string, PieceType> = {
    SLEEPLESS_EYE: {
        name: 'Sleepless Eye',
        quantity: 1,
        defaultMovement: "king",
        activeAbility: {
            name: "Terrifying Gaze",
            trigger: "active",
            cost: 2,
            maxUses: 2,
            description: "Force an enemy piece 1 square away (no obstacles, not check)",
            effect: (ctx) => { /* logic */ }
        },
        passiveAbility: {
            name: "Field of Fear",
            trigger: "passive",
            description: "Enemy pieces adjacent cannot use active abilities",
            effect: (ctx) => { /* logic */ }
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
            maxUses: 2,
            description: "Move on a legal square ignoring all pieces (cannot capture nor check the Sleepless Eye)",
            effect: (ctx) => { /* logic */ }
        },
        passiveAbility: {
            name: "Funeral Wail",
            trigger: "passive",
            description: "On capture, captor can move only 1 square for 2 turns",
            effect: (ctx) => { /* logic */ }
        }
    },
    SHADOW_HUNTER: {
        name: "Shadow Hunter",
        quantity: 2,
        defaultMovement: "rook",
        activeAbility: {
            name: "Shadow Bind",
            trigger: "active",
            cost: 3,
            maxUses: 1,
            description: "Targets an enemy piece on an adjacent diagonal square. That piece cannot move on the opponent's next turn.",
            effect: (ctx) => { /* logic */ }
        },
        passiveAbility: {
            name: "Camouflage",
            trigger: "passive",
            description: "If not moved, it cannot be captured on the opponent's next turn",
            effect: (ctx) => { /* logic */ }
        }
    },
    DOPPELGANGER: {
        name: "Doppelgänger",
        quantity: 2,
        defaultMovement: "bishop",
        activeAbility: {
            name: "Mimicry",
            trigger: "active",
            cost: 2,
            maxUses: 4,
            description: "Copy the default movement of an adjacent piece (excluding the King), for one turn",
            effect: (ctx) => { /* logic */ }
        },
        passiveAbility: {
            name: "Unstable Form",
            trigger: "passive",
            description: "After capturing, must immediately move 1 additional legal square if possible",
            effect: (ctx) => { /* logic */ }
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
            maxUses: 4,
            description: "Make a long jump in an L-shape of 3x2 squares",
            effect: (ctx) => { /* logic */ }
        },
        passiveAbility: {
            name: "Mind Parasite",
            trigger: "passive",
            description: "Enemy pieces within attack range have their maximum movement reduced by 1 square",
            effect: (ctx) => { /* logic */ }
        }
    },
    PSYCHIC_LARVA: {
        name: "Psychic Larva",
        quantity: 8,
        defaultMovement: "pawn",
        activeAbility: {
            name: "Psychic Burst",
            trigger: "active",
            cost: 1,
            maxUses: 1,
            description: "When capturing, enemy pieces adjacent to the captured piece cannot move next turn",
            effect: (ctx) => { /* logic */ }
        },
        passiveAbility: {
            name: "Mental Echo",
            trigger: "passive",
            description: "When captured, the captor must declare its next intended move (if it plans to move that piece) at the start of its turn.",
            effect: (ctx) => { /* logic */ }
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