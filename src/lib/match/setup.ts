import { BoardCell, GameState } from "@/types";
import { match_piece } from "@/generated/prisma";

export function convertGameStateToBoard(gameState: match_piece[], playerColorById?: Record<number, "white" | "black">): (BoardCell | null)[][] {
    // Initialize empty 8x8 board
    const board: (BoardCell | null)[][] = Array(8)
        .fill(null)
        .map(() => Array(8).fill(null));

    gameState.forEach(p => {
        if (p.posX !== null && p.posY !== null) {
            board[p.posY][p.posX] = {
                id: p.id,
                type: p.type,
                playerId: p.playerId,
                usedAbility: p.usedAbility,
                captured: p.captured,
                status: p.status,
                color: p.playerId != null ? playerColorById?.[p.playerId] : undefined,
            };
        }
    });

    return board;
}

export function setupMatch({ 
    setBoard, 
    setGameId, 
    game
}: { 
    setBoard: (board: (BoardCell | null)[][]) => void, 
    setGameId: (id: number | null) => void, 
    game: GameState
}) {
    try {
        if (!game || !game.match_piece) {
            throw new Error("Invalid game state");
        }

        // Build playerId -> color map from match_player
        const playerColorById: Record<number, "white" | "black"> = {};
        if (Array.isArray(game.match_player)) {
            for (const mp of game.match_player) {
                if (mp.userId != null) {
                    playerColorById[mp.userId] = mp.color === "WHITE" ? "white" : "black";
                }
            }
        }

        const board = convertGameStateToBoard(game.match_piece, playerColorById);
        setBoard(board);
        setGameId(game.id);
    } catch (error) {
        console.error("Error setting up match:", error);
    }
}