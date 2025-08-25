"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import Status from "@/components/Status";
import { useChallenges } from "@/contexts/ChallengesContext";

type Props = {
    status: string;
    message?: string | null;
    queuePlayersNum: number;
    onFindMatch: () => void;
    onCancelSearch: () => void;
    disableFindMatch?: boolean;
};

const PlayCard = ({
    status,
    message,
    queuePlayersNum,
    onFindMatch,
    onCancelSearch,
    disableFindMatch
}: Props) => {
    const { outgoing } = useChallenges();

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
                        <Button
                            size="default"
                            onClick={onFindMatch}
                            disabled={!!disableFindMatch || Object.keys(outgoing).length > 0}
                            variant={(disableFindMatch || Object.keys(outgoing).length > 0) ? "secondary" : "default"}
                            className={(disableFindMatch || Object.keys(outgoing).length > 0) ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
                            title={disableFindMatch ? "Resume your ongoing match or clear it to find a new one" : (Object.keys(outgoing).length > 0 ? "Cancel your pending friend invite to queue" : undefined)}
                        >
                            Find Match
                        </Button>
                    )}
                </div>
            </div>

            <Link href="/friends" className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto]">
                <Button disabled variant={"secondary"} className="cursor-pointer">
                    Play with a friend
                </Button>
            </Link>

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
