type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  intro?: string;
};

export function SectionHeader({ eyebrow, title, intro }: SectionHeaderProps) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? (
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-accent">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-3xl font-semibold text-ink md:text-4xl">{title}</h2>
      {intro ? <p className="mt-4 text-lg leading-8 text-muted">{intro}</p> : null}
    </div>
  );
}
