export async function speakInterviewerMessage(_text: string): Promise<void> {
  if (typeof window === "undefined") return
  // Placeholder for future TTS integration.
  // When voice is enabled, this will call a real TTS provider
  // (e.g. OpenAI or ElevenLabs) and play audio in the browser.
}

