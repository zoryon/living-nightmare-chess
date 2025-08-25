"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import { PublicUser } from "@/types";
import { Button } from "@/components/ui/button";
import Logo from "@/components/global/Logo";
import UserInfo from "@/components/global/UserInfo";

const Navbar = () => {
    const pathname = usePathname();

    const [user, setUser] = useState<PublicUser | null>(null);

    const isAuthOrLanding = ["/login", "/register", "/landing"].some((p) =>
        pathname?.startsWith(p)
    );

    useEffect(() => {
        if (isAuthOrLanding) return; // on auth/landing pages we don't show UserInfo

        let aborted = false;
        const fetchMe = async () => {
            try {
                const res = await fetch("/api/users/me", { method: "GET", credentials: "include" });
                if (res.ok) {
                    const data = await res.json();
                    if (!aborted && data?.publicUser) setUser(data.publicUser as PublicUser);
                }
            } catch (_) {
                // ignore
            }
        };
        fetchMe();
        return () => {
            aborted = true;
        };
    }, [isAuthOrLanding]);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-2.5">
                <Logo />

                {isAuthOrLanding ? (
                    <nav className="hidden gap-2 sm:flex">
                        <Button asChild variant="ghost">
                            <Link href="/login">Log in</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/register">Sign up</Link>
                        </Button>
                    </nav>
                ) : (
                    <UserInfo user={user} />
                )}
            </div>
        </header>
    );
};

export default Navbar;