import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Field, Input, Textarea } from "ice-ds";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ApiError } from "../../../lib/api";
import { useCreateContract } from "../api";
import type { Contract } from "../types";
import { SowFileImport } from "./SowFileImport";

// Mirrors ContractSerializer / the Contract model's constraints.
const schema = z.object({
  client_name: z.string().trim().min(1, "Who's the client?").max(200),
  title: z.string().trim().min(1, "Name the project.").max(200),
  sow_text: z.string().trim().min(50, "Paste the full statement of work (at least 50 characters)."),
  hourly_rate: z
    .string()
    .trim()
    .regex(/^\d{1,6}(\.\d{1,2})?$/, "Use a number like 85 or 85.50."),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Use a 3-letter code like USD, EUR, PHP."),
});

type FormValues = z.infer<typeof schema>;

export function ContractForm({ onCreated }: { onCreated: (contract: Contract) => void }) {
  const createContract = useCreateContract();
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { client_name: "", title: "", sow_text: "", hourly_rate: "", currency: "USD" },
  });

  const onSubmit = handleSubmit((values) =>
    createContract.mutate(values, {
      onSuccess: onCreated,
      onError: (error) => {
        if (!(error instanceof ApiError)) return;
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          if (field in values) setError(field as keyof FormValues, { message: messages[0] });
        }
      },
    }),
  );

  // Anything the form can't pin to an input (403s, 500s, network errors) shows as a banner.
  const error = createContract.error;
  const generalError =
    error instanceof ApiError
      ? Object.keys(error.fieldErrors).some((field) => field in schema.shape)
        ? null
        : error.message
      : error
        ? "Couldn't reach the server. Check your connection and try again."
        : null;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Client" htmlFor="client_name" required error={errors.client_name?.message}>
          <Input id="client_name" placeholder="Acme Bakery" {...register("client_name")} />
        </Field>
        <Field label="Project" htmlFor="title" required error={errors.title?.message}>
          <Input id="title" placeholder="Website redesign" {...register("title")} />
        </Field>
      </div>
      <Field
        label="Statement of work"
        htmlFor="sow_text"
        required
        error={errors.sow_text?.message}
        hint="Paste or import the deliverables, exclusions, and revision limits."
      >
        <div className="flex flex-col gap-3">
          <SowFileImport
            onText={(text) =>
              setValue("sow_text", text, { shouldDirty: true, shouldValidate: true })
            }
          />
          <Textarea id="sow_text" rows={14} className="font-mono" {...register("sow_text")} />
        </div>
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Hourly rate"
          htmlFor="hourly_rate"
          required
          error={errors.hourly_rate?.message}
          hint="Used to price change orders."
        >
          <Input id="hourly_rate" inputMode="decimal" placeholder="85" {...register("hourly_rate")} />
        </Field>
        <Field label="Currency" htmlFor="currency" required error={errors.currency?.message}>
          <Input id="currency" maxLength={3} {...register("currency")} />
        </Field>
      </div>
      {generalError && (
        <Alert intent="error" title="Couldn't save the contract">
          {generalError}
        </Alert>
      )}
      <Button type="submit" size="lg" loading={createContract.isPending}>
        Save contract
      </Button>
    </form>
  );
}
