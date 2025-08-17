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
    // Dream Energy per side (server-authoritative)
    whiteDE: number | null;
    blackDE: number | null;
    setWhiteDE: (de: number | null) => void;
    setBlackDE: (de: number | null) => void;
    // Timestamp when clocks were synced (Date.now())
    clocksSyncedAt: number | null;
    setClocksSyncedAt: (ts: number | null) => void;
    // Match end state
    finished: boolean;
    setFinished: (v: boolean) => void;
    winnerId: number | null;
    setWinnerId: (id: number | null) => void;
    finishReason: string | null;
    setFinishReason: (r: string | null) => void;
    // Whether the current match view has been hydrated with server state
    hydrated: boolean;
    setHydrated: (v: boolean) => void;
    // Should add more match-related states (turn, players, status)
    phase: "CALM" | "SHADOWS" | "UNSTABLE" | "CHAOS" | null;
    setPhase: (p: MatchContextType["phase"]) => void;
    nextPhase: { name: "CALM" | "SHADOWS" | "UNSTABLE" | "CHAOS"; inTurns: number } | null;
    setNextPhase: (n: { name: "CALM" | "SHADOWS" | "UNSTABLE" | "CHAOS"; inTurns: number } | null) => void;
    dangerousSquare: { x: number; y: number } | null;
    setDangerousSquare: (d: { x: number; y: number } | null) => void;
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
    const [whiteDE, setWhiteDE] = useState<number | null>(null);
    const [blackDE, setBlackDE] = useState<number | null>(null);
    const [clocksSyncedAt, setClocksSyncedAt] = useState<number | null>(null);
    const [finished, setFinished] = useState<boolean>(false);
    const [winnerId, setWinnerId] = useState<number | null>(null);
    const [finishReason, setFinishReason] = useState<string | null>(null);
    const [hydrated, setHydrated] = useState<boolean>(false);
    const [phase, setPhase] = useState<MatchContextType["phase"]>(null);
    const [nextPhase, setNextPhase] = useState<MatchContextType["nextPhase"]>(null);
    const [dangerousSquare, setDangerousSquare] = useState<MatchContextType["dangerousSquare"]>(null);

    return (
        <MatchContext.Provider value={{ board, setBoard, gameId, setGameId, myUserId, setMyUserId, myColor, setMyColor, currentTurnColor, setCurrentTurnColor, whiteMs, blackMs, setWhiteMs, setBlackMs, whiteDE, blackDE, setWhiteDE, setBlackDE, clocksSyncedAt, setClocksSyncedAt, finished, setFinished, winnerId, setWinnerId, finishReason, setFinishReason, hydrated, setHydrated, phase, setPhase, nextPhase, setNextPhase, dangerousSquare, setDangerousSquare }}>
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