import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Field, Input } from "ice-ds";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useRequestPasswordReset } from "../api";
import { applyAuthError } from "../formErrors";

const schema = z.object({
  email: z.string().trim().email("Enter the email you signed up with."),
});

type FormValues = z.infer<typeof schema>;
const FIELDS = ["email"] as const;

export function ForgotPasswordForm() {
  const requestReset = useRequestPasswordReset();
  const [banner, setBanner] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  if (requestReset.isSuccess) {
    return (
      <Alert intent="success" title="Check your inbox">
        If {requestReset.variables} has an account, we sent it a link to reset the password.
      </Alert>
    );
  }

  const onSubmit = handleSubmit(({ email }) => {
    setBanner("");
    requestReset.mutate(email, {
      onError: (error) => setBanner(applyAuthError(error, FIELDS, setError)),
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <Field label="Email" htmlFor="email" required error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
      </Field>
      {banner && (
        <Alert intent="error" title="Couldn't send the link">
          {banner}
        </Alert>
      )}
      <Button type="submit" size="lg" loading={requestReset.isPending}>
        Email me a reset link
      </Button>
    </form>
  );
}
