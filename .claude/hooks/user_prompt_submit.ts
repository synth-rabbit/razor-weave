import { userPromptSubmit } from '@razorweave/tooling/hooks/claude'
export default async function(prompt: string) {
  return await userPromptSubmit(prompt)
}