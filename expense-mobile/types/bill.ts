export interface Bill {
  id: number;
  name: string;
  amount: number;
  day_of_month: number;
  wallet_id: number;
  category_id: number | null;
  auto_charge: boolean;
  is_active: boolean;
  last_charged_period: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillWithDetails extends Bill {
  wallet_name: string;
  wallet_currency_code: string;
  category_name_key: string | null;
  category_icon: string | null;
  category_color: string | null;
}
