// ExpensePilot: Personalized Expense Recommendations
// Provides personalized recommendations for users to reduce expenses based on their spending patterns.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input schema for personalized expense recommendations.
const PersonalizedExpenseRecommendationsInputSchema = z.object({
  monthlyIncome: z.number().describe('The user\'s total monthly income.'),
  expenses: z.array(
    z.object({
      name: z.string().describe('The name of the expense.'),
      category: z.string().describe('The category of the expense (e.g., Food, Transport, Rent).'),
      amount: z.number().describe('The amount spent on the expense.'),
      date: z.string().describe('The date of the expense (YYYY-MM-DD).'),
    })
  ).describe('A list of the user\'s expenses for the month.'),
  financialGoals: z.string().optional().describe('The user\'s financial goals.'),
});
export type PersonalizedExpenseRecommendationsInput = z.infer<typeof PersonalizedExpenseRecommendationsInputSchema>;

// Output schema for personalized expense recommendations.
const PersonalizedExpenseRecommendationsOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      category: z.string().describe('The expense category the recommendation applies to.'),
      recommendation: z.string().describe('A specific recommendation to reduce expenses in this category.'),
      potentialSavings: z.number().optional().describe('The potential savings from following this recommendation.'),
    })
  ).describe('A list of personalized recommendations for reducing expenses.'),
  summary: z.string().describe('A summary of the recommendations and overall financial health.'),
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
  prompt: `You are an AI financial advisor providing personalized recommendations to reduce expenses.

  Analyze the user's monthly income, expenses, and financial goals to provide actionable recommendations.

  Monthly Income: {{monthlyIncome}}
  Expenses:
  {{#each expenses}}
  - {{name}} ({{category}}): {{amount}} on {{date}}
  {{/each}}
  Financial Goals: {{financialGoals}}

  Provide a list of recommendations, each including the category, specific recommendation, and potential savings.
  Also, include a summary of the recommendations and overall financial health.
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
