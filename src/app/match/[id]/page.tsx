export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="min-h-dvh p-6">
      <h1 className="text-2xl font-semibold">Match #{id}</h1>
      <p className="text-muted-foreground mt-2">
        Game UI coming next. You're connected to the match room.
      </p>
    </main>
  );
}
