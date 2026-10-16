import { ButtonLink } from "../../../components/ButtonLink";

export function FinalCta() {
  return (
    <section className="border-y-4 border-neo-black bg-neo-yellow">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 py-16 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-4xl font-bold">Next “quick favour”, check it first.</h2>
          <p className="text-lg">Paste the request and see what it's really worth.</p>
        </div>
        <ButtonLink to="/signup" size="lg" variant="inverse">
          Create your account
        </ButtonLink>
      </div>
    </section>
  );
}
