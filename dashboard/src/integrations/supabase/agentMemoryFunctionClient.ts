import { getSupabaseClientConfig } from './supabaseClient';
import type { WritableAgentTable } from '../../sync/syncTypes';

export type AgentMemoryWriteMode = 'disabled' | 'configured' | 'missing_token' | 'missing_supabase_env';

export interface AgentMemoryFunctionConfig {
  enabled: boolean;
  functionName: string;
  mode: AgentMemoryWriteMode;
}

export interface AgentMemoryFunctionResult {
  ok: boolean;
  inserted?: number;
  ids?: string[];
  error?: string;
}

export function getAgentMemoryFunctionConfig(): AgentMemoryFunctionConfig {
  const enabled = import.meta.env.VITE_AGENT_MEMORY_WRITE_ENABLED === 'true';
  const functionName = import.meta.env.VITE_AGENT_MEMORY_WRITE_FUNCTION || 'agent-memory-write';
  const token = import.meta.env.VITE_AGENT_MEMORY_WRITE_TOKEN || '';
  const supabaseConfig = getSupabaseClientConfig();

  if (!enabled) {
    return { enabled, functionName, mode: 'disabled' };
  }
  if (!supabaseConfig) {
    return { enabled, functionName, mode: 'missing_supabase_env' };
  }
  if (!token) {
    return { enabled, functionName, mode: 'missing_token' };
  }
  return { enabled, functionName, mode: 'configured' };
}

export async function writeAgentMemoryRecord(input: {
  table: WritableAgentTable;
  record: Record<string, unknown>;
  requestId: string;
}): Promise<AgentMemoryFunctionResult> {
  const supabaseConfig = getSupabaseClientConfig();
  const functionConfig = getAgentMemoryFunctionConfig();
  const token = import.meta.env.VITE_AGENT_MEMORY_WRITE_TOKEN || '';

  if (functionConfig.mode !== 'configured' || !supabaseConfig || !token) {
    return { ok: false, error: `function_${functionConfig.mode}` };
  }

  try {
    const response = await fetch(`${supabaseConfig.url}/functions/v1/${functionConfig.functionName}`, {
      method: 'POST',
      headers: {
        apikey: supabaseConfig.key,
        authorization: `Bearer ${supabaseConfig.key}`,
        'content-type': 'application/json',
        'x-agent-memory-write-token': token,
      },
      body: JSON.stringify({
        table: input.table,
        request_id: input.requestId,
        records: [input.record],
      }),
    });
    const body = (await response.json().catch(() => null)) as AgentMemoryFunctionResult | null;
    if (!response.ok || !body?.ok) {
      return { ok: false, error: sanitizeFunctionError(body?.error ?? `function_http_${response.status}`) };
    }
    return {
      ok: true,
      inserted: body.inserted,
      ids: body.ids,
    };
  } catch {
    return { ok: false, error: 'function_unreachable' };
  }
}

function sanitizeFunctionError(error: string): string {
  return error.replace(/https?:\/\/[^\s]+/g, '[url]').slice(0, 180);
}
