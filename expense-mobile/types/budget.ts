export interface Budget {
  id: number;
  name: string;
  wallet_id: number | null;
  category_id: number | null;
  amount: number;
  is_show: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetWithSpent extends Budget {
  wallet_name: string | null;
  wallet_currency_code: string | null;
  category_name_key: string | null;
  category_icon: string | null;
  category_color: string | null;
  spent: number;
}
