export interface BudgetPlanItem {
  category_id: number;
  name_key: string | null;
  icon: string | null;
  color: string | null;
  percentage: number;
  spent: number;
}

export interface BudgetPlan {
  target_income: number;
  items: BudgetPlanItem[];
}
