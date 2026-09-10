export interface ScenarioInput {
  baselineRevenue: number;
  baselineExpenses: number;
  revenueChangePercent: number;
  expenseChangePercent: number;
}

export interface ScenarioResult {
  revenue: number;
  expenses: number;
  netProfit: number;
  netProfitMargin: number | null;
  netProfitChange: number;
}

/** A pure "what-if" calculator — never persisted, recomputed live as the user adjusts sliders. */
export function applyScenario(input: ScenarioInput): ScenarioResult {
  const revenue = input.baselineRevenue * (1 + input.revenueChangePercent / 100);
  const expenses = input.baselineExpenses * (1 + input.expenseChangePercent / 100);
  const netProfit = revenue - expenses;
  const baselineNetProfit = input.baselineRevenue - input.baselineExpenses;

  return {
    revenue,
    expenses,
    netProfit,
    netProfitMargin: revenue > 0.005 ? (netProfit / revenue) * 100 : null,
    netProfitChange: netProfit - baselineNetProfit,
  };
}
