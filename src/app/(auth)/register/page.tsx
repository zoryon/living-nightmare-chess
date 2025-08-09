"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { secureFetch } from "@/lib/auth/refresh-client";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getDeviceId, setDeviceId } from "@/lib/device";

const formSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters")
});

export default function RegisterPage() {
    const router = useRouter();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { username: "", email: "", password: "" }
    });
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        setError(null);

        try {
            const existingDeviceId = getDeviceId();
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (existingDeviceId) headers["x-device-id"] = String(existingDeviceId);

            const res = await secureFetch("/api/auth/register", {
                method: "POST",
                headers,
                body: JSON.stringify(values)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Registration failed");

            if (data.deviceId) setDeviceId(Number(data.deviceId));

            router.push("/");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-sm mx-auto mt-20">
            <h1 className="text-2xl font-bold mb-6">Register</h1>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input placeholder="CoolPlayer42" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="you@example.com" {...field} />
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
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="********" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Registering..." : "Register"}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
