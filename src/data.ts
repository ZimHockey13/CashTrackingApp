import {
  IncomeSource,
  ExpenseNode,
  NetWorthItem,
  NetWorthHistory,
  FinancialGoal,
  BudgetPreferences
} from "./types";

export const INITIAL_INCOME: IncomeSource[] = [
  {
    id: "inc-1",
    source: "Primary Salary",
    amount: 5200,
    type: "Primary",
    isRecurring: true
  },
  {
    id: "inc-2",
    source: "Consulting Gig",
    amount: 950,
    type: "Freelance",
    isRecurring: false
  },
  {
    id: "inc-3",
    source: "Dividend Portfolio",
    amount: 150,
    type: "Passive",
    isRecurring: true
  }
];

export const INITIAL_EXPENSES: ExpenseNode[] = [
  {
    id: "exp-1",
    category: "Housing",
    item: "Apartment Rental",
    amount: 1750,
    type: "Fixed",
    date: "2026-06-01"
  },
  {
    id: "exp-2",
    category: "Groceries",
    item: "Trader Joe's & Whole Foods",
    amount: 520,
    type: "Variable",
    date: "2026-06-03"
  },
  {
    id: "exp-3",
    category: "Utilities",
    item: "Electric & High-Speed Internet",
    amount: 180,
    type: "Fixed",
    date: "2026-06-02"
  },
  {
    id: "exp-4",
    category: "Transport",
    item: "Metropolitan Rail Pass & Gas",
    amount: 220,
    type: "Variable",
    date: "2026-06-05"
  },
  {
    id: "exp-5",
    category: "Healthcare",
    item: "Monthly Health Premium",
    amount: 240,
    type: "Fixed",
    date: "2026-06-01"
  },
  {
    id: "exp-6",
    category: "Leisure & Dining",
    item: "Bistro Dinners & Pubs",
    amount: 340,
    type: "Variable",
    date: "2026-06-06"
  },
  {
    id: "exp-7",
    category: "Subscriptions",
    item: "Streaming, Gym & Software",
    amount: 90,
    type: "Fixed",
    date: "2026-06-04"
  },
  {
    id: "exp-8",
    category: "Savings & Investments",
    item: "S&P 500 Index Fund Purchase",
    amount: 1000,
    type: "Fixed",
    date: "2026-06-01"
  },
  {
    id: "exp-9",
    category: "Shopping",
    item: "Summer Apparel",
    amount: 150,
    type: "Variable",
    date: "2026-06-08"
  }
];

export const INITIAL_NET_WORTH: NetWorthItem[] = [
  // Current / Active entries (June 2026)
  {
    id: "nw-a1",
    type: "Asset",
    category: "Cash & Cash Equivalents",
    label: "Chase Savings & checking",
    value: 8500,
    date: "2026-06-18"
  },
  {
    id: "nw-a2",
    type: "Asset",
    category: "Investment Accounts",
    label: "Vanguard Brokerage Portfolio",
    value: 29500,
    date: "2026-06-18"
  },
  {
    id: "nw-a3",
    type: "Asset",
    category: "Vehicles",
    label: "Private Used Utility Car",
    value: 12000,
    date: "2026-06-18"
  },
  {
    id: "nw-l1",
    type: "Liability",
    category: "Credit Card Balances",
    label: "Amex Statement balance",
    value: 1400,
    date: "2026-06-18"
  },
  {
    id: "nw-l2",
    type: "Liability",
    category: "Student Loans",
    label: "Federal Student Debt Portfolio",
    value: 14500,
    date: "2026-06-18"
  },

  // Historical archives (May 2026)
  {
    id: "nw-h-a1-may",
    type: "Asset",
    category: "Cash & Cash Equivalents",
    label: "Chase Savings & checking",
    value: 7200,
    date: "2026-05-15"
  },
  {
    id: "nw-h-a2-may",
    type: "Asset",
    category: "Investment Accounts",
    label: "Vanguard Brokerage Portfolio",
    value: 28300,
    date: "2026-05-15"
  },
  {
    id: "nw-h-a3-may",
    type: "Asset",
    category: "Vehicles",
    label: "Private Used Utility Car",
    value: 12000,
    date: "2026-05-15"
  },
  {
    id: "nw-h-l1-may",
    type: "Liability",
    category: "Credit Card Balances",
    label: "Amex Statement balance",
    value: 1700,
    date: "2026-05-15"
  },
  {
    id: "nw-h-l2-may",
    type: "Liability",
    category: "Student Loans",
    label: "Federal Student Debt Portfolio",
    value: 14800,
    date: "2026-05-15"
  },

  // Historical archives (April 2026)
  {
    id: "nw-h-a1-apr",
    type: "Asset",
    category: "Cash & Cash Equivalents",
    label: "Chase Savings & checking",
    value: 6000,
    date: "2026-04-15"
  },
  {
    id: "nw-h-a2-apr",
    type: "Asset",
    category: "Investment Accounts",
    label: "Vanguard Brokerage Portfolio",
    value: 26900,
    date: "2026-04-15"
  },
  {
    id: "nw-h-a3-apr",
    type: "Asset",
    category: "Vehicles",
    label: "Private Used Utility Car",
    value: 12000,
    date: "2026-04-15"
  },
  {
    id: "nw-h-l1-apr",
    type: "Liability",
    category: "Credit Card Balances",
    label: "Amex Statement balance",
    value: 2100,
    date: "2026-04-15"
  },
  {
    id: "nw-h-l2-apr",
    type: "Liability",
    category: "Student Loans",
    label: "Federal Student Debt Portfolio",
    value: 14800,
    date: "2026-04-15"
  },

  // Historical archives (March 2026)
  {
    id: "nw-h-a1-mar",
    type: "Asset",
    category: "Cash & Cash Equivalents",
    label: "Chase Savings & checking",
    value: 4500,
    date: "2026-03-15"
  },
  {
    id: "nw-h-a2-mar",
    type: "Asset",
    category: "Investment Accounts",
    label: "Vanguard Brokerage Portfolio",
    value: 25600,
    date: "2026-03-15"
  },
  {
    id: "nw-h-a3-mar",
    type: "Asset",
    category: "Vehicles",
    label: "Private Used Utility Car",
    value: 12000,
    date: "2026-03-15"
  },
  {
    id: "nw-h-l1-mar",
    type: "Liability",
    category: "Credit Card Balances",
    label: "Amex Statement balance",
    value: 1900,
    date: "2026-03-15"
  },
  {
    id: "nw-h-l2-mar",
    type: "Liability",
    category: "Student Loans",
    label: "Federal Student Debt Portfolio",
    value: 15300,
    date: "2026-03-15"
  },

  // Historical archives (February 2026)
  {
    id: "nw-h-a1-feb",
    type: "Asset",
    category: "Cash & Cash Equivalents",
    label: "Chase Savings & checking",
    value: 3000,
    date: "2026-02-15"
  },
  {
    id: "nw-h-a2-feb",
    type: "Asset",
    category: "Investment Accounts",
    label: "Vanguard Brokerage Portfolio",
    value: 22500,
    date: "2026-02-15"
  },
  {
    id: "nw-h-a3-feb",
    type: "Asset",
    category: "Vehicles",
    label: "Private Used Utility Car",
    value: 15000,
    date: "2026-02-15"
  },
  {
    id: "nw-h-l1-feb",
    type: "Liability",
    category: "Credit Card Balances",
    label: "Amex Statement balance",
    value: 2400,
    date: "2026-02-15"
  },
  {
    id: "nw-h-l2-feb",
    type: "Liability",
    category: "Student Loans",
    label: "Federal Student Debt Portfolio",
    value: 16000,
    date: "2026-02-15"
  },

  // Historical archives (January 2026)
  {
    id: "nw-h-a1-jan",
    type: "Asset",
    category: "Cash & Cash Equivalents",
    label: "Chase Savings & checking",
    value: 2000,
    date: "2026-01-15"
  },
  {
    id: "nw-h-a2-jan",
    type: "Asset",
    category: "Investment Accounts",
    label: "Vanguard Brokerage Portfolio",
    value: 21000,
    date: "2026-01-15"
  },
  {
    id: "nw-h-a3-jan",
    type: "Asset",
    category: "Vehicles",
    label: "Private Used Utility Car",
    value: 15000,
    date: "2026-01-15"
  },
  {
    id: "nw-h-l1-jan",
    type: "Liability",
    category: "Credit Card Balances",
    label: "Amex Statement balance",
    value: 3000,
    date: "2026-01-15"
  },
  {
    id: "nw-h-l2-jan",
    type: "Liability",
    category: "Student Loans",
    label: "Federal Student Debt Portfolio",
    value: 16500,
    date: "2026-01-15"
  }
];

export const INITIAL_HISTORY: NetWorthHistory[] = [
  { month: "Jan", assets: 38000, liabilities: 19500 },
  { month: "Feb", assets: 40500, liabilities: 18400 },
  { month: "Mar", assets: 42100, liabilities: 17200 },
  { month: "Apr", assets: 44900, liabilities: 16900 },
  { month: "May", assets: 47500, liabilities: 16500 },
  { month: "Jun", assets: 50000, liabilities: 15900 }
];

export const INITIAL_GOALS: FinancialGoal[] = [
  {
    id: "goal-1",
    name: "Emergency Fund Core reserves",
    targetAmount: 15000,
    currentAmount: 8500,
    category: "Emergency Fund",
    dueDate: "2026-12-31"
  },
  {
    id: "goal-2",
    name: "Down Payment For Investment Housing",
    targetAmount: 50000,
    currentAmount: 29500,
    category: "Property",
    dueDate: "2027-08-31"
  }
];

export const DEFAULT_PREFERENCES: BudgetPreferences = {
  currencySymbol: "$",
  currencyCode: "USD",
  enableAlerts: true,
  savingsRatioGoalPercentage: 20
};
