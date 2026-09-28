/** A section of the landing page: a title, an optional introduction, then its content. */
export function LandingSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-20 px-5 pt-28 sm:px-6">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
        {description && <p className="mt-3 text-pretty text-(--ink-2)">{description}</p>}
      </div>
      <div className="mt-10">{children}</div>
    </section>
  );
}
