import { afterToolCall } from '@razorweave/tooling/hooks/claude'
export default async function(tool: string, args: unknown, result: unknown) {
  return await afterToolCall(tool, args, result)
}