import Link from "next/link";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

/** Centered layout of the sign-in, sign-up and invitation pages. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-svh flex-col items-center px-4 py-10 sm:justify-center sm:py-16">
      <Backdrop />
      <Link
        href="/"
        className="mb-8 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Logo />
      </Link>
      <main className="w-full max-w-[25rem]">{children}</main>
    </div>
  );
}

/** A faint dot grid with a glow in the brand color, fading out towards the bottom. */
function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(var(--color-foreground)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)] [background-size:22px_22px] opacity-[0.07] dark:opacity-[0.12]" />
      <div className="absolute -top-48 left-1/2 h-96 w-[44rem] -translate-x-1/2 rounded-full bg-emerald-400/15 blur-3xl dark:bg-emerald-400/10" />
    </div>
  );
}

export function AuthCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-card p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-12px_rgb(0_0_0/0.12)] ring-1 ring-foreground/10 sm:p-8 dark:shadow-none",
        className,
      )}
      {...props}
    />
  );
}

export function AuthHeader({
  title,
  description,
}: {
  title: string;
  description?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-1.5">
      <h1 className="text-xl font-semibold tracking-tight text-balance">{title}</h1>
      {description && <p className="text-sm text-pretty text-muted-foreground">{description}</p>}
    </div>
  );
}
