import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Field, Input } from "ice-ds";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";

import { useNextPath, useSignup } from "../api";
import { applyAuthError } from "../formErrors";
import { AuthError } from "../headless";

// Django's password validators run server-side; this only catches the obvious.
const schema = z
  .object({
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(8, "Use at least 8 characters."),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    path: ["confirm"],
    message: "Passwords don't match.",
  });

type FormValues = z.infer<typeof schema>;
const FIELDS = ["email", "password"] as const;

export function SignupForm({ onVerificationSent }: { onVerificationSent: (email: string) => void }) {
  const signup = useSignup();
  const navigate = useNavigate();
  const next = useNextPath();
  const [banner, setBanner] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", confirm: "" },
  });

  const onSubmit = handleSubmit(({ email, password }) => {
    setBanner("");
    signup.mutate(
      { email, password },
      {
        onSuccess: (outcome) => {
          if (outcome === "verify_email") onVerificationSent(email);
          else navigate(next, { replace: true });
        },
        onError: (error) => {
          if (error instanceof AuthError && error.status === 409) navigate(next, { replace: true });
          else setBanner(applyAuthError(error, FIELDS, setError));
        },
      },
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <Field label="Email" htmlFor="email" required error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Field
        label="Password"
        htmlFor="password"
        required
        error={errors.password?.message}
        hint="At least 8 characters, not all numbers, and not a common password."
      >
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
      </Field>
      <Field label="Confirm password" htmlFor="confirm" required error={errors.confirm?.message}>
        <Input id="confirm" type="password" autoComplete="new-password" {...register("confirm")} />
      </Field>
      {banner && (
        <Alert intent="error" title="Couldn't create your account">
          {banner}
        </Alert>
      )}
      <Button type="submit" size="lg" loading={signup.isPending}>
        Create account
      </Button>
    </form>
  );
}
