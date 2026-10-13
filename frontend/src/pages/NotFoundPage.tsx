import { Button, EmptyState } from "ice-ds";
import { useNavigate } from "react-router";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <EmptyState
      title="Page not found"
      description="That page is out of scope."
      action={<Button onClick={() => navigate("/")}>Back to contracts</Button>}
    />
  );
}
