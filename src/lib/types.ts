import type { LucideIcon } from "lucide-react";

export type Expense = {
  id: string;
  name: string;
  category: "Food" | "Transport" | "Rent" | "Utilities" | "Entertainment" | "Other";
  amount: number;
  date: Date;
};

export type Category = {
  value: "Food" | "Transport" | "Rent" | "Utilities" | "Entertainment" | "Other";
  label: string;
  icon: LucideIcon;
};

// This type is copied from the AI flow to be used on the client-side.
export type PersonalizedExpenseRecommendationsOutput = {
  recommendations: {
      category: string;
      recommendation: string;
      potentialSavings?: number;
  }[];
  summary: string;
};
