# Chess: Living Nightmares Edition

## Project Overview

This document describes the rules for playing a chess match using the **"Living Nightmares"** army.  
In addition to the standard chess rules, the following **special rules** and **piece abilities** apply.

This repository contains the game rules, and technical details for building the web application.

## Game Rules

### Board
- Size: 8x8 grid, same as classic chess.

## Special General Rules

These rules apply to both players and alter the game flow to make it more chaotic and strategic.

### 1. Dream Energy (DE)

Each player starts the game with **10 Dream Energy (DE) points**.

- **Usage:** Activating a piece’s **Special Active Ability** consumes DE, as specified in its description. If a player does not have enough DE, the ability cannot be used.
- **Recovery:** A player regains Dream Energy in the following ways:
  - **+2 DE** when one of their pieces captures an enemy piece.
  - **+1 DE** if, instead of moving, the player chooses to **"Meditate"**, skipping their movement turn. A player cannot meditate while in check.

### 2. Nightmare Phases

The game is divided into phases triggered by the progression of turns.  
Each phase introduces a new global rule that stacks with the previous ones.

- **Turns 1–4: The Calm Before the Storm**  
  - Only base rules and piece abilities apply.

- **Turns 4–20: Creeping Shadows**  
  - All pieces (except Kings and Pawns) gain an additional movement option: once during this phase, they may move **one square diagonally**, even if this is not part of their standard move. This movement cannot be used to capture.

- **Turns 21–30: Unstable Ground**  
  - At the start of their turn, each player rolls an 8-sided die (or uses an online generator to pick a number from 1 to 8) to determine a **row** (1–8) and a **column** (A–H). The resulting square becomes **"dangerous"** for that turn. Any piece ending its move on that square cannot move on the following turn.

- **Turn 31 and beyond: Total Chaos**  
  - The passive abilities of all pieces are doubled in effect (if possible) or also affect adjacent squares.  
    Example: The King's *"Field of Fear"* now extends **two squares** instead of one.

### 3. Corrupted Promotion

When a **Psychic Larva** (Pawn) reaches the 8th rank, it is not promoted to a standard piece.  
Instead, the player may choose one of the following:

1. **Summon a Nightmare:** Remove the Larva and return a captured *Living Nightmare* piece (Banshee, Hunter, Doppelgänger, or Leaper) to the promotion square.
2. **Infestation:** Remove the Larva and place **two new Psychic Larvae** on any two empty squares of the player's starting row.

---

**Note:** Standard chess notation and rules still apply unless explicitly overridden by these special abilities.

---

## The Pieces: Living Nightmares

| Name | Quantity | Default Movement | Special Active Ability | Cost (DE) | Passive Ability |
|------|----------|------------------|------------------------|-----------|-----------------|
| **Sleepless Eye** *(King)* | 1 | King | **Terrifying Gaze**: Twice per game, target an enemy piece in a straight or diagonal line (no obstacles). That piece must move 1 square away from the Eye if possible. Cannot be used to deliver check. | 2 | **Field of Fear**: Enemy pieces adjacent to the Eye cannot use their active abilities. |
| **Phantom Matriarch** *(Queen)* | 1 | Queen | **Ethereal Passage**: Move ignoring all pieces (friend or foe), landing on an empty square. Cannot capture during this move. | 3 | **Funeral Wail**: When captured, the capturing piece moves only 1 square per turn for its next 2 turns. |
| **Shadow Hunter** *(Rook)* | 2 | Rook | **Shadow Leap**: Once per game, if the other allied Hunter is captured, teleport to its starting square. | 2 | **Camouflage**: If it doesn’t move for an entire turn, it cannot be captured on the opponent’s next turn. |
| **Doppelgänger** *(Bishop)* | 2 | Bishop | **Mimicry**: If adjacent to another piece (friend or foe, excluding the King), copy its *default movement* for that turn. | 2 | **Unstable Form**: After capturing, must immediately move 1 additional legal square if possible. |
| **Phobic Leaper** *(Knight)* | 2 | Knight | **Terror Leap**: Make a long jump in an L-shape of 3×2 squares instead of 2×1. | 3 | **Mind Parasite**: Enemy pieces within attack range have their maximum movement reduced by 1 square. |
| **Psychic Larva** *(Pawn)* | 8 | Pawn | **Psychic Burst**: When capturing, enemy pieces adjacent to the captured piece cannot move next turn. Once per Larva. | 1 | **Mental Echo**: When captured, the captor must declare its next intended move (if it plans to move that piece) at the start of its turn. |

---

### Design Notes
- Use of medieval-fantasy motifs with subtle magical elements.
- Color palettes:
  - Dawnlight: Gold, white, blue accents.
  - Shadow: Purple, crimson, black accents.

## Technical Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript.
- **Backend**: Node.js, Next.js API routes, TypeScript.
- **Realtime Communication**: WebSockets (Socket.IO recommended).
- **Database**: Oracle MySQL with Prisma ORM.
- **Caching / Active Game State**: Redis (only if free forever, otherwise not used).
- **API Type**: REST APIs for core user and match management, WebSocket events for real-time gameplay.
- **Hosting Suggestions**:  
  - Frontend: Vercel  
  - Backend WS server: Fly.io or Railway  
  - DB: Oracle MySQL cloud or equivalent  
  - Redis: Upstash (if chosen)

## License

This project is for personal and educational use. Contact the author for commercial licensing.

---

*Created by Gioele Spata – August 2025*