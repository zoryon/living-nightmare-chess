"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import FeatureCard from "@/components/FeatureCard";

const LandingPage = () => {
    return (
        <div className="relative min-h-dvh flex flex-col">
            {/* Background Accents */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-purple-500/20 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
            </div>

            {/* Hero Section */}
            <main className="flex-1">
                <section className="max-w-6xl mx-auto px-6 py-16 sm:py-24">
                    <div className="grid items-center gap-10 lg:grid-cols-2">
                        <div className="space-y-6 text-center lg:text-left">
                            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
                                Outplay opponents.
                                <span className="block text-balance bg-gradient-to-r from-purple-400 via-fuchsia-400 to-emerald-400 bg-clip-text text-transparent">
                                    Play Nox Chess
                                </span>
                            </h1>
                            <p className="text-base sm:text-lg text-muted-foreground max-w-prose mx-auto lg:mx-0">
                                Fast matchmaking, real-time play, and unique pieces with mind-bending abilities.
                                Jump in and challenge opponents in seconds.
                            </p>
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                                <Button asChild size="lg">
                                    <Link href="/login">Play</Link>
                                </Button>
                                <Button asChild variant="secondary" size="lg">
                                    <Link href="#features">Explore features</Link>
                                </Button>
                            </div>
                        </div>

                        {/* Decorative Board Placeholder */}
                        <div className="relative mx-auto w-full max-w-xl aspect-square rounded-xl border bg-card/50 p-4 shadow-sm">
                            <div className="absolute inset-0 rounded-xl bg-[radial-gradient(ellipse_at_top,theme(colors.purple.500/10),transparent_60%)]" />
                            <div className="relative grid h-full w-full grid-cols-8 grid-rows-8 overflow-hidden rounded-lg">
                                {Array.from({ length: 64 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={
                                            // simple checker pattern for a board-like feel
                                            ((Math.floor(i / 8) + (i % 8)) % 2 === 0
                                                ? "bg-muted"
                                                : "bg-muted/40") + " border border-border/50"
                                        }
                                    />
                                ))}
                            </div>
                            <div className="pointer-events-none absolute inset-x-6 bottom-6 flex justify-between text-[10px] text-muted-foreground/70">
                                <span>Preview</span>
                                <span>Live board in matches</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section id="features" className="max-w-6xl mx-auto px-6 pb-20">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <FeatureCard title="Unique Pieces" description="Six original units with active and passive abilities that bend classic chess strategy." />
                        <FeatureCard title="Instant Matchmaking" description="Jump into a game in seconds. Low-friction queue with status updates." />
                        <FeatureCard title="Play with Friends" description="Share a match ID and battle instantly across devices." />
                        <FeatureCard title="Energy System" description="Spend Dream Energy during Nightfall to unleash powerful effects." />
                        <FeatureCard title="Mobile Friendly" description="Responsive board and controls optimized for phone and tablet." />
                        <FeatureCard title="Open Roadmap" description="AI practice, ranked ladders, and more in the works." />
                    </div>
                    <div className="mt-8 flex flex-wrap items-center gap-3">
                        <Button asChild>
                            <Link href="/">Play now</Link>
                        </Button>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t py-8 text-center text-sm text-muted-foreground">
                <div className="max-w-6xl mx-auto px-6">
                    <p>
                        Ready?{' '}
                        <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
                            Find a match now
                        </Link>
                        .
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;