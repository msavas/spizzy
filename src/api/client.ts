import type { GenerationInput, GenerationResponse } from "../../shared/types";

export async function requestAiPlaylist(input: GenerationInput): Promise<GenerationResponse> {
  const response = await fetch("/api/generate-playlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let message = `Failed to generate playlist (status ${response.status})`;
    try {
      const data = await response.json();
      if (data?.error) {
        message = data.error;
      }
    } catch (error) {
      // ignore JSON parsing errors and use default message
    }
    throw new Error(message);
  }

  const payload = (await response.json()) as GenerationResponse;
  return payload;
}
