import { Badge, Card } from "ice-ds";

import { VerdictBadge } from "../../checks/components/VerdictBadge";

/** A static, illustrative check modelled on the demo contract (demo/demo-contract.md). */
export function ExampleCheck() {
  return (
    <Card className="flex flex-col gap-4 p-5" aria-label="Example scope check">
      <header className="flex flex-wrap items-center gap-2">
        <VerdictBadge verdict="out_of_scope" />
        <span className="ml-auto font-mono text-xs">Example · Email</span>
      </header>

      <blockquote className="border-l-4 border-neo-black bg-white px-4 py-3">
        Quick one: could you also add a shop page so we can sell bags of our beans and some merch
        online? Shouldn't take long!
      </blockquote>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-bold uppercase">SOW says</span>
          <Badge variant="success">Quote verified</Badge>
        </div>
        <p className="bg-neo-yellow/40 px-3 py-2 font-mono text-sm">
          “5.1 Online store, e-commerce, or subscription functionality of any kind.”
        </p>
      </div>

      <div className="flex flex-wrap gap-6 border-2 border-neo-black bg-neo-pink/30 px-4 py-3">
        <div>
          <p className="font-display text-xs font-bold uppercase">Extra work</p>
          <p className="font-display text-2xl font-bold">16 h</p>
        </div>
        <div>
          <p className="font-display text-xs font-bold uppercase">Change order</p>
          <p className="font-display text-2xl font-bold">$1,360</p>
        </div>
      </div>
    </Card>
  );
}
