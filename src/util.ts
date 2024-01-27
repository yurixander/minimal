import {
  INITIAL_CONTEXT,
  ROOT_PROMPT,
  TEXT_BEAUTIFY_MAX_SENTENCE_LENGTH,
} from "./constants.js";
import LineBuffer from "./lineBuffer.js";
import { EnvVariableKey, LogLevel } from "./types.js";

export abstract class Helper {
  static error(message: string): [LineBuffer] {
    const response = new LineBuffer();

    response.pushWithDefaults({
      text: message,
      logLevel: LogLevel.Error,
    });

    return [response];
  }

  static get nothing(): [LineBuffer] {
    return [LineBuffer.empty];
  }
}

export function extractLines(string: string): string[] {
  return string
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

export function renderPrompt(prompt: string[]): string {
  const promptWithInitial = [
    ...ROOT_PROMPT,
    ...INITIAL_CONTEXT.prompt,
    ...prompt,
  ];

  return (
    promptWithInitial
      .filter((segment) => segment !== undefined)
      .map((segment) => segment.trim())
      .filter((segment) => segment !== "")
      .join(" ") + " "
  );
}

export function lazy<T>(fn: () => T): () => T {
  let value: T;
  let initialized = false;

  return () => {
    if (!initialized) {
      value = fn();
      initialized = true;
    }

    return value;
  };
}

export function getEnvVariable(key: EnvVariableKey): string | null {
  // TODO: Use zod to validate the environment variables, and automatically parse them.

  return process.env[key] ?? null;
}

export function joinSegments(segments: string[]): string | null {
  const result = segments
    .map((segment) => segment.trim())
    .filter((segment) => segment !== "")
    .join(" ");

  return result === "" ? null : result;
}

export function beautifyText(text: string): string[] {
  const words = text.split(" ");
  const sentences: string[] = [];
  const currentSentence: string[] = [];

  for (const word of words) {
    currentSentence.push(word);

    if (currentSentence.length >= TEXT_BEAUTIFY_MAX_SENTENCE_LENGTH) {
      sentences.push(currentSentence.join(" "));
      currentSentence.length = 0;
    }
  }

  // Push the last sentence, if it exists.
  if (currentSentence.length > 0) {
    sentences.push(currentSentence.join(" "));
  }

  return sentences;
}
