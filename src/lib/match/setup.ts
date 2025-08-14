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
    game,
    setMyUserId,
    setMyColor,
}: { 
    setBoard: (board: (BoardCell | null)[][]) => void, 
    setGameId: (id: number | null) => void, 
    game: GameState,
    setMyUserId?: (id: number | null) => void,
    setMyColor?: (color: "white" | "black" | null) => void,
}) {
    try {
        if (!game || !game.match_piece) {
            throw new Error("Invalid game state");
        }

        // Build playerId -> color map from match_player
        const playerColorById: Record<number, "white" | "black"> = {};
        let myUserId: number | null = null;
        let myColor: "white" | "black" | null = null;
        if (Array.isArray(game.match_player)) {
            for (const mp of game.match_player) {
                if (mp.userId != null) {
                    playerColorById[mp.userId] = mp.color === "WHITE" ? "white" : "black";
                    // Heuristic: assume "me" is the non-null userId in this session; precise value set by caller later
                    // Leave as is; callers that know current user can set setMyUserId directly.
                }
            }
        }

        const board = convertGameStateToBoard(game.match_piece, playerColorById);
        setBoard(board);
        setGameId(game.id);

        // Allow caller to set myUserId/myColor if known via token; otherwise try to infer if only one player exists
        if (setMyUserId && setMyColor) {
            // If exactly one player, we cannot know which is me; leave null.
            // Callers will fill from access token.
            setMyUserId(myUserId);
            setMyColor(myColor);
        }
    } catch (error) {
        console.error("Error setting up match:", error);
    }
}