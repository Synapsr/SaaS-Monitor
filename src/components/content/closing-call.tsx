/** The last word of a content page: a heading, a line, and where to go next. */
export function ClosingCall({
  title,
  children,
  actions,
}: {
  title: string;
  children?: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <section className="relative mx-auto max-w-6xl px-5 pt-28 pb-20 text-center sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_50%_at_50%_65%,color-mix(in_oklab,var(--glow)_12%,transparent),transparent_75%)]"
      />
      <h2 className="relative mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {children && (
        <p className="relative mx-auto mt-4 max-w-xl text-pretty text-(--ink-2)">{children}</p>
      )}
      <div className="relative mt-8 flex flex-wrap justify-center gap-3">{actions}</div>
    </section>
  );
}
