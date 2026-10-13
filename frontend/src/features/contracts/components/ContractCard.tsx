import { Badge, Card, CardDescription, CardEyebrow, CardTitle } from "ice-ds";
import { Link } from "react-router";

import { formatMoney } from "../../../lib/format";
import type { Contract } from "../types";

export function ContractCard({ contract }: { contract: Contract }) {
  return (
    <Link to={`/contracts/${contract.slug}`} className="block">
      <Card interactive className="flex h-full flex-col gap-3 p-5">
        <CardEyebrow>{contract.client_name}</CardEyebrow>
        <CardTitle>{contract.title}</CardTitle>
        <CardDescription>
          {contract.check_count} request{contract.check_count === 1 ? "" : "s"} checked
        </CardDescription>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          {contract.out_of_scope_count > 0 ? (
            <Badge variant="error">
              {contract.out_of_scope_count} out of scope ·{" "}
              {formatMoney(contract.flagged_value, contract.currency)}
            </Badge>
          ) : (
            <Badge variant="success">No scope creep yet</Badge>
          )}
        </div>
      </Card>
    </Link>
  );
}
