"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

/** Masked field (password, API key) with a button to check what was typed or pasted. */
export function SecretInput({
  secretName = "password",
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & {
  /** Used in the reveal button's label: "Show password", "Show key"… */
  secretName?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <InputGroup className="h-9">
      <InputGroupInput type={visible ? "text" : "password"} className={cn(className)} {...props} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label={`${visible ? "Hide" : "Show"} ${secretName}`}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
