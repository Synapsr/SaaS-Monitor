"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Currencies most SaaS businesses bill or report in. Names are spelled out here rather than
 * with `Intl.DisplayNames`, whose output depends on the ICU version (server and browser differ).
 */
const COMMON_CURRENCIES: Record<string, string> = {
  usd: "US dollar",
  eur: "Euro",
  gbp: "British pound",
  cad: "Canadian dollar",
  aud: "Australian dollar",
  nzd: "New Zealand dollar",
  chf: "Swiss franc",
  jpy: "Japanese yen",
  sek: "Swedish krona",
  nok: "Norwegian krone",
  dkk: "Danish krone",
  pln: "Polish złoty",
  czk: "Czech koruna",
  inr: "Indian rupee",
  sgd: "Singapore dollar",
  hkd: "Hong Kong dollar",
  brl: "Brazilian real",
  mxn: "Mexican peso",
  zar: "South African rand",
  aed: "UAE dirham",
};

export function CurrencySelect({
  id,
  value,
  onChange,
  extraCurrencies,
}: {
  id: string;
  value: string;
  onChange: (currency: string) => void;
  /** Currencies of the connected accounts, offered even when they are not in the common list. */
  extraCurrencies: string[];
}) {
  const codes = [
    ...new Set(
      [...Object.keys(COMMON_CURRENCIES), ...extraCurrencies, value].map((code) =>
        code.toLowerCase(),
      ),
    ),
  ];
  return (
    <Select name="currency" value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="h-9 w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-80">
        <SelectGroup>
          {codes.map((code) => (
            <SelectItem key={code} value={code}>
              <span className="w-10 font-mono text-xs text-muted-foreground uppercase">{code}</span>
              {COMMON_CURRENCIES[code] ?? code.toUpperCase()}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
