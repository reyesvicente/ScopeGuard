import { Button } from "ice-ds";
import { useState } from "react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Button type="button" size="sm" variant="secondary" onClick={copy}>
      {copied ? "Copied!" : label}
    </Button>
  );
}
