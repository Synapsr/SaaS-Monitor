import Link from "next/link";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">{siteConfig.tagline}</h1>
      <p className="text-balance text-muted-foreground">{siteConfig.description}</p>
      <Button asChild size="lg">
        <Link href="/app">Open the dashboard</Link>
      </Button>
    </main>
  );
}
