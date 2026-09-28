import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * A settings block: what it is about, its content, and an optional footer with a hint and the
 * button that applies it.
 */
export function SettingsCard({
  title,
  description,
  footer,
  danger = false,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  danger?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "gap-5 [--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)]",
        danger && "ring-destructive/30",
      )}
    >
      <CardHeader>
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
        {description && <CardDescription className="text-pretty">{description}</CardDescription>}
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
      {footer && (
        <CardFooter
          className={cn(
            "flex-wrap justify-between gap-3 py-3.5 sm:py-3.5",
            danger && "border-destructive/20 bg-destructive/5",
          )}
        >
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
