import type { NextRequest } from "next/server";
import {
  chatWithOllama,
  checkOllamaStatus,
  type ChatMessage,
} from "@/lib/ollama";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const online = await checkOllamaStatus();
  return Response.json({ online, model: "llama3.1:latest" });
}

export async function POST(request: NextRequest) {
  const { messages } = (await request.json()) as { messages: ChatMessage[] };

  if (!messages || !Array.isArray(messages)) {
    return Response.json(
      { error: "messages array is required" },
      { status: 400 },
    );
  }

  try {
    const ollamaRes = await chatWithOllama(messages);
    // Pipe the Ollama stream directly to the client
    return new Response(ollamaRes.body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 502 });
  }
}
