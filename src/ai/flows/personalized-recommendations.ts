// ExpensePilot: Personalized Expense Recommendations
// Provides personalized recommendations for users to reduce expenses based on their spending patterns.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input schema for personalized expense recommendations.
const PersonalizedExpenseRecommendationsInputSchema = z.object({
  monthlyIncome: z.number().describe("El ingreso mensual total del usuario."),
  expenses: z.array(
    z.object({
      name: z.string().describe("El nombre del gasto."),
      category: z.string().describe("La categoría del gasto (e.g., Food, Transport, Rent)."),
      amount: z.number().describe("El monto gastado en el gasto."),
      date: z.string().describe("La fecha del gasto (YYYY-MM-DD)."),
    })
  ).describe("Una lista de los gastos del usuario para el mes."),
  financialGoals: z.string().optional().describe("Los objetivos financieros del usuario."),
});
export type PersonalizedExpenseRecommendationsInput = z.infer<typeof PersonalizedExpenseRecommendationsInputSchema>;

// Output schema for personalized expense recommendations.
const PersonalizedExpenseRecommendationsOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      category: z.string().describe("La categoría de gasto a la que se aplica la recomendación."),
      recommendation: z.string().describe("Una recomendación específica para reducir gastos en esta categoría."),
      potentialSavings: z.number().optional().describe("El ahorro potencial de seguir esta recomendación."),
    })
  ).describe("Una lista de recomendaciones personalizadas para reducir gastos."),
  summary: z.string().describe("Un resumen de las recomendaciones y la salud financiera general."),
});
export type PersonalizedExpenseRecommendationsOutput = z.infer<typeof PersonalizedExpenseRecommendationsOutputSchema>;

// Function to get personalized expense recommendations.
export async function getPersonalizedExpenseRecommendations(
  input: PersonalizedExpenseRecommendationsInput
): Promise<PersonalizedExpenseRecommendationsOutput> {
  return personalizedExpenseRecommendationsFlow(input);
}

// Define the prompt for personalized expense recommendations.
const personalizedExpenseRecommendationsPrompt = ai.definePrompt({
  name: 'personalizedExpenseRecommendationsPrompt',
  input: {schema: PersonalizedExpenseRecommendationsInputSchema},
  output: {schema: PersonalizedExpenseRecommendationsOutputSchema},
  prompt: `Eres un asesor financiero de IA que ofrece recomendaciones personalizadas para reducir gastos.

  Analiza los ingresos mensuales, los gastos y los objetivos financieros del usuario para proporcionar recomendaciones prácticas.

  Ingreso Mensual: {{monthlyIncome}}
  Gastos:
  {{#each expenses}}
  - {{name}} ({{category}}): {{amount}} el {{date}}
  {{/each}}
  Objetivos Financieros: {{financialGoals}}

  Proporciona una lista de recomendaciones, cada una incluyendo la categoría, la recomendación específica y los ahorros potenciales.
  Además, incluye un resumen de las recomendaciones y la salud financiera general.
  `,
});

// Define the Genkit flow for personalized expense recommendations.
const personalizedExpenseRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedExpenseRecommendationsFlow',
    inputSchema: PersonalizedExpenseRecommendationsInputSchema,
    outputSchema: PersonalizedExpenseRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await personalizedExpenseRecommendationsPrompt(input);
    return output!;
  }
);
