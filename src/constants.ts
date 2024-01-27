import cd from "./commands/cd.js";
import e from "./commands/e.js";
import l from "./commands/l.js";
import splash from "./commands/splash.js";
import git from "./features/git.js";
import { createCommandMap, createFeatureMap } from "./init.js";
import { AppEvent, Context, LogLevel } from "./types.js";
import { lazy } from "./util.js";

export const COMMANDS = lazy(() => createCommandMap([l, e, splash, cd]));

export const FEATURES = lazy(() => createFeatureMap([git]));

export const ROOT_PROMPT = ["▲"];

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
