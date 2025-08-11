"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const ConfirmRegistrationClient = ({
    token
}: {
    token: string
}) => {
    const router = useRouter();

    const [isPending, setIsPending] = useState(true);
    const [resMessage, setResMessage] = useState("");

    useEffect(() => {
        setIsPending(true);

        async function confirmRegistration() {
            try {
                const res = await fetch(`/api/auth/register/confirm?token=${token}`, {
                    method: "GET",
                    headers: {
                        "Accept": "application/json",
                    },
                }).then(res => res.json());

                if (!res.success) {
                    throw new Error("Registration confirmation failed");
                }
                setResMessage("Registration confirmed, you will be automatically logged-in shortly...");
            } catch (error) {
                console.error(error);
                setResMessage("Failed to confirm registration");
            } finally {
                setIsPending(false);
            }
        }
        confirmRegistration();
    }, []);

    useEffect(() => {
        if (!isPending) {
            setTimeout(() => {
                router.push("/")
            }, 3000);
        }
    }, [isPending]);

    return (
        <Button
            disabled
            variant={"outline"}
            className="p-6"
        >
            {isPending ? "Verifying carefully.." : resMessage}
        </Button>
    );
};

export default ConfirmRegistrationClient;