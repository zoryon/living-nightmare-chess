type Props = { state: string };

const Status = ({ state }: Props) => {
    if (state === "idle") return <p className="text-xs text-muted-foreground">Idle</p>;
    if (state === "searching") return <p className="text-xs">Looking for an opponent… Stay on this page.</p>;
    if (state === "starting") return <p className="text-xs">Starting game…</p>;
    if (state === "resumed") return <p className="text-xs">Resumed existing match.</p>;
    return null;
};

export default Status;
