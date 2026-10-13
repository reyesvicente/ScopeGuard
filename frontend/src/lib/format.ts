export function formatMoney(amount: string | null, currency: string): string {
  if (amount === null) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(amount));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );
}
