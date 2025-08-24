"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type Props = {
    onOpenHowTo: () => void;
    onOpenTips?: () => void;
};

const QuickActions = ({ onOpenHowTo, onOpenTips }: Props) => {
    const router = useRouter();
    return (
        <div className="rounded-3xl border bg-card/80 p-6 shadow-sm ring-1 ring-border/50">
            <h3 className="text-base font-semibold mb-3">Quick actions</h3>
            <div className="flex flex-col gap-2">
                <Button variant="secondary" onClick={onOpenHowTo}>
                    Rules
                </Button>
                <Button variant="secondary" onClick={onOpenTips ?? onOpenHowTo}>
                    Tips & Strategies
                </Button>
                <Button variant="ghost" onClick={() => alert("Practice vs AI is coming soon.")} className="text-muted-foreground">
                    Practice vs AI
                </Button>
            </div>
        </div>
    );
};

export default QuickActions;
