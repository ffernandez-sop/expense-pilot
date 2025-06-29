// use server'
'use server';

/**
 * @fileOverview Automatically categorizes expenses based on a description provided by the user.
 *
 * - autoCategorizeExpense - A function that handles the expense categorization process.
 * - AutoCategorizeExpenseInput - The input type for the autoCategorizeExpense function.
 * - AutoCategorizeExpenseOutput - The return type for the autoCategorizeExpense function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoCategorizeExpenseInputSchema = z.object({
  description: z
    .string()
    .describe('The description of the expense to categorize.'),
});
export type AutoCategorizeExpenseInput = z.infer<typeof AutoCategorizeExpenseInputSchema>;

const AutoCategorizeExpenseOutputSchema = z.object({
  category: z
    .string()
    .describe(
      'The predicted category of the expense (e.g., Food, Transport, Rent, Utilities, Entertainment).' // Categories from the original prompt.
    ),
  confidence: z
    .number()
    .describe(
      'A confidence score (0 to 1) indicating the certainty of the category prediction.'
    ),
});
export type AutoCategorizeExpenseOutput = z.infer<typeof AutoCategorizeExpenseOutputSchema>;

export async function autoCategorizeExpense(
  input: AutoCategorizeExpenseInput
): Promise<AutoCategorizeExpenseOutput> {
  return autoCategorizeExpenseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'autoCategorizeExpensePrompt',
  input: {schema: AutoCategorizeExpenseInputSchema},
  output: {schema: AutoCategorizeExpenseOutputSchema},
  prompt: `You are an expert personal finance assistant.  Your job is to categorize expenses based on the description provided by the user.

  Given the following description, determine the most likely expense category and a confidence score.

  Description: {{{description}}}

  Categories to choose from: Food, Transport, Rent, Utilities, Entertainment

  Ensure that the category field contains ONLY a value from the list of acceptable categories.  Output the category and a confidence score between 0 and 1.
  `,
});

const autoCategorizeExpenseFlow = ai.defineFlow(
  {
    name: 'autoCategorizeExpenseFlow',
    inputSchema: AutoCategorizeExpenseInputSchema,
    outputSchema: AutoCategorizeExpenseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
