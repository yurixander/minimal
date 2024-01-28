import { ChalkInstance } from "chalk";
import { Context } from "./context.js";

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

export enum Namespace {
  Config = "config",
  Storage = "storage",
}

export type Line = TextChunk & {
  namespace?: Namespace;
  variant: LineVariant;
  preserveColor?: boolean;
};

export type LineOverrides = Partial<Line> & { text: string };

type PromiseOr<T> = T | Promise<T>;

export type Command = (
  args: string[],
  context: Context
) => PromiseOr<Context | void>;

export type CommandDef = {
  execute: Command;
  description: string;
  requiresSudo?: boolean;
};

export enum AppEvent {
  WorkingDirectoryChanged,
  PromptChanged,
}

export type FeatureListener = (
  event: AppEvent,
  context: Context,
  previousContext: Context
) => PromiseOr<Context | void>;

export type FeatureIntercept = (
  commandName: string,
  args: string[],
  context: Context
) => void;

export type FeatureInit = (context: Context) => PromiseOr<void>;

export type FeatureDef = {
  description: string;
  listener: FeatureListener;
  intercept?: FeatureIntercept;
  init?: FeatureInit;
  awaitInit?: boolean;
};

export enum PromptIndex {
  GitBranch = 0,
}

export enum EnvVariableKey {
  Path = "PATH",
  OpenAiApiKey = "OPENAI_API_KEY",
}
