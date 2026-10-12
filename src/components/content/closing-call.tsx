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
    <section className="relative isolate mx-auto max-w-6xl px-5 pt-28 pb-12 text-center sm:px-6 sm:pt-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(40%_50%_at_50%_65%,var(--glow-wash),transparent_75%)]"
      />
      <div className="reveal">
        <h2 className="text-title mx-auto max-w-2xl font-semibold text-balance">{title}</h2>
        {children && (
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-pretty text-(--ink-2)">
            {children}
          </p>
        )}
        <div className="mt-9 flex flex-col items-stretch justify-center gap-3 min-[440px]:flex-row min-[440px]:flex-wrap min-[440px]:items-center">
          {actions}
        </div>
      </div>
    </section>
  );
}
