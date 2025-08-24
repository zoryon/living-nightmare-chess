"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { PublicUser } from "@/types";
import ConfirmDialog from "@/components/global/ConfirmDialog";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

const UserInfo = ({ user }: { user: PublicUser | null }) => {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const router = useRouter();

    const handleLogout = async () => {
        try {
            setLoggingOut(true);
            await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
            router.push("/login");
        } catch (_) {
            // no-op
        } finally {
            setLoggingOut(false);
        }
    };

    const renderMaskedEmail = (emailStr: string) => {
        const atIndex = emailStr.indexOf("@");
        if (atIndex === -1) {
            const n = emailStr.length;
            const visibleCount = n > 7 ? 3 : n > 5 ? 2 : 1;
            const vis = emailStr.slice(0, Math.min(visibleCount, Math.max(1, n)));
            const masked = "*".repeat(Math.max(0, n - vis.length));
            return (
                <span className="whitespace-nowrap">
                    {vis}
                    {masked}
                </span>
            );
        }

        const local = emailStr.slice(0, atIndex);
        const domain = emailStr.slice(atIndex + 1);

        const visibleCount = local.length > 7 ? 3 : local.length > 5 ? 2 : 1;
        const visibleLocal = local.slice(0, Math.min(visibleCount, Math.max(1, local.length)));
        const maskedLocal = "*".repeat(Math.max(0, local.length - visibleLocal.length));
        const maskedDomain = "*".repeat(domain.length);

        return (
            <span className="whitespace-nowrap">
                {visibleLocal}
                {maskedLocal}
                @{maskedDomain}
            </span>
        );
    };

    return (
        <div className="flex items-center gap-3">
            {user && (
                <DropdownMenu>
                    {/* Trigger */}
                    <DropdownMenuTrigger asChild className="focus:outline-none">
                        <button
                            type="button"
                            className="flex items-center gap-3 cursor-pointer hover:bg-accent/60 py-1.5 px-3 rounded-sm duration-200 ease-in-out"
                            aria-label="Open user menu"
                        >
                            <div className="leading-tight text-right">
                                <div className="text-sm font-medium">{user.username}</div>
                                {user.email && (
                                    <div className="text-xs text-muted-foreground">{renderMaskedEmail(user.email)}</div>
                                )}
                            </div>
                            {/* Avatar placeholder */}
                            <div className="grid h-9 w-9 place-items-center rounded-full bg-muted text-sm font-medium pointer-events-none">
                                {user.username?.[0]?.toUpperCase() ?? "U"}
                            </div>
                        </button>
                    </DropdownMenuTrigger>

                    {/* Main Content */}
                    <DropdownMenuContent align="end" className="w-56">
                        {/* Info Group */}
                        <DropdownMenuLabel>User Info</DropdownMenuLabel>
                        <DropdownMenuGroup>
                            <DropdownMenuItem disabled>
                                {user.email || "error"}
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        {/* Other groups */}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setConfirmOpen(true)}>Log out</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            <ConfirmDialog
                open={confirmOpen}
                title="Log out?"
                description="You’ll be signed out of this device. You can sign back in anytime."
                confirmText="Log out"
                cancelText="Cancel"
                loading={loggingOut}
                onConfirm={() => {
                    setConfirmOpen(false);
                    handleLogout();
                }}
                onClose={() => setConfirmOpen(false)}
            />
        </div>
    );
};

export default UserInfo;