import { beforeToolCall } from '@razorweave/tooling/hooks/claude'
export default async function(tool: string, args: unknown) {
  return await beforeToolCall(tool, args)
}