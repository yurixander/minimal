import _ from "lodash";
import * as readline from "readline";
import { isDeepStrictEqual } from "util";
import cd from "./commands/cd.js";
import cfg from "./commands/cfg.js";
import gpt from "./commands/gpt.js";
import l from "./commands/l.js";
import splash from "./commands/splash.js";
import x from "./commands/x.js";
import {
  EVENT_DELTA_POINTS,
  INITIAL_STATE,
  MAX_STATE_TRANSITIONS,
} from "./constants.js";
import git from "./features/git.js";
import passthrough from "./features/passthrough.js";
import { createCommandMap, initializeFeatures } from "./init.js";
import Output from "./output.js";
import { AppEvent, CommandDef, LogLevel } from "./types.js";
import { lazy, renderPrompt } from "./util.js";

export const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  tabSize: 2,
});

let state = INITIAL_STATE.clone();
const commands = lazy(() => createCommandMap([l, x, splash, cd, gpt, cfg]));
const features = await initializeFeatures(state, [git, passthrough]);

const executeCommand = async (command: CommandDef, args: string[]) => {
  // TODO: Graciously handle command & feature executing errors, show appropriate debug information, and beautify error stack traces, as well as report the name of the command or feature that failed.

  const preCommandState = state.clone();

  let postCommandState = await command.execute([...args], _.cloneDeep(state));

  // A state transition did not occur.
  if (postCommandState === undefined) {
    return;
  }

  const eventQueue: Set<AppEvent> = new Set();

  for (const [key, event] of EVENT_DELTA_POINTS) {
    if (!isDeepStrictEqual(preCommandState[key], postCommandState[key])) {
      eventQueue.add(event);
    }
  }

  // This is used to detect infinite loops that may occur when
  // features are implemented incorrectly.
  let iterationCount = 0;

  let previousState = _.cloneDeep(postCommandState);

  // REVISE: Simplify this logic. There's some repetition here.
  while (eventQueue.size > 0) {
    // REVISE: This is having `any` type for some reason. Find a type-safe way without the need to manually specify the type.
    const currentEvent: AppEvent = eventQueue.values().next().value;

    eventQueue.delete(currentEvent);

    for (const [_name, listener] of features) {
      const postFeatureState = await listener(
        currentEvent,
        _.cloneDeep(previousState),
        _.cloneDeep(state)
      );

      if (postFeatureState !== undefined) {
        // If the state changed, we need to re-evaluate the event queue.
        for (const [key, event] of EVENT_DELTA_POINTS) {
          const didChange = !isDeepStrictEqual(
            postFeatureState[key],
            previousState[key]
          );

          if (didChange) {
            eventQueue.add(event);
          }
        }

        previousState = postFeatureState;
      }
    }

    // Update the global state with the latest changes.
    state = _.cloneDeep(previousState);

    // Detect infinite loops that may be caused from logic errors
    // on the definitions of features.
    iterationCount += 1;

    // Gracefully exit the event loop if the maximum number of
    // iterations is exceeded.
    if (iterationCount > MAX_STATE_TRANSITIONS) {
      Output.writeSimple(
        `Max state transition count of ${MAX_STATE_TRANSITIONS} was exceeded, the last event was ${currentEvent}`,
        LogLevel.Debug
      );

      break;
    }
  }

  // Update the prompt in case it changed.
  rl.setPrompt(renderPrompt(state.prompt));
};

rl.on("line", async (input) => {
  // Ignore empty commands.
  if (input === "") {
    rl.prompt();

    return;
  }

  // TODO: Use an abstraction to parse, validate, and provide type-safe arguments to commands.
  const [commandName, ...args] = input
    .split(" ")
    .map((arg) => arg.trim())
    .filter((arg) => arg !== "");

  const command = commands().get(commandName);

  if (command === undefined) {
    Output.error(`Unknown command: ${commandName}`);
  } else {
    await executeCommand(command, args);
  }

  rl.prompt();
});

// Initialization.
await executeCommand(splash, []);
rl.setPrompt(renderPrompt(state.prompt));
rl.prompt();
