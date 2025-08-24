"use client";
import { Button } from "@/components/ui/button";
import type { PublicUser } from "@/types";

type Props = {
    user: PublicUser | null;
    loggingOut: boolean;
    onLogout: () => void;
};

const GreetingBar = ({ user, loggingOut, onLogout }: Props) => (
    <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Welcome back</h1>
        <div className="flex items-center gap-3">
            {user && (
                <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-muted text-sm font-medium">
                        {user.username?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <div className="leading-tight">
                        <div className="text-sm font-medium">{user.username}</div>
                        {user.email && (
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                        )}
                    </div>
                </div>
            )}
            <Button variant="outline" onClick={onLogout} disabled={loggingOut}>
                {loggingOut ? "Logging out…" : "Log out"}
            </Button>
        </div>
    </div>
);

export default GreetingBar;
