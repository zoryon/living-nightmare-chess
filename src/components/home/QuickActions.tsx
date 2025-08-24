"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type Props = {
    continueId: string | null;
    onOpenHowTo: () => void;
};

const QuickActions = ({ continueId, onOpenHowTo }: Props) => {
    const router = useRouter();
    return (
        <div className="rounded-3xl border bg-card/80 p-6 shadow-sm ring-1 ring-border/50">
            <h3 className="text-base font-semibold mb-3">Quick actions</h3>
            <div className="flex flex-col gap-2">
                {continueId && (
                    <Button onClick={() => router.push(`/match/${encodeURIComponent(continueId)}`)} variant="secondary">
                        Continue match
                    </Button>
                )}
                <Button variant="secondary" onClick={onOpenHowTo}>
                    Rules & tips
                </Button>
                <Button variant="secondary" onClick={() => router.push("/landing")}>
                    Explore
                </Button>
                <Button variant="ghost" onClick={() => alert("Practice vs AI is coming soon.")} className="text-muted-foreground">
                    Practice vs AI
                </Button>
            </div>
        </div>
    );
};

export default QuickActions;
