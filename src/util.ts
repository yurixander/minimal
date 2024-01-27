import { INITIAL_CONTEXT, ROOT_PROMPT } from "./constants.js";
import LineBuffer from "./lineBuffer.js";
import { LogLevel } from "./types.js";

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
