import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function normalizeCondition(description: string): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 150,
    messages: [
      {
        role: "user",
        content: `You are a medical terminology expert helping connect families of children with similar conditions.

Convert the parent's description of their child's condition into the standard medical condition name.
Return ONLY the condition name (e.g. "Type 1 Diabetes", "Spinal Muscular Atrophy (SMA)", "Down Syndrome").
If you cannot determine a specific condition, return your best guess at the category (e.g. "Rare Genetic Condition").
Do not include any explanation, just the condition name.

Parent's description: "${description}"`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    return content.text.trim();
  }
  return "Unspecified Condition";
}
