import { Card, CardDescription, CardTitle } from "ice-ds";

import { STEPS } from "../content";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-8 border-y-4 border-neo-black bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16">
        <h2 className="font-display text-4xl font-bold">How it works</h2>
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <Card className="flex h-full flex-col gap-3 p-5">
                <span className="flex size-10 items-center justify-center border-2 border-neo-black bg-neo-yellow font-display text-lg font-bold">
                  {index + 1}
                </span>
                <CardTitle>{step.title}</CardTitle>
                <CardDescription>{step.body}</CardDescription>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
