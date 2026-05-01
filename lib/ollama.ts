import { getAllAccountsDecrypted } from "./db";

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const MODEL = "llama3.1:latest";
const PASSWORD_REQUEST_PATTERN =
  /\b(password|passcode|credential|credentials|login secret|show secret)\b/i;

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

async function buildAccountsContext(query: string): Promise<string> {
  const accounts = await getAllAccountsDecrypted();
  if (accounts.length === 0) {
    return "No accounts stored yet.";
  }

  const queryLower = query.toLowerCase();
  const includePasswords = PASSWORD_REQUEST_PATTERN.test(query);
  const tokens = queryLower.split(/\s+/).filter((t) => t.length > 2);

  // Score accounts by relevance to the query
  const scored = accounts.map((acc) => {
    const searchStr =
      `${acc.name} ${acc.username} ${acc.email} ${acc.category} ${acc.url} ${acc.notes}`.toLowerCase();
    const score = tokens.reduce(
      (s, t) => s + (searchStr.includes(t) ? 1 : 0),
      0,
    );
    return { acc, score };
  });

  const relevant = scored.filter((s) => s.score > 0).map((s) => s.acc);
  const toInclude = relevant.length > 0 ? relevant : accounts;

  return toInclude
    .map(
      (acc) =>
        `Account: ${acc.name}
Category: ${acc.category}
Username/Login: ${acc.username}
Email: ${acc.email}
Password: ${
          includePasswords
            ? acc.decryptedPassword || "(not set)"
            : "(hidden unless explicitly requested)"
        }
Website URL: ${acc.url}
Notes: ${acc.notes || "(none)"}
Added: ${new Date(acc.createdAt).toLocaleDateString()}
---`,
    )
    .join("\n");
}

export async function chatWithOllama(
  messages: ChatMessage[],
): Promise<Response> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const query = lastUser?.content ?? "";

  const context = await buildAccountsContext(query);

  const systemPrompt = `You are a helpful personal account manager assistant. You have access to the user's account database below. Be concise and answer from the provided data. Do not reveal passwords unless the user explicitly asks for passwords or credentials in their latest request.

=== ACCOUNT DATABASE ===
${context}
=== END DATABASE ===

Today's date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

Always answer based on the account data above. If a password is hidden in the context, say that the user needs to ask for the password explicitly.`;

  const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
    }),
  });

  if (!ollamaResponse.ok) {
    throw new Error(
      `Ollama error: ${ollamaResponse.status} ${ollamaResponse.statusText}. Is Ollama running?`,
    );
  }

  return ollamaResponse;
}

export async function checkOllamaStatus(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
