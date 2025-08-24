import { providers } from "near-api-js";

const SOCIAL_CONTRACT = "social.near";
const RPC_URL = "https://free.rpc.fastnear.com"; // Using free fastnear RPC for social.near

const provider = new providers.JsonRpcProvider({ url: RPC_URL });

export async function socialGet({ keys, blockHeight }: { keys: string[], blockHeight?: bigint }): Promise<any> {
  try {
    const response = await (provider as any).query({
      request_type: "call_function",
      account_id: SOCIAL_CONTRACT,
      method_name: "get",
      args_base64: Buffer.from(JSON.stringify({ 
        keys,
        ...(blockHeight ? { block_height: blockHeight.toString() } : {})
      })).toString("base64"),
      finality: "final",
    });

    const result = JSON.parse(Buffer.from((response as any).result).toString());
    return result;
  } catch (error) {
    console.error("Error in socialGet:", error);
    return null;
  }
}

export async function socialIndex({ action, key, limit, accountId, order }: { 
  action: string, 
  key: string, 
  limit?: string | number,
  accountId?: string,
  order?: 'asc' | 'desc'
}): Promise<any> {
  try {
    const response = await (provider as any).query({
      request_type: "call_function",
      account_id: SOCIAL_CONTRACT,
      method_name: "index",
      args_base64: Buffer.from(
        JSON.stringify({
          action,
          key,
          options: {
            ...(limit ? { limit: Number(limit) } : {}),
            ...(accountId ? { accountId } : {}),
            ...(order ? { order } : {})
          }
        })
      ).toString("base64"),
      finality: "final",
    });

    const result = JSON.parse(Buffer.from((response as any).result).toString());
    return result;
  } catch (error) {
    console.error("Error in socialIndex:", error);
    return null;
  }
}

export async function socialSet(data: any): Promise<any> {
  try {
    const response = await (provider as any).query({
      request_type: "call_function",
      account_id: SOCIAL_CONTRACT,
      method_name: "set",
      args_base64: Buffer.from(JSON.stringify({ data })).toString("base64"),
      finality: "final",
    });

    const result = JSON.parse(Buffer.from((response as any).result).toString());
    return result;
  } catch (error) {
    console.error("Error in socialSet:", error);
    return null;
  }
} 