// use server'
'use server';

/**
 * @fileOverview Categoriza automáticamente los gastos basándose en una descripción proporcionada por el usuario.
 *
 * - autoCategorizeExpense - Una función que maneja el proceso de categorización de gastos.
 * - AutoCategorizeExpenseInput - El tipo de entrada para la función autoCategorizeExpense.
 * - AutoCategorizeExpenseOutput - El tipo de retorno para la función autoCategorizeExpense.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoCategorizeExpenseInputSchema = z.object({
  description: z
    .string()
    .describe('La descripción del gasto a categorizar.'),
});
export type AutoCategorizeExpenseInput = z.infer<typeof AutoCategorizeExpenseInputSchema>;

const AutoCategorizeExpenseOutputSchema = z.object({
  category: z
    .string()
    .describe(
      'La categoría predicha del gasto (e.g., Comida, Transporte, Alquiler, Servicios, Entretenimiento, Otro).'
    ),
  confidence: z
    .number()
    .describe(
      'Un puntaje de confianza (0 a 1) que indica la certeza de la predicción de la categoría.'
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
  prompt: `Eres un asistente experto en finanzas personales. Tu trabajo es categorizar los gastos basándose en la descripción proporcionada por el usuario.

  Dada la siguiente descripción, determina la categoría de gasto más probable y un puntaje de confianza.

  Descripción: {{{description}}}

  Categorías para elegir: Comida, Transporte, Alquiler, Servicios, Entretenimiento, Otro

  Asegúrate de que el campo de categoría contenga SOLAMENTE un valor de la lista de categorías aceptables. Emite la categoría y un puntaje de confianza entre 0 y 1.
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
