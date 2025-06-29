"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ChevronsUpDown,
  Download,
  Plus,
  Calendar as CalendarIcon,
  Home,
  Car,
  Utensils,
  Bolt,
  Film,
  CircleDollarSign,
  Receipt,
  PiggyBank
} from "lucide-react";
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell } from "recharts";
import { format } from "date-fns";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ChartContainer,
  ChartTooltip as ChartTooltipShadcn,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { Expense, Category, PersonalizedExpenseRecommendationsOutput, Income } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { autoCategorizeExpense } from "@/ai/flows/categorize-expense";
import { getPersonalizedExpenseRecommendations } from "@/ai/flows/personalized-recommendations";

const categories: Category[] = [
  { value: "Food", label: "Food", icon: Utensils },
  { value: "Transport", label: "Transport", icon: Car },
  { value: "Rent", label: "Rent", icon: Home },
  { value: "Utilities", label: "Utilities", icon: Bolt },
  { value: "Entertainment", label: "Entertainment", icon: Film },
  { value: "Other", label: "Other", icon: CircleDollarSign },
];

const expenseFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  category: z.enum(categories.map(c => c.value) as [string, ...string[]], {
    required_error: "Please select a category.",
  }),
  amount: z.coerce.number().positive("Amount must be a positive number."),
  date: z.date({
    required_error: "A date is required.",
  }),
});

const incomeFormSchema = z.object({
  source: z.string().min(2, "Source must be at least 2 characters."),
  amount: z.coerce.number().positive("Amount must be a positive number."),
  date: z.date({
    required_error: "A date is required.",
  }),
});

