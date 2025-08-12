import { createContext, useContext, useState } from "react";

import { BoardType } from "@/types";

type MatchContextType = {
    board: BoardType | null;
    setBoard: (board: BoardType) => void;
    gameId: number | null;
    setGameId: (id: number | null) => void;
    // Should add more match-related states (turn, players, status)
};

const MatchContext = createContext<MatchContextType | undefined>(undefined);

export function MatchProvider({ children }: { children: React.ReactNode }) {
    const [board, setBoard] = useState<BoardType | null>(null);
    const [gameId, setGameId] = useState<number | null>(null);

    return (
        <MatchContext.Provider value={{ board, setBoard, gameId, setGameId }}>
            {children}
        </MatchContext.Provider>
    );
}

export function useMatch() {
    const context = useContext(MatchContext);
    if (!context) {
        throw new Error("useMatch must be used within a MatchProvider");
    }
    return context;
}