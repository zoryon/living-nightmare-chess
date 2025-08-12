import { BoardCell, GameState } from "@/types";
import { match_piece } from "@/generated/prisma";

export function convertGameStateToBoard(gameState: match_piece[]): (BoardCell | null)[][] {
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

        const board = convertGameStateToBoard(game.match_piece);
        setBoard(board);
        setGameId(game.id);
    } catch (error) {
        console.error("Error setting up match:", error);
    }
}