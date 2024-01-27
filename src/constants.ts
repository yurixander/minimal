import cd from "./commands/cd.js";
import gpt from "./commands/gpt.js";
import l from "./commands/l.js";
import splash from "./commands/splash.js";
import e from "./commands/x.js";
import git from "./features/git.js";
import { createCommandMap, createFeatureMap } from "./init.js";
import { AppEvent, Context, LogLevel } from "./types.js";
import { lazy } from "./util.js";

export const COMMANDS = lazy(() => createCommandMap([l, e, splash, cd, gpt]));

export const FEATURES = lazy(() => createFeatureMap([git]));

export const ROOT_PROMPT = ["▲"];

export const APP_NAME = "minimal";

export const INITIAL_CONTEXT: Readonly<Context> = {
  workingDirectory: process.cwd(),
  logLevel: LogLevel.Verbose,
  prompt: [],
};

export const EVENT_DELTA_POINTS: [keyof Context, AppEvent][] = [
  ["workingDirectory", AppEvent.WorkingDirectoryChanged],
  ["prompt", AppEvent.PromptChanged],
];

export const MAX_CONTEXT_ITERATIONS = 100;

export const HACKERNEWS_TOP_STORIES_ENDPOINT =
  "https://hacker-news.firebaseio.com/v0/topstories.json";

export const SPLASH_NEWS_COUNT = 5;

export const GPT_SYSTEM_PROMPT = `You are a helpful assistant that is being accessed through a command line interface. Keep responses short and concise. Avoid using large codeblocks: only use single-backtick inline code instead. You will specialize in helping with programming-related tasks, and will be able to answer questions about programming languages, frameworks, and libraries. Furthermore, there will be a strong focus on knowledge around command line tools and utilities. Do note that the shell environment that you are running in is a custom shell, and does not have access to the same tools and utilities that you are used to. The shell environment's name is ${APP_NAME}.`;

export const TEXT_BEAUTIFY_MAX_SENTENCE_LENGTH = 10;
