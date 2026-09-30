import Link from "next/link";

const linkClass = "text-foreground underline underline-offset-4 hover:decoration-foreground/40";

/** Creating an account on the hosted service accepts its terms: say so where it happens. */
export function TermsConsent() {
  return (
    <p className="mt-5 text-center text-xs leading-5 text-pretty text-muted-foreground">
      By signing up, you agree to the{" "}
      <Link href="/terms" className={linkClass}>
        terms of service
      </Link>{" "}
      and the{" "}
      <Link href="/privacy" className={linkClass}>
        privacy policy
      </Link>
      .
    </p>
  );
}
