type FeatureCardProps = {
    title: string;
    description: string;
};

const FeatureCard = ({ title, description }: FeatureCardProps) => {
    return (
        <div className="group relative overflow-hidden rounded-xl border bg-card/60 p-6 transition-colors hover:bg-card">
            <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl transition-opacity group-hover:opacity-80" />
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
    );
}

export default FeatureCard;