import { notFound } from "next/navigation";
import ConfirmRegistrationClient from "@/components/auth/ConfirmRegistrationClient";

interface PageProps {
    searchParams: Promise<{ token?: string }>
}

const ConfirmRegistrationPage = async ({ searchParams }: PageProps) => {
    const params = await searchParams;
    if (!params.token) return notFound();

    return <ConfirmRegistrationClient token={params.token} />;
};

export default ConfirmRegistrationPage; 