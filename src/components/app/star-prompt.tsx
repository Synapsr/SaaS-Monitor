"use client";

import { SparkleIcon, StarIcon } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { GitHubIcon } from "@/components/brand-icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { siteConfig } from "@/lib/site";
import {
  LATER_MS,
  parseStarAnswer,
  STAR_PROMPT_KEY,
  starPromptDue,
  type StarAnswer,
} from "@/lib/star-prompt";
import { cn } from "@/lib/utils";

/** Lets the dashboard settle first: asking is never the first thing someone sees. */
const DELAY_MS = 2_500;

/** "Synapsr/SaaS-Monitor", as GitHub names the repository. */
const REPOSITORY = new URL(siteConfig.repositoryUrl).pathname.slice(1);

/** Where the sparkles around the star twinkle, one after the other. */
const SPARKLES = [
  { className: "top-5 left-[27%] size-3.5", delay: "0s" },
  { className: "top-9 right-[26%] size-4", delay: "0.7s" },
  { className: "bottom-12 left-[31%] size-2.5", delay: "1.4s" },
  { className: "top-16 right-[34%] size-2.5", delay: "2.1s" },
];

function readAnswer(): StarAnswer | null {
  try {
    return parseStarAnswer(localStorage.getItem(STAR_PROMPT_KEY));
  } catch {
    return null;
  }
}

function saveAnswer(answer: StarAnswer) {
  try {
    localStorage.setItem(STAR_PROMPT_KEY, JSON.stringify(answer));
  } catch {
    // Private browsing may refuse it: the answer then holds until the page reloads.
  }
}

/**
 * Asks a self-hosted team for a star on GitHub: kindly, rarely, and never again once they starred
 * or said no. "Maybe later", or closing, asks again a day later.
 */
export function StarPrompt() {
  const [open, setOpen] = useState(false);
  const star = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!starPromptDue(readAnswer(), Date.now())) return;
    const timer = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function answer(value: StarAnswer) {
    saveAnswer(value);
    setOpen(false);
  }
  const later = () => answer({ answer: "later", until: Date.now() + LATER_MS });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && later()}>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-md"
        // Starring is what the prompt offers: Enter does it, not "Maybe later".
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          star.current?.focus();
        }}
      >
        <div className="relative flex h-44 flex-col items-center justify-center gap-3 overflow-hidden border-b bg-[radial-gradient(55%_75%_at_50%_42%,color-mix(in_oklab,var(--color-amber-400)_24%,transparent),transparent_72%)]">
          {SPARKLES.map(({ className, delay }) => (
            <SparkleIcon
              key={delay}
              aria-hidden
              style={{ animationDelay: delay }}
              className={cn(
                "absolute animate-twinkle fill-amber-300 text-amber-300 opacity-0 motion-reduce:animate-none motion-reduce:opacity-60",
                className,
              )}
            />
          ))}
          <motion.div
            initial={{ scale: 0.4, rotate: -35, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", duration: 0.8, bounce: 0.45, delay: 0.15 }}
            className="grid size-18 place-items-center rounded-full bg-background shadow-[0_0_48px_-8px_var(--color-amber-400)] ring-1 ring-amber-400/40"
          >
            <StarIcon aria-hidden className="size-9 fill-amber-400 text-amber-400" />
          </motion.div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border backdrop-blur-sm">
            <GitHubIcon className="size-3.5" />
            {REPOSITORY}
          </span>
        </div>

        <div className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-2 text-center">
            <DialogTitle className="text-lg">Enjoying {siteConfig.name}?</DialogTitle>
            <DialogDescription className="text-pretty">
              It’s free, open source and runs on your own server. A star on GitHub helps other
              founders find it, and keeps the project going.
            </DialogDescription>
          </div>
          <div className="flex flex-col gap-2">
            <Button asChild size="lg" className="h-10">
              <a
                ref={star}
                href={siteConfig.repositoryUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => answer({ answer: "starred" })}
              >
                <StarIcon data-icon="inline-start" />
                Star on GitHub
              </a>
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={later}>
                Maybe later
              </Button>
              <Button
                variant="ghost"
                onClick={() => answer({ answer: "never" })}
                className="text-muted-foreground"
              >
                Don’t ask again
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
