"use client";

import { SmartphoneIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { QrCode } from "./qr-code";

/** The screen's QR code, one click away: the SaaS Monitor app opens screens from it. */
export function PhoneQrButton({
  url,
  name,
  className,
}: {
  url: string;
  name: string;
  className?: string;
}) {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={`Open ${name} on your phone`}
              className={className}
            >
              <SmartphoneIcon />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Open on your phone</TooltipContent>
      </Tooltip>
      <PopoverContent align="start" className="w-64 gap-3 rounded-xl p-3">
        <QrCode
          value={url}
          label={`QR code of the link of ${name}`}
          className="aspect-square w-full rounded-md p-2.5 ring-1 ring-foreground/10"
        />
        <PopoverHeader className="px-0.5 pb-0.5">
          <PopoverTitle>Open on your phone</PopoverTitle>
          <PopoverDescription className="text-pretty">
            Scan it with the SaaS Monitor app to follow this screen, with its widgets and
            notifications. A camera opens it in the browser.
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  );
}