export function ExpenseDashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [filterCategory, setFilterCategory] = useState<Category["value"] | "all">("all");
  const { toast } = useToast();

  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false);
  const [incomeSheetOpen, setIncomeSheetOpen] = useState(false);

  const expenseForm = useForm<z.infer<typeof expenseFormSchema>>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      name: "",
      amount: undefined,
      date: new Date(),
    },
  });
  
  const incomeForm = useForm<z.infer<typeof incomeFormSchema>>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      source: "",
      amount: undefined,
      date: new Date(),
    },
  });

  const [isCategorizing, setIsCategorizing] = useState(false);

  const handleAutoCategorize = async () => {
    const description = expenseForm.getValues("name");
    if (!description) {
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: "Please enter a description for the expense first.",
      });
      return;
    }
    setIsCategorizing(true);
    try {
      const result = await autoCategorizeExpense({ description });
      const validCategory = categories.find(c => c.value.toLowerCase() === result.category.toLowerCase());
      if (validCategory) {
        expenseForm.setValue("category", validCategory.value);
        toast({
          title: "Success!",
          description: `Expense categorized as ${result.category} with ${Math.round(result.confidence * 100)}% confidence.`,
        });
      } else {
        expenseForm.setValue("category", "Other");
         toast({
          title: "Suggestion: Other",
          description: `We weren't sure, so we've suggested "Other". The AI suggested "${result.category}".`,
        });
      }
    } catch (error) {
      console.error("AI categorization failed:", error);
      toast({
        variant: "destructive",
        title: "Categorization Failed",
        description: "The AI could not categorize the expense. Please select a category manually.",
      });
    } finally {
      setIsCategorizing(false);
    }
  };


  useEffect(() => {
    // On initial load, create some mock data
    const mockExpenses: Expense[] = [
        { id: "1", name: "Groceries", category: "Food", amount: 75.50, date: new Date(2024, 5, 2) },
        { id: "2", name: "Gasoline", category: "Transport", amount: 40.00, date: new Date(2024, 5, 5) },
        { id: "3", name: "Monthly Rent", category: "Rent", amount: 1200.00, date: new Date(2024, 5, 1) },
        { id: "4", name: "Electricity Bill", category: "Utilities", amount: 65.20, date: new Date(2024, 5, 10) },
        { id: "5", name: "Movie Tickets", category: "Entertainment", amount: 25.00, date: new Date(2024, 5, 12) },
        { id: "6", name: "Dinner Out", category: "Food", amount: 55.00, date: new Date(2024, 5, 15) },
        { id: "7", name: "Internet Bill", category: "Utilities", amount: 50.00, date: new Date(2024, 5, 20) },
      ];
      setExpenses(mockExpenses);

      const mockIncomes: Income[] = [
        { id: "income-1", source: "Salary", amount: 5000, date: new Date(2024, 5, 1) },
      ];
      setIncomes(mockIncomes);
  }, []);

  const onExpenseSubmit = (values: z.infer<typeof expenseFormSchema>) => {
    const newExpense: Expense = {
      id: new Date().toISOString(),
      ...values,
    };
    setExpenses(prev => [newExpense, ...prev]);
    toast({
      title: "Expense Added",
      description: `${values.name} for $${values.amount} has been added.`,
    });
    expenseForm.reset();
    setExpenseSheetOpen(false);
  };

  const onIncomeSubmit = (values: z.infer<typeof incomeFormSchema>) => {
    const newIncome: Income = {
      id: new Date().toISOString(),
      ...values,
    };
    setIncomes(prev => [newIncome, ...prev]);
    toast({
      title: "Income Added",
      description: `Income from ${values.source} for $${values.amount} has been added.`,
    });
    incomeForm.reset({ source: "", amount: undefined, date: new Date() });
    setIncomeSheetOpen(false);
  };

  const totalExpenses = useMemo(() => expenses.reduce((sum, expense) => sum + expense.amount, 0), [expenses]);
  const totalIncome = useMemo(() => incomes.reduce((sum, income) => sum + income.amount, 0), [incomes]);
  const balance = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  const filteredExpenses = useMemo(() => {
    if (filterCategory === "all") return expenses;
    return expenses.filter(expense => expense.category === filterCategory);
  }, [expenses, filterCategory]);

  const chartData = useMemo(() => {
    return categories.map(category => ({
      name: category.label,
      value: expenses
        .filter(e => e.category === category.value)
        .reduce((sum, e) => sum + e.amount, 0),
    })).filter(item => item.value > 0);
  }, [expenses]);
  
  const chartColors = ["#3b82f6", "#ffb347", "#10b981", "#8b5cf6", "#ec4899", "#f97316"];

  const chartConfig = {
    expenses: {
      label: "Expenses",
    },
    ...Object.fromEntries(categories.map((cat, i) => [cat.value, { label: cat.label, color: chartColors[i % chartColors.length] }]))
  };


  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <div className="flex items-center gap-2">
            <Icons.logo className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-semibold font-headline">ExpensePilot</h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Sheet open={incomeSheetOpen} onOpenChange={setIncomeSheetOpen}>
            <SheetTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 gap-1">
                <Plus className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Income</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <Form {...incomeForm}>
                <form onSubmit={incomeForm.handleSubmit(onIncomeSubmit)} className="flex flex-col h-full">
                  <SheetHeader>
                    <SheetTitle>Add New Income</SheetTitle>
                    <SheetDescription>
                      Fill in the details for your new income source.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex-1 py-4 space-y-4 overflow-y-auto">
                    <FormField
                      control={incomeForm.control}
                      name="source"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Income Source</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Salary, Freelance" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={incomeForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={incomeForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <SheetFooter>
                    <SheetClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </SheetClose>
                    <Button type="submit">Save Income</Button>
                  </SheetFooter>
                </form>
              </Form>
            </SheetContent>
          </Sheet>

          <Sheet open={expenseSheetOpen} onOpenChange={setExpenseSheetOpen}>
            <SheetTrigger asChild>
              <Button size="sm" className="h-8 gap-1">
                <Plus className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Expense</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <Form {...expenseForm}>
                <form onSubmit={expenseForm.handleSubmit(onExpenseSubmit)} className="flex flex-col h-full">
                  <SheetHeader>
                    <SheetTitle>Add a New Expense</SheetTitle>
                    <SheetDescription>
                      Fill in the details of your expense. Click save when you&apos;re done.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex-1 py-4 space-y-4 overflow-y-auto">
                    <FormField
                      control={expenseForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expense Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Coffee with friends" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={expenseForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <div className="flex items-center gap-2">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button type="button" variant="outline" onClick={handleAutoCategorize} disabled={isCategorizing}>
                            {isCategorizing ? "..." : "AI"}
                          </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={expenseForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={expenseForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <SheetFooter>
                    <SheetClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </SheetClose>
                    <Button type="submit">Save Expense</Button>
                  </SheetFooter>
                </form>
              </Form>
            </SheetContent>
          </Sheet>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Download className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast({description: "Export to CSV coming soon!"})}>Export to CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast({description: "Export to PDF coming soon!"})}>Export to PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">${totalIncome.toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              <p className="text-xs text-muted-foreground">Your income for this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">${totalExpenses.toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              <p className="text-xs text-muted-foreground">Your expenses for this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
              <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">${balance.toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              <p className="text-xs text-muted-foreground">Your remaining balance</p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="font-headline">Expense Distribution</CardTitle>
              <CardDescription>A visual breakdown of your spending by category.</CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
                <PieChart>
                  <ChartTooltipShadcn content={<ChartTooltipContent nameKey="name" hideLabel />} />
                  <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}>
                     {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <AIInsights expenses={expenses} income={totalIncome} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Recent Expenses</CardTitle>
            <div className="flex items-center gap-2">
              <CardDescription>View and manage your recent transactions.</CardDescription>
               <Select value={filterCategory} onValueChange={(value) => setFilterCategory(value as Category["value"] | "all")}>
                <SelectTrigger className="w-auto h-8 ml-auto">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map(expense => {
                    const CategoryIcon = categories.find(c => c.value === expense.category)?.icon || CircleDollarSign;
                    return (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expense.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                            {expense.category}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">${expense.amount.toFixed(2)}</TableCell>
                        <TableCell className="hidden md:table-cell">{format(expense.date, 'PPP')}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">No expenses found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function AIInsights({ expenses, income }: { expenses: Expense[], income: number }) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<PersonalizedExpenseRecommendationsOutput | null>(null);
  const { toast } = useToast();

  const handleGetInsights = async () => {
    setLoading(true);
    setInsights(null);
    try {
      const formattedExpenses = expenses.map(e => ({
        ...e,
        date: format(e.date, 'yyyy-MM-dd')
      }));
      const result = await getPersonalizedExpenseRecommendations({
        monthlyIncome: income,
        expenses: formattedExpenses,
        financialGoals: "Save for a vacation and reduce unnecessary spending.",
      });
      setInsights(result);
    } catch (error) {
      console.error("AI insights failed:", error);
      toast({
        variant: "destructive",
        title: "Failed to get insights",
        description: "The AI could not generate recommendations at this time.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">AI-Powered Insights</CardTitle>
        <CardDescription>
          Get personalized recommendations to improve your financial health.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!insights && (
          <Button onClick={handleGetInsights} disabled={loading || expenses.length === 0}>
            {loading ? <><ChevronsUpDown className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : "Get Recommendations"}
          </Button>
        )}
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        )}
        {insights && (
          <div className="space-y-4">
             <Card className="bg-primary/10 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/80">{insights.summary}</p>
              </CardContent>
            </Card>

            <Accordion type="single" collapsible className="w-full">
              {insights.recommendations.map((rec, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="font-medium hover:no-underline">
                    {rec.category}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>{rec.recommendation}</p>
                    {rec.potentialSavings && (
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        Potential Savings: ${rec.potentialSavings.toFixed(2)}
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            
            <Button variant="outline" onClick={handleGetInsights} disabled={loading}>
              {loading ? "..." : "Regenerate"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
