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
import { es } from 'date-fns/locale';
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
  { value: "Food", label: "Comida", icon: Utensils },
  { value: "Transport", label: "Transporte", icon: Car },
  { value: "Rent", label: "Alquiler", icon: Home },
  { value: "Utilities", label: "Servicios", icon: Bolt },
  { value: "Entertainment", label: "Entretenimiento", icon: Film },
  { value: "Other", label: "Otro", icon: CircleDollarSign },
];

const incomeMonths = [
    { value: "all", label: "Todos los Meses" },
    { value: "0", label: "Enero" },
    { value: "1", label: "Febrero" },
    { value: "2", label: "Marzo" },
    { value: "3", label: "Abril" },
    { value: "4", label: "Mayo" },
    { value: "5", label: "Junio" },
    { value: "6", label: "Julio" },
    { value: "7", label: "Agosto" },
    { value: "8", label: "Septiembre" },
    { value: "9", label: "Octubre" },
    { value: "10", label: "Noviembre" },
    { value: "11", label: "Diciembre" },
];

const expenseFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  category: z.enum(categories.map(c => c.value) as [string, ...string[]], {
    required_error: "Por favor seleccione una categoría.",
  }),
  amount: z.coerce.number().positive("El monto debe ser un número positivo."),
  date: z.date({
    required_error: "Se requiere una fecha.",
  }),
});

const incomeFormSchema = z.object({
  source: z.string().min(2, "La fuente debe tener al menos 2 caracteres."),
  amount: z.coerce.number().positive("El monto debe ser un número positivo."),
  date: z.date({
    required_error: "Se requiere una fecha.",
  }),
});

