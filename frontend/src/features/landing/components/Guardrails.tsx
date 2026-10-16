import { GUARDRAILS } from "../content";

export function Guardrails() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16">
      <div className="flex max-w-2xl flex-col gap-3">
        <h2 className="font-display text-4xl font-bold">A verdict you can send to a client</h2>
        <p className="text-lg">
          A wrong “out of scope” costs you the relationship. So ScopeGuard doesn't take the model's
          word for it.
        </p>
      </div>
      <dl className="grid gap-x-10 gap-y-8 md:grid-cols-2">
        {GUARDRAILS.map((item) => (
          <div key={item.title} className="flex flex-col gap-2 border-l-4 border-neo-black pl-4">
            <dt className="font-display text-xl font-bold">{item.title}</dt>
            <dd>{item.body}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
