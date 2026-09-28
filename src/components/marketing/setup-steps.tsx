/** The three steps from Stripe to the wall. */
const STEPS = [
  {
    title: "Connect Stripe",
    description:
      "Create a read-only restricted key in one click and paste it. Your history is imported in about a minute.",
  },
  {
    title: "Make it yours",
    description:
      "Choose the sounds, the colors and your goal with a live preview. Every change is saved as you go.",
  },
  {
    title: "Put it on the wall",
    description:
      "Open the screen link on any TV, monitor or Raspberry Pi. No sign-in and nothing to install.",
  },
];

export function SetupSteps() {
  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {STEPS.map((step, index) => (
        <li key={step.title} className="rounded-2xl p-6 ring-1 ring-white/[0.08]">
          <span className="flex size-7 items-center justify-center rounded-full bg-(--glow)/15 text-sm font-medium text-(--glow) tabular-nums">
            {index + 1}
          </span>
          <h3 className="mt-4 font-medium">{step.title}</h3>
          <p className="mt-1.5 text-sm text-pretty text-(--ink-2)">{step.description}</p>
        </li>
      ))}
    </ol>
  );
}
