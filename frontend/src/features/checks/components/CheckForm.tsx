import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Card, CardTitle, Field, Select, Textarea } from "ice-ds";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ApiError } from "../../../lib/api";
import { useRunScopeCheck } from "../api";
import { SOURCE_LABELS, SOURCES } from "../types";

// Mirrors ScopeCheckCreateSerializer.
const schema = z.object({
  source: z.enum(SOURCES),
  request_text: z
    .string()
    .trim()
    .min(5, "Paste the client's request.")
    .max(20000, "That's a lot — trim it below 20,000 characters."),
});

type FormValues = z.infer<typeof schema>;

export function CheckForm({ contract }: { contract: string }) {
  const runCheck = useRunScopeCheck();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { source: "email", request_text: "" },
  });

  const onSubmit = handleSubmit((values) =>
    runCheck.mutate({ contract, ...values }, { onSuccess: () => reset({ ...values, request_text: "" }) }),
  );

  const serverError = runCheck.error instanceof ApiError ? runCheck.error : null;

  return (
    <Card variant="featured" className="flex flex-col gap-4 p-5">
      <CardTitle>Is this in scope?</CardTitle>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Where did it come from?" htmlFor="source">
          <Select id="source" {...register("source")}>
            {SOURCES.map((source) => (
              <option key={source} value={source}>
                {SOURCE_LABELS[source]}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Client request"
          htmlFor="request_text"
          required
          error={errors.request_text?.message ?? serverError?.fieldErrors.request_text?.[0]}
          hint="Paste the email, Slack message, or ticket. It's checked against the SOW by an open-weight model."
        >
          <Textarea
            id="request_text"
            rows={6}
            placeholder="Hey! Quick one — could you also add a shop page so we can sell merch?"
            {...register("request_text")}
          />
        </Field>
        {serverError && !serverError.fieldErrors.request_text && (
          <Alert intent="error" title="Couldn't run the check">
            {serverError.message}
          </Alert>
        )}
        <Button type="submit" size="lg" loading={runCheck.isPending}>
          {runCheck.isPending ? "Reading the SOW…" : "Check scope"}
        </Button>
      </form>
    </Card>
  );
}
