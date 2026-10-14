import { Alert, Button } from "ice-ds";
import { useRef, useState } from "react";

import { ApiError } from "../../../lib/api";
import { useExtractSow } from "../api";

const ACCEPT = ".pdf,.docx,.txt,.md";

/** "Import from file" button: uploads a contract and hands back its text. */
export function SowFileImport({ onText }: { onText: (text: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const extract = useExtractSow();
  const [imported, setImported] = useState<string | null>(null);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so picking the same file again still fires onChange.
    event.target.value = "";
    if (!file) return;
    setImported(null);
    extract.mutate(file, {
      onSuccess: ({ filename, text }) => {
        onText(text);
        setImported(filename);
      },
    });
  };

  const error = extract.error;
  const errorMessage =
    error instanceof ApiError
      ? (error.fieldErrors.file?.[0] ?? error.message)
      : error
        ? "Couldn't reach the server. Check your connection and try again."
        : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={onChange}
          aria-label="Contract file"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={extract.isPending}
          onClick={() => inputRef.current?.click()}
        >
          {extract.isPending ? "Reading file…" : "Import from file"}
        </Button>
        <span className="text-sm">
          {imported
            ? `Imported from ${imported}. Review the text below before saving.`
            : "PDF, Word (.docx), TXT or Markdown, up to 10 MB. The file itself isn't stored."}
        </span>
      </div>
      {errorMessage && (
        <Alert intent="error" title="Couldn't import that file">
          {errorMessage}
        </Alert>
      )}
    </div>
  );
}
