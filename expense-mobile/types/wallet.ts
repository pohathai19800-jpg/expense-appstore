export interface Wallet {
  id: number;
  name: string;
  currency_code: string;
  initial_balance: number;
  is_active: boolean;
  hide_amount: boolean;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}