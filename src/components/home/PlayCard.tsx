"use client";

import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import Status from "@/components/Status";

type Props = {
    status: string;
    message?: string | null;
    queuePlayersNum: number;
    matchId: string;
    setMatchId: (v: string) => void;
    onFindMatch: () => void;
    onCancelSearch: () => void;
    onJoinById: (e?: FormEvent) => void;
};

const PlayCard = ({
    status,
    message,
    queuePlayersNum,
    matchId,
    setMatchId,
    onFindMatch,
    onCancelSearch,
    onJoinById,
}: Props) => {
    const canJoin = matchId.trim().length > 0;

    return (
        <div className="rounded-3xl border bg-card/80 p-6 sm:p-7 shadow-sm ring-1 ring-border/50">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold">Play now</h2>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                            <Status state={status} />
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Find an opponent or join a friend by ID.</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                        <span className="text-green-500">{queuePlayersNum}</span> player{queuePlayersNum === 1 ? "" : "s"} currently in queue
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {status === "searching" ? (
                        <>
                            <Button size="default" disabled className="cursor-wait">
                                <span className="inline-flex items-center gap-2">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                                    Searching…
                                </span>
                            </Button>
                            <Button variant="secondary" onClick={onCancelSearch} className="cursor-pointer">
                                Cancel
                            </Button>
                        </>
                    ) : (
                        <Button size="default" onClick={onFindMatch} className="cursor-pointer">
                            Find Match
                        </Button>
                    )}
                </div>
            </div>

            <form onSubmit={onJoinById} className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                    value={matchId}
                    onChange={(e) => setMatchId(e.target.value)}
                    placeholder="Enter match ID to join friend"
                    className="h-12 w-full rounded-md border bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <Button type="submit" disabled={!canJoin} variant={canJoin ? "default" : "secondary"}>
                    Join by ID
                </Button>
            </form>

            <div className="mt-4 space-y-2">
                {status === "error" && message && (
                    <p className="text-sm text-red-500" role="alert">
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
};

export default PlayCard;
