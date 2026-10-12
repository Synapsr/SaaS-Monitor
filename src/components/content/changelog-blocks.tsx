import type { Block, Inline } from "@/lib/marketing/changelog";

/** A release's notes, from the blocks `parseChangelog` reads out of CHANGELOG.md. */
export function ChangelogBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return (
              <h3 key={index} className="mt-2 text-sm font-medium text-(--ink-3) first:mt-0">
                <InlineNodes nodes={block.children} />
              </h3>
            );
          case "paragraph":
            return (
              <p key={index} className="text-pretty text-(--ink-2)">
                <InlineNodes nodes={block.children} />
              </p>
            );
          case "list":
            return (
              <ul key={index} className="flex flex-col gap-2.5 text-(--ink-2)">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="relative pl-5 text-pretty">
                    <span
                      aria-hidden
                      className="absolute top-[0.7em] left-1 size-1.5 -translate-y-1/2 rounded-full bg-(--glow)/60"
                    />
                    <InlineNodes nodes={item} />
                  </li>
                ))}
              </ul>
            );
        }
      })}
    </div>
  );
}

function InlineNodes({ nodes }: { nodes: Inline[] }) {
  return nodes.map((node, index) => {
    switch (node.type) {
      case "text":
        return node.text;
      case "code":
        return (
          <code
            key={index}
            className="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-[0.85em] text-(--ink)"
          >
            {node.text}
          </code>
        );
      case "strong":
        return (
          <strong key={index} className="font-medium text-(--ink)">
            <InlineNodes nodes={node.children} />
          </strong>
        );
      case "link":
        return (
          <a
            key={index}
            href={node.href}
            className="text-(--ink) underline decoration-white/25 underline-offset-2 hover:decoration-current"
          >
            <InlineNodes nodes={node.children} />
          </a>
        );
    }
  });
}
