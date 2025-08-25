"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChallengeButtons } from "@/components/friends/ChallengeButtons";
import { Input } from "@/components/ui/input";

type Friend = { id: number; username: string };

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<{ id: number; from: Friend }[]>([]);
  const [outgoing, setOutgoing] = useState<{ id: number; to: Friend }[]>([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [fr, incomingRes, outgoingRes] = await Promise.all([
      fetch("/api/users/me/friends", { credentials: "include" }).then(r => r.json()),
      fetch("/api/users/me/friends/requests?direction=incoming", { credentials: "include" }).then(r => r.json()),
      fetch("/api/users/me/friends/requests?direction=outgoing", { credentials: "include" }).then(r => r.json()),
    ]);
    setFriends(fr.friends ?? []);
    setIncoming(incomingRes.requests ?? []);
    setOutgoing(outgoingRes.requests ?? []);
  };

  useEffect(() => { load(); }, []);

  const send = async () => {
    if (!username) return;
    setLoading(true);
  await fetch("/api/users/me/friends/requests", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username })
    });
    setUsername("");
    setLoading(false);
    load();
  };

  const act = async (id: number, action: "accept" | "decline") => {
    await fetch(`/api/users/me/friends/requests/${id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: action === "accept" ? "ACCEPTED" : "DECLINED" }) });
    load();
  };

  const remove = async (userId: number) => {
    await fetch(`/api/users/me/friends/${userId}`, { method: "DELETE", credentials: "include" });
    load();
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Friends</h1>

      <div className="flex gap-2">
        <Input placeholder="Add by username" value={username} onChange={e => setUsername(e.target.value)} />
        <Button onClick={send} disabled={loading || !username}>Send</Button>
      </div>

      <section>
        <h2 className="font-medium mb-2">Your friends</h2>
        <ul className="space-y-2">
          {friends.map(f => (
            <li key={f.id} className="flex items-center justify-between border rounded px-3 py-2">
              <span>@{f.username}</span>
              <div className="flex items-center gap-2">
                <ChallengeButtons friendId={f.id} />
                <Button variant="ghost" onClick={() => remove(f.id)}>Remove</Button>
              </div>
            </li>
          ))}
          {friends.length === 0 && <div className="text-sm text-muted-foreground">No friends yet.</div>}
        </ul>
      </section>

      <section>
        <h2 className="font-medium mb-2">Incoming requests</h2>
        <ul className="space-y-2">
          {incoming.map(r => (
            <li key={r.id} className="flex items-center justify-between border rounded px-3 py-2">
              <span>@{r.from.username}</span>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => act(r.id, "accept")}>Accept</Button>
                <Button size="sm" variant="secondary" onClick={() => act(r.id, "decline")}>Decline</Button>
              </div>
            </li>
          ))}
          {incoming.length === 0 && <div className="text-sm text-muted-foreground">No incoming requests.</div>}
        </ul>
      </section>

      <section>
        <h2 className="font-medium mb-2">Outgoing requests</h2>
        <ul className="space-y-2">
          {outgoing.map(r => (
            <li key={r.id} className="flex items-center justify-between border rounded px-3 py-2">
              <span>@{r.to.username}</span>
              <Button size="sm" variant="ghost" onClick={async () => { await fetch(`/api/users/me/friends/requests/${r.id}`, { method: "DELETE", credentials: "include" }); load(); }}>Cancel</Button>
            </li>
          ))}
          {outgoing.length === 0 && <div className="text-sm text-muted-foreground">No outgoing requests.</div>}
        </ul>
      </section>
    </div>
  );
}
