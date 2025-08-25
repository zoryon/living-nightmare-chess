"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useChallenges } from "@/contexts/ChallengesContext";

type Props = { friendId: number };

export function ChallengeButtons({ friendId }: Props) {
    const { outgoing, incoming, challenge, cancel, accept, refetch } = useChallenges();

    useEffect(() => {
        // On first mount of the buttons, refetch to reflect current DB state
        refetch();
    }, [refetch]);
    const pendingId = outgoing[friendId] ?? null;
    const incomingId = incoming[friendId] ?? null;

    return (
        <div className="flex gap-2">
            {incomingId ? (
                <>
                    <Button size="sm" onClick={() => accept(friendId)}>Accept</Button>
                </>
            ) : pendingId ? (
                <Button size="sm" variant="secondary" onClick={() => cancel(friendId)}>Cancel invite</Button>
            ) : (
                <Button size="sm" onClick={() => challenge(friendId)}>Challenge</Button>
            )}
        </div>
    );
}
