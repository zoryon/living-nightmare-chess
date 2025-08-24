"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

import { secureFetch } from "@/lib/auth/refresh-client";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getDeviceId, setDeviceId } from "@/lib/device";

const formSchema = z.object({
    email: z.email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters")
});

export default function LoginPage() {
    const router = useRouter();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: "", password: "" }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        setError(null);

        try {
            const existingDeviceId = getDeviceId();
            const headers: Record<string, string> = {
                "Content-Type": "application/json"
            };
            if (existingDeviceId) headers["x-device-id"] = String(existingDeviceId);

            const res = await secureFetch("/api/auth/login", {
                method: "POST",
                headers,
                body: JSON.stringify(values)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Login failed");

            if (data.deviceId) setDeviceId(Number(data.deviceId));

            router.push("/");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-[100dvh] w-full overflow-hidden overscroll-none flex items-center justify-center px-4">
            <div className="w-full max-w-md m-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl max-h-[100dvh] overflow-y-auto nice-scroll">
                <div className="p-6 sm:p-8">
                    <div className="mb-4 flex items-center justify-center">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/10 shadow-md">
                            <span aria-hidden className="text-xl">♞</span>
                        </div>
                    </div>
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                        <p className="mt-1 text-sm text-slate-300">Sign in to continue playing.</p>
                    </div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" aria-busy={loading}>
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-200">Email</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                                    {/* Mail icon */}
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                                                        <path d="M1.5 6.75A2.25 2.25 0 0 1 3.75 4.5h16.5a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 20.25 19.5H3.75a2.25 2.25 0 0 1-2.25-2.25V6.75Zm2.478-.75a.75.75 0 0 0-.478.69v.178l8.073 5.385a.75.75 0 0 0 .854 0l8.073-5.385V6.69a.75.75 0 0 0-.478-.69H3.978Zm16.044 2.776-6.78 4.526a2.25 2.25 0 0 1-2.484 0L3.978 8.776v8.47c0 .414.336.75.75.75h14.544a.75.75 0 0 0 .75-.75v-8.47Z" />
                                                    </svg>
                                                </span>
                                                <Input className="pl-10 placeholder:text-slate-500" placeholder="you@example.com" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel className="text-slate-200">Password</FormLabel>
                                            {/* Optional forgot link for future use */}
                                        </div>
                                        <FormControl>
                                            <div className="relative">
                                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                                    {/* Lock icon */}
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                                                        <path fillRule="evenodd" d="M12 1.5a4.5 4.5 0 0 0-4.5 4.5v3H6.75A2.25 2.25 0 0 0 4.5 11.25v6A2.25 2.25 0 0 0 6.75 19.5h10.5A2.25 2.25 0 0 0 19.5 17.25v-6A2.25 2.25 0 0 0 17.25 9H16.5V6A4.5 4.5 0 0 0 12 1.5Zm3 7.5V6a3 3 0 1 0-6 0v3h6Z" clipRule="evenodd" />
                                                    </svg>
                                                </span>
                                                <Input type={showPassword ? "text" : "password"} className="pl-10 pr-10 placeholder:text-slate-500" placeholder="********" {...field} />
                                                <button
                                                    type="button"
                                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                                    onClick={() => setShowPassword((s) => !s)}
                                                    className="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-200"
                                                >
                                                    {showPassword ? (
                                                        // Eye-slash
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 cursor-pointer">
                                                            <path d="M3.53 2.47a.75.75 0 1 0-1.06 1.06l2.124 2.124A12.704 12.704 0 0 0 1.5 12s3 7.5 10.5 7.5a10.21 10.21 0 0 0 4.567-1.06l3.903 3.903a.75.75 0 1 0 1.06-1.06L3.53 2.47ZM12 18c-5.35 0-8.09-5.032-8.887-6 .523-.629 1.65-1.812 3.178-2.79l2.16 2.16A3.75 3.75 0 0 0 12 15.75c.442 0 .866-.077 1.26-.218l1.63 1.63A8.777 8.777 0 0 1 12 18Zm8.887-6c-.278.333-.716.83-1.292 1.39l-1.07-1.07c.843-.708 1.466-1.41 1.66-1.64C19.66 10.279 16.93 6 12 6c-.552 0-1.084.044-1.596.127l-1.68-1.68A10.156 10.156 0 0 1 12 4.5C19.5 4.5 22.5 12 22.5 12a14.875 14.875 0 0 1-1.613 2Z" />
                                                        </svg>
                                                    ) : (
                                                        // Eye
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 cursor-pointer">
                                                            <path d="M12 4.5C4.5 4.5 1.5 12 1.5 12s3 7.5 10.5 7.5S22.5 12 22.5 12 19.5 4.5 12 4.5Zm0 12a3.75 3.75 0 1 1 0-7.5 3.75 3.75 0 0 1 0 7.5Z" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {error && (
                                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
                                {loading ? "Logging in..." : "Sign in"}
                            </Button>
                        </form>
                    </Form>
                    <div className="mt-6 text-center text-sm text-slate-300">
                        Don't have an account?{" "}
                        <Link href="/register" className="font-medium text-indigo-300 underline-offset-4 hover:underline">
                            Create one
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
