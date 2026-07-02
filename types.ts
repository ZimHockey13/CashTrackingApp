/**
 * Type declarations for the Personal Finance Budgeting App
 */

export interface IncomeSource {
  id: string;
  source: string;
  amount: number;
  type: "Primary" | "Secondary" | "Passive" | "Freelance" | "Other";
  isRecurring: boolean;
}

export type ExpenseCategory = string;

export interface ExpenseNode {
  id: string;
  category: ExpenseCategory;
  item: string;
  amount: number;
  type: "Fixed" | "Variable";
  date: string;
  isSavings?: boolean;
}

export type NetWorthType = "Asset" | "Liability";

export type AssetCategory =
  | "Cash & Cash Equivalents"
  | "Investment Accounts"
  | "Real Estate"
  | "Vehicles"
  | "Retirement Accounts"
  | "Other Assets";

export type LiabilityCategory =
  | "Credit Card Balances"
  | "Student Loans"
  | "Auto Loans"
  | "Mortgages"
  | "Personal Loans"
  | "Other Liabilities";

export interface NetWorthItem {
  id: string;
  type: NetWorthType;
  category: AssetCategory | LiabilityCategory;
  label: string;
  value: number;
  date: string; // "YYYY-MM-DD" style
}

export interface NetWorthHistory {
  month: string; // "Jan", "Feb", etc.
  assets: number;
  liabilities: number;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  category: "Emergency Fund" | "Retirement" | "Property" | "Investment" | "Vacation" | "Other";
  dueDate: string;
}

export interface BudgetPreferences {
  currencySymbol: string;
  currencyCode: string;
  enableAlerts: boolean;
  savingsRatioGoalPercentage: number; // e.g. 20%
}

export interface AIInsight {
  title: string;
  category: "Savings" | "Expense Budgeting" | "Income Growth" | "Net Worth Strategy" | "Debt Management";
  description: string;
  impact: "High" | "Medium" | "Low";
}

export interface PortfolioItem {
  id: string;
  accountNumber?: string;
  accountName: string;
  symbol: string;
  description: string;
  quantity?: number;
  lastPrice?: number;
  currentValue: number;
  totalGainLossDollar?: number;
  totalGainLossPercent?: number;
  customCategory: string; // "Dividend ETFs", "Gold", "Crypto", "Cash", "Real Estate", "Collectibles" etc.
  type?: string;
  isManual?: boolean;
}

