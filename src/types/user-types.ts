export type PublicUser = {
    id: number;
    createdAt: Date | null;
    email: string | null;
    username: string;
    isEmailVerified: boolean | null;
    updatedAt: Date | null;
}