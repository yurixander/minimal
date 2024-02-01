import assert from "node:assert";
import { ConfigKey, JsonValue, RuntimeType, StaticType } from "./config.js";
import { INITIAL_STATE, ROOT_PROMPT } from "./constants.js";
import Output from "./output.js";
import { EnvVariableKey, LineVariant, LogLevel } from "./types.js";
import * as fs from "node:fs";

export function extractLines(string: string): string[] {
  return string
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

export function renderPrompt(prompt: string[]): string {
  const promptWithInitial = [
    ...ROOT_PROMPT,
    ...INITIAL_STATE.prompt,
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

export function ensureError(possibleError: unknown): Error {
  if (possibleError instanceof Error) {
    return possibleError;
  }

  return new Error(
    `Unknown error because the error object was not an Error (type was ${typeof possibleError})`
  );
}

export function autoParse(serializedValue: string): JsonValue {
  const number = Number(serializedValue);

  if (!Number.isNaN(number)) {
    return number;
  }

  const boolean: boolean | null =
    serializedValue === "true"
      ? true
      : serializedValue === "false"
      ? false
      : null;

  if (boolean !== null) {
    return boolean;
  }

  return serializedValue;
}

export function isConfigKey(key: string): key is ConfigKey {
  return Object.values(ConfigKey).includes(key as ConfigKey);
}

export function isOfType<T extends RuntimeType>(
  value: unknown,
  type: T
): value is StaticType<T> {
  if (type === "string") {
    return typeof value === "string";
  } else if (type === "number") {
    return typeof value === "number";
  } else if (type === "boolean") {
    return typeof value === "boolean";
  }

  return false;
}

export async function safelyTry<T>(fn: () => T, defaultValue: T): Promise<T> {
  try {
    return await fn();
  } catch (possibleError: unknown) {
    const error = ensureError(possibleError);

    Output.write({
      text: `An internal error occurred: ${error.message}`,
      variant: LineVariant.ListHeader,
      logLevel: LogLevel.Debug,
    });

    if (error.stack !== undefined) {
      const stackLines = error.stack
        .split("\n")
        .slice(1)
        .map((line) => line.trim().slice(2).trim())
        .map((line) => `@ ${line}`);

      for (const stackLine of stackLines) {
        Output.write({
          text: stackLine,
          logLevel: LogLevel.Debug,
          variant: LineVariant.ListItem,
        });
      }
    }

    return defaultValue;
  }
}

export function tryOrDefault<T>(action: () => T, defaultValue: T): T {
  try {
    return action();
  } catch {
    return defaultValue;
  }
}

export function canAccessPath(path: string) {
  return tryOrDefault(() => {
    fs.accessSync(path, fs.constants.R_OK);

    return true;
  }, false);
}

export function clipString(string: string, maxLength: number): string {
  assert(maxLength >= 4, "Max length should be at least 4 characters");

  if (string.length <= maxLength) {
    return string;
  }

  return string.slice(0, maxLength - 3) + "...";
}