export function ExpenseDashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  
  const [expenseFilterCategory, setExpenseFilterCategory] = useState<Category["value"] | "all">("all");
  const [expenseFilterYear, setExpenseFilterYear] = useState<string>("all");
  const [expenseFilterMonth, setExpenseFilterMonth] = useState<string>("all");

  const [incomeFilterYear, setIncomeFilterYear] = useState<string>("all");
  const [incomeFilterMonth, setIncomeFilterMonth] = useState<string>("all");
  
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
        title: "¡Oh no! Algo salió mal.",
        description: "Por favor, ingrese una descripción para el gasto primero.",
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
          title: "¡Éxito!",
          description: `Gasto categorizado como ${result.category} con ${Math.round(result.confidence * 100)}% de confianza.`,
        });
      } else {
        expenseForm.setValue("category", "Other");
         toast({
          title: "Sugerencia: Otro",
          description: `No estábamos seguros, así que hemos sugerido "Otro". La IA sugirió "${result.category}".`,
        });
      }
    } catch (error) {
      console.error("AI categorization failed:", error);
      toast({
        variant: "destructive",
        title: "Falló la Categorización",
        description: "La IA no pudo categorizar el gasto. Por favor, seleccione una categoría manualmente.",
      });
    } finally {
      setIsCategorizing(false);
    }
  };


  useEffect(() => {
    // On initial load, create some mock data
    const mockExpenses: Expense[] = [
        { id: "1", name: "Compras", category: "Food", amount: 75.50, date: new Date(2024, 5, 2) },
        { id: "2", name: "Gasolina", category: "Transport", amount: 40.00, date: new Date(2024, 5, 5) },
        { id: "3", name: "Alquiler Mensual", category: "Rent", amount: 1200.00, date: new Date(2024, 5, 1) },
        { id: "4", name: "Factura de Electricidad", category: "Utilities", amount: 65.20, date: new Date(2024, 5, 10) },
        { id: "5", name: "Entradas de cine", category: "Entertainment", amount: 25.00, date: new Date(2024, 5, 12) },
        { id: "6", name: "Cena fuera", category: "Food", amount: 55.00, date: new Date(2024, 5, 15) },
        { id: "7", name: "Factura de Internet", category: "Utilities", amount: 50.00, date: new Date(2024, 5, 20) },
      ];
      setExpenses(mockExpenses);

      const mockIncomes: Income[] = [
        { id: "income-1", source: "Salario", amount: 5000, date: new Date(2024, 5, 1) },
        { id: "income-2", source: "Freelance", amount: 750, date: new Date(2024, 4, 15) },
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
      title: "Gasto Agregado",
      description: `${values.name} por $${values.amount} ha sido agregado.`,
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
      title: "Ingreso Agregado",
      description: `Ingreso de ${values.source} por $${values.amount} ha sido agregado.`,
    });
    incomeForm.reset({ source: "", amount: undefined, date: new Date() });
    setIncomeSheetOpen(false);
  };
  
  const expenseYears = useMemo(() => {
    if (expenses.length === 0) return ["all"];
    const years = Array.from(new Set(expenses.map(e => e.date.getFullYear().toString()))).sort((a,b) => parseInt(b) - parseInt(a));
    return ["all", ...years];
  }, [expenses]);
  
  const incomeYears = useMemo(() => {
    if (incomes.length === 0) return ["all"];
    const years = Array.from(new Set(incomes.map(i => i.date.getFullYear().toString()))).sort((a,b) => parseInt(b) - parseInt(a));
    return ["all", ...years];
  }, [incomes]);

  const timeFilteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const yearMatch = expenseFilterYear === "all" || expense.date.getFullYear().toString() === expenseFilterYear;
      const monthMatch = expenseFilterMonth === "all" || expense.date.getMonth().toString() === expenseFilterMonth;
      return yearMatch && monthMatch;
    });
  }, [expenses, expenseFilterYear, expenseFilterMonth]);

  const tableFilteredExpenses = useMemo(() => {
    return timeFilteredExpenses.filter(expense => {
      const categoryMatch = expenseFilterCategory === "all" || expense.category === expenseFilterCategory;
      return categoryMatch;
    });
  }, [timeFilteredExpenses, expenseFilterCategory]);

  const filteredIncomes = useMemo(() => {
      return incomes.filter(income => {
          const yearMatch = incomeFilterYear === "all" || income.date.getFullYear().toString() === incomeFilterYear;
          const monthMatch = incomeFilterMonth === "all" || income.date.getMonth().toString() === incomeFilterMonth;
          return yearMatch && monthMatch;
      });
  }, [incomes, incomeFilterYear, incomeFilterMonth]);
  
  const totalExpenses = useMemo(() => timeFilteredExpenses.reduce((sum, expense) => sum + expense.amount, 0), [timeFilteredExpenses]);
  const totalIncome = useMemo(() => filteredIncomes.reduce((sum, income) => sum + income.amount, 0), [filteredIncomes]);
  const balance = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  const chartData = useMemo(() => {
    return categories.map(category => ({
      name: category.label,
      value: timeFilteredExpenses
        .filter(e => e.category === category.value)
        .reduce((sum, e) => sum + e.amount, 0),
    })).filter(item => item.value > 0);
  }, [timeFilteredExpenses]);
  
  const chartColors = ["#3b82f6", "#ffb347", "#10b981", "#8b5cf6", "#ec4899", "#f97316"];

  const chartConfig = {
    expenses: {
      label: "Gastos",
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
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Añadir Ingreso</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <Form {...incomeForm}>
                <form onSubmit={incomeForm.handleSubmit(onIncomeSubmit)} className="flex flex-col h-full">
                  <SheetHeader>
                    <SheetTitle>Añadir Nuevo Ingreso</SheetTitle>
                    <SheetDescription>
                      Complete los detalles de su nueva fuente de ingresos.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex-1 py-4 space-y-4 overflow-y-auto">
                    <FormField
                      control={incomeForm.control}
                      name="source"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fuente de Ingreso</FormLabel>
                          <FormControl>
                            <Input placeholder="ej. Salario, Freelance" {...field} />
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
                          <FormLabel>Monto</FormLabel>
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
                          <FormLabel>Fecha</FormLabel>
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
                                    format(field.value, "PPP", { locale: es })
                                  ) : (
                                    <span>Elija una fecha</span>
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
                                locale={es}
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
                      <Button variant="outline">Cancelar</Button>
                    </SheetClose>
                    <Button type="submit">Guardar Ingreso</Button>
                  </SheetFooter>
                </form>
              </Form>
            </SheetContent>
          </Sheet>

          <Sheet open={expenseSheetOpen} onOpenChange={setExpenseSheetOpen}>
            <SheetTrigger asChild>
              <Button size="sm" className="h-8 gap-1">
                <Plus className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Añadir Gasto</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <Form {...expenseForm}>
                <form onSubmit={expenseForm.handleSubmit(onExpenseSubmit)} className="flex flex-col h-full">
                  <SheetHeader>
                    <SheetTitle>Añadir un Nuevo Gasto</SheetTitle>
                    <SheetDescription>
                      Complete los detalles de su gasto. Haga clic en guardar cuando haya terminado.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex-1 py-4 space-y-4 overflow-y-auto">
                    <FormField
                      control={expenseForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Gasto</FormLabel>
                          <FormControl>
                            <Input placeholder="ej. Café con amigos" {...field} />
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
                          <FormLabel>Categoría</FormLabel>
                          <div className="flex items-center gap-2">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione una categoría" />
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
                          <FormLabel>Monto</FormLabel>
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
                          <FormLabel>Fecha</FormLabel>
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
                                    format(field.value, "PPP", { locale: es })
                                  ) : (
                                    <span>Elija una fecha</span>
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
                                locale={es}
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
                      <Button variant="outline">Cancelar</Button>
                    </SheetClose>
                    <Button type="submit">Guardar Gasto</Button>
                  </SheetFooter>
                </form>
              </Form>
            </SheetContent>
          </Sheet>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Download className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Exportar</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast({description: "¡Pronto se podrá exportar a CSV!"})}>Exportar a CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast({description: "¡Pronto se podrá exportar a PDF!"})}>Exportar a PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">${totalIncome.toLocaleString("es-ES", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              <p className="text-xs text-muted-foreground">Sus ingresos para el período seleccionado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">${totalExpenses.toLocaleString("es-ES", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              <p className="text-xs text-muted-foreground">Sus gastos para el período seleccionado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo</CardTitle>
              <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">${balance.toLocaleString("es-ES", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
              <p className="text-xs text-muted-foreground">Su saldo para el período seleccionado</p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="font-headline">Distribución de Gastos</CardTitle>
              <CardDescription>Un desglose visual de sus gastos por categoría para el período seleccionado.</CardDescription>
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
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
            <Card>
            <CardHeader>
                <CardTitle className="font-headline">Gastos Recientes</CardTitle>
                <div className="flex items-center gap-2">
                <CardDescription>Vea y gestione sus transacciones recientes.</CardDescription>
                <div className="flex items-center gap-2 ml-auto">
                    <Select value={expenseFilterYear} onValueChange={setExpenseFilterYear}>
                        <SelectTrigger className="w-auto h-8">
                            <SelectValue placeholder="Año" />
                        </SelectTrigger>
                        <SelectContent>
                            {expenseYears.map(year => (
                                <SelectItem key={year} value={year}>{year === 'all' ? 'Todos los Años' : year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={expenseFilterMonth} onValueChange={setExpenseFilterMonth}>
                        <SelectTrigger className="w-auto h-8">
                            <SelectValue placeholder="Mes" />
                        </SelectTrigger>
                        <SelectContent>
                            {incomeMonths.map(month => (
                                <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={expenseFilterCategory} onValueChange={(value) => setExpenseFilterCategory(value as Category["value"] | "all")}>
                        <SelectTrigger className="w-auto h-8">
                        <SelectValue placeholder="Filtrar por categoría" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="all">Todas las Categorías</SelectItem>
                        {categories.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="hidden md:table-cell">Fecha</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tableFilteredExpenses.length > 0 ? (
                    tableFilteredExpenses.map(expense => {
                        const CategoryIcon = categories.find(c => c.value === expense.category)?.icon || CircleDollarSign;
                        const categoryLabel = categories.find(c => c.value === expense.category)?.label || expense.category;
                        return (
                        <TableRow key={expense.id}>
                            <TableCell className="font-medium">{expense.name}</TableCell>
                            <TableCell>
                            <div className="flex items-center gap-2">
                                <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                                {categoryLabel}
                            </div>
                            </TableCell>
                            <TableCell className="text-right">${expense.amount.toFixed(2)}</TableCell>
                            <TableCell className="hidden md:table-cell">{format(expense.date, 'PPP', { locale: es })}</TableCell>
                        </TableRow>
                        );
                    })
                    ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">No se encontraron gastos para el período seleccionado.</TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Historial de Ingresos</CardTitle>
                    <div className="flex items-center gap-2">
                        <CardDescription>Filtre sus ingresos por mes y año.</CardDescription>
                        <div className="flex items-center gap-2 ml-auto">
                            <Select value={incomeFilterYear} onValueChange={setIncomeFilterYear}>
                                <SelectTrigger className="w-auto h-8">
                                    <SelectValue placeholder="Año" />
                                </SelectTrigger>
                                <SelectContent>
                                    {incomeYears.map(year => (
                                        <SelectItem key={year} value={year}>{year === 'all' ? 'Todos los Años' : year}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={incomeFilterMonth} onValueChange={setIncomeFilterMonth}>
                                <SelectTrigger className="w-auto h-8">
                                    <SelectValue placeholder="Mes" />
                                </SelectTrigger>
                                <SelectContent>
                                    {incomeMonths.map(month => (
                                        <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Fuente</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead className="hidden md:table-cell">Fecha</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredIncomes.length > 0 ? (
                        filteredIncomes.map(income => {
                            return (
                            <TableRow key={income.id}>
                                <TableCell className="font-medium">{income.source}</TableCell>
                                <TableCell className="text-right">${income.amount.toFixed(2)}</TableCell>
                                <TableCell className="hidden md:table-cell">{format(income.date, 'PPP', { locale: es })}</TableCell>
                            </TableRow>
                            );
                        })
                        ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center h-24">No se encontraron ingresos para el período seleccionado.</TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}

const categoryTranslations: { [key: string]: string } = {
  "Food": "Comida",
  "Transport": "Transporte",
  "Rent": "Alquiler",
  "Utilities": "Servicios",
  "Entertainment": "Entretenimiento",
  "Other": "Otro",
};

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
        financialGoals: "Ahorrar para unas vacaciones y reducir gastos innecesarios.",
      });
      setInsights(result);
    } catch (error) {
      console.error("AI insights failed:", error);
      toast({
        variant: "destructive",
        title: "No se pudieron obtener las perspectivas",
        description: "La IA no pudo generar recomendaciones en este momento.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Perspectivas con IA</CardTitle>
        <CardDescription>
          Obtenga recomendaciones personalizadas para mejorar su salud financiera.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!insights && (
          <Button onClick={handleGetInsights} disabled={loading || expenses.length === 0}>
            {loading ? <><ChevronsUpDown className="mr-2 h-4 w-4 animate-spin" /> Generando...</> : "Obtener Recomendaciones"}
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
                <CardTitle className="text-base font-medium">Resumen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/80">{insights.summary}</p>
              </CardContent>
            </Card>

            <Accordion type="single" collapsible className="w-full">
              {insights.recommendations.map((rec, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="font-medium hover:no-underline">
                    {categoryTranslations[rec.category] || rec.category}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p>{rec.recommendation}</p>
                    {rec.potentialSavings && (
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        Ahorro Potencial: ${rec.potentialSavings.toFixed(2)}
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            
            <Button variant="outline" onClick={handleGetInsights} disabled={loading}>
              {loading ? "..." : "Regenerar"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
