import { ButtonLink } from "../../../components/ButtonLink";
import { ExampleCheck } from "./ExampleCheck";

export function Hero() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
      <div className="flex flex-col gap-6">
        <p className="font-mono text-sm font-bold uppercase">For freelancers and small studios</p>
        <h1 className="font-display text-5xl font-bold leading-none md:text-6xl">
          Stop doing free work.
        </h1>
        <p className="text-lg">
          “Shouldn't take long” is how scope creep starts. ScopeGuard checks each client request
          against your statement of work, tells you whether it's covered, and drafts the change order
          when it isn't.
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink to="/signup" size="lg">
            Check your first request
          </ButtonLink>
          <a
            href="#how-it-works"
            className="self-center font-semibold underline underline-offset-4"
          >
            See how it works
          </a>
        </div>
      </div>
      <ExampleCheck />
    </section>
  );
}
