import { Card } from "ice-ds";
import { useNavigate } from "react-router";

import { ContractForm } from "../features/contracts/components/ContractForm";

export default function NewContractPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="font-display text-4xl font-bold">New contract</h1>
      <Card className="p-6">
        <ContractForm onCreated={(contract) => navigate(`/contracts/${contract.slug}`)} />
      </Card>
    </div>
  );
}
