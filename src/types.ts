import { ChalkInstance } from "chalk";
import { State } from "./state.js";

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
  Boot = "boot",
}

export type Emoji = "🤔";

export type Line = TextChunk & {
  namespace?: Namespace;
  variant: LineVariant;
  preserveColor?: boolean;
  emoji?: Emoji;
  clip?: boolean;
  suffixes?: string[];
};

export type LineOverrides = Partial<Line> & { text: string };

type PromiseOr<T> = T | Promise<T>;

export type Command = (args: string[], state: State) => PromiseOr<State | void>;

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
  state: State,
  previousState: State
) => PromiseOr<State | void>;

export type FeatureIntercept = (
  commandName: string,
  args: string[],
  state: State
) => void;

export type FeatureInitializer = (state: State) => PromiseOr<boolean>;

export type FeatureDef = {
  description: string;
  listener: FeatureListener;
  intercept?: FeatureIntercept;
  initializer?: FeatureInitializer;
  awaitInit?: boolean;
};

export enum PromptIndex {
  GitBranch = 0,
}

export enum EnvVariableKey {
  Path = "PATH",
  OpenAiApiKey = "OPENAI_API_KEY",
}
