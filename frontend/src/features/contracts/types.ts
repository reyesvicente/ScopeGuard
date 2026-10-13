export interface Contract {
  slug: string;
  client_name: string;
  title: string;
  sow_text: string;
  hourly_rate: string;
  currency: string;
  check_count: number;
  out_of_scope_count: number;
  flagged_hours: string | null;
  flagged_value: string | null;
  created: string;
  modified: string;
}

export interface ContractInput {
  client_name: string;
  title: string;
  sow_text: string;
  hourly_rate: string;
  currency: string;
}
