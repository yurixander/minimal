import { ChalkInstance } from "chalk";
import LineBuffer from "./lineBuffer.js";

type SimpleChalkColor<T extends keyof ChalkInstance> =
  ChalkInstance[T] extends (text: string) => string ? T : never;

export type LogColor = SimpleChalkColor<
  "gray" | "yellow" | "red" | "magenta" | "white" | "cyan"
>;

export type TextChunk = {
  text: string;
  logLevel: LogLevel;
  color: LogColor;
};

export enum LogLevel {
  Info = 0,
  Warning = 1,
  Error = 2,
  Verbose = 3,
  Debug = 4,
}

export enum LineVariant {
  Normal,
  ListItem,
  ListHeader,
}

export type Line = TextChunk & {
  variant: LineVariant;
};

export type LineOverrides = Partial<Line> & { text: string };

export type Context = {
  workingDirectory: string;
  logLevel: LogLevel;
  prompt: string[];
};

type PromiseOr<T> = T | Promise<T>;

export type Command = (
  args: string[],
  context: Context
) => PromiseOr<[LineBuffer, Context?]>;

export type CommandDef = {
  execute: Command;
  description: string;
  requiresSudo?: boolean;
};

export enum AppEvent {
  WorkingDirectoryChanged,
  PromptChanged,
}

export type Feature = (
  event: AppEvent,
  context: Context,
  previousContext: Context
) => PromiseOr<Context | void>;

export type FeatureDef = {
  description: string;
  listener: Feature;
};

export enum PromptIndex {
  GitBranch = 0,
}

export enum EnvVariableKey {
  OpenAiApiKey = "OPENAI_API_KEY",
}
