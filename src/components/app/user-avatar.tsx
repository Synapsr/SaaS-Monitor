import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/** "Ada Lovelace" → "AL". */
function initials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0));
  return letters.join("").toUpperCase() || "?";
}

export function UserAvatar({
  name,
  image,
  className,
}: {
  name: string;
  image: string | null;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      {image && <AvatarImage src={image} alt="" />}
      <AvatarFallback className="text-xs font-medium">{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
