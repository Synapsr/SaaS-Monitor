/** The atmosphere behind a screen: a soft glow of the accent, grain and a vignette. */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-[45%] -left-[20%] h-[110%] w-[75%] bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--glow)_11%,transparent),transparent)]" />
      <div className="absolute -right-[25%] -bottom-[55%] h-[100%] w-[70%] bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--glow-deep)_8%,transparent),transparent)]" />
      <div className="display-grain absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(0_0_0/0.4))]" />
    </div>
  );
}
