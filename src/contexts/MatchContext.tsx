import { createContext, useContext, useState } from "react";

import { BoardType } from "@/types";

type PlayerColor = "white" | "black";

type MatchContextType = {
    board: BoardType | null;
    setBoard: (board: BoardType) => void;
    gameId: number | null;
    setGameId: (id: number | null) => void;
    myUserId: number | null;
    setMyUserId: (id: number | null) => void;
    myColor: PlayerColor | null;
    setMyColor: (color: PlayerColor | null) => void;
    currentTurnColor: PlayerColor | null;
    setCurrentTurnColor: (color: PlayerColor | null) => void;
    // Clocks in milliseconds as last received from server
    whiteMs: number | null;
    blackMs: number | null;
    setWhiteMs: (ms: number | null) => void;
    setBlackMs: (ms: number | null) => void;
    // Timestamp when clocks were synced (Date.now())
    clocksSyncedAt: number | null;
    setClocksSyncedAt: (ts: number | null) => void;
    // Should add more match-related states (turn, players, status)
};

const MatchContext = createContext<MatchContextType | undefined>(undefined);

export function MatchProvider({ children }: { children: React.ReactNode }) {
    const [board, setBoard] = useState<BoardType | null>(null);
    const [gameId, setGameId] = useState<number | null>(null);
    const [myUserId, setMyUserId] = useState<number | null>(null);
    const [myColor, setMyColor] = useState<PlayerColor | null>(null);
    const [currentTurnColor, setCurrentTurnColor] = useState<PlayerColor | null>(null);
    const [whiteMs, setWhiteMs] = useState<number | null>(null);
    const [blackMs, setBlackMs] = useState<number | null>(null);
    const [clocksSyncedAt, setClocksSyncedAt] = useState<number | null>(null);

    return (
        <MatchContext.Provider value={{ board, setBoard, gameId, setGameId, myUserId, setMyUserId, myColor, setMyColor, currentTurnColor, setCurrentTurnColor, whiteMs, blackMs, setWhiteMs, setBlackMs, clocksSyncedAt, setClocksSyncedAt }}>
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