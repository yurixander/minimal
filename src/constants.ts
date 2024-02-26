import path from "node:path";
import { ConfigContents } from "./config.js";
import { State, StateOpts } from "./state.js";
import { AppEvent, LogLevel } from "./types.js";
import { lazy } from "./util.js";
import chalk from "chalk";

export const ROOT_PROMPT = [chalk.white("▲")];

export const APP_NAME = "minimal";

export const INITIAL_STATE = new State({
  workingDirectory: process.cwd(),
  logLevel: LogLevel.Verbose,
  prompt: [],
});

export const EVENT_DELTA_POINTS: [keyof StateOpts, AppEvent][] = [
  ["workingDirectory", AppEvent.WorkingDirectoryChanged],
  ["prompt", AppEvent.PromptChanged],
];

export const MAX_STATE_TRANSITIONS = 100;

export const HACKERNEWS_TOP_STORIES_ENDPOINT =
  "https://hacker-news.firebaseio.com/v0/topstories.json";

export const SPLASH_NEWS_COUNT = 5;

export const GPT_MAX_MESSAGE_HISTORY_LENGTH = 1_000;

export const GPT_SYSTEM_PROMPT = `You are a helpful assistant that is being accessed through a command line interface. Keep responses short and concise. Avoid using large codeblocks: only use single-backtick inline code instead. You will specialize in helping with programming-related tasks, and will be able to answer questions about programming languages, frameworks, and libraries. Furthermore, there will be a strong focus on knowledge around command line tools and utilities. Do note that the shell environment that you are running in is a custom shell, and does not have access to the same tools and utilities that you are used to. The shell environment's name is ${APP_NAME}. At the end of responses, do not ask questions such as 'Is there anything you'd like to know about X?', simply end the response with a period after the essential information has been provided. You also cannot use Markdown.`;

export const LINE_CLIP_LENGTH = 60;

// CONSIDER: Having this be part of the config itself.
export const CACHE_PATH = `.${APP_NAME}.cache`;

export const DEFAULT_CONFIG: ConfigContents = {
  storageBasePath: CACHE_PATH,
  // TODO: Give this an appropriate type.
  gptModel: "gpt-4-turbo-preview",
  gptMaxTokens: 200,
  splashFetchHeadlines: true,
};

// CONSIDER: Having this be part of the config itself.
export const CONFIG_FILE_NAME = `${APP_NAME}.config.json`;

// CONSIDER: Having this be auto-computed, if the other parts are part of the config itself.
export const CONFIG_FILE_PATH = lazy(() =>
  path.join(CACHE_PATH, CONFIG_FILE_NAME)
);

export const PATH_FILE_ITERATION_WARNING_THRESHOLD = 20_000;
