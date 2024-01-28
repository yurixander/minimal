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
  INITIAL_CONTEXT,
  MAX_CONTEXT_ITERATIONS,
} from "./constants.js";
import git from "./features/git.js";
import passthrough from "./features/passthrough.js";
import { createCommandMap, initializeFeatures } from "./init.js";
import Output from "./output.js";
import { AppEvent, CommandDef, LogLevel } from "./types.js";
import { lazy, renderPrompt } from "./util.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  tabSize: 2,
});

let context = INITIAL_CONTEXT.clone();

const commands = lazy(() => createCommandMap([l, x, splash, cd, gpt, cfg]));
const features = await initializeFeatures(context, [git, passthrough]);

const executeCommand = async (command: CommandDef, args: string[]) => {
  // TODO: Graciously handle command & feature executing errors, show appropriate debug information, and beautify error stack traces, as well as report the name of the command or feature that failed.

  const preCommandContext = context.clone();

  let postCommandContext = await command.execute(
    [...args],
    _.cloneDeep(context)
  );

  // A context transition did not occur.
  if (postCommandContext === undefined) {
    return;
  }

  const eventQueue: Set<AppEvent> = new Set();

  for (const [key, event] of EVENT_DELTA_POINTS) {
    if (!isDeepStrictEqual(preCommandContext[key], postCommandContext[key])) {
      eventQueue.add(event);
    }
  }

  // This is used to detect infinite loops that may occur when
  // features are implemented incorrectly.
  let iterationCount = 0;

  let previousContext = _.cloneDeep(postCommandContext);

  // REVISE: Simplify this logic. There's some repetition here.
  while (eventQueue.size > 0) {
    // REVISE: This is having `any` type for some reason. Find a type-safe way without the need to manually specify the type.
    const currentEvent: AppEvent = eventQueue.values().next().value;

    eventQueue.delete(currentEvent);

    for (const [_name, listener] of features) {
      const postFeatureContext = await listener(
        currentEvent,
        _.cloneDeep(previousContext),
        _.cloneDeep(context)
      );

      if (postFeatureContext !== undefined) {
        // If the context changed, we need to re-evaluate the event queue.
        for (const [key, event] of EVENT_DELTA_POINTS) {
          const didChange = !isDeepStrictEqual(
            postFeatureContext[key],
            previousContext[key]
          );

          if (didChange) {
            eventQueue.add(event);
          }
        }

        previousContext = postFeatureContext;
      }
    }

    // Update the global context with the latest changes.
    context = _.cloneDeep(previousContext);

    // Detect infinite loops that may be caused from logic errors
    // on the definitions of features.
    iterationCount += 1;

    // Gracefully exit the event loop if the maximum number of
    // iterations is exceeded.
    if (iterationCount > MAX_CONTEXT_ITERATIONS) {
      Output.writeSimple(
        `Max context iteration count of ${MAX_CONTEXT_ITERATIONS} was exceeded, the last event was ${currentEvent}`,
        LogLevel.Debug
      );

      break;
    }
  }

  // Update the prompt in case it changed.
  rl.setPrompt(renderPrompt(context.prompt));
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
    Output.writeSimple(`Unknown command: ${commandName}`, LogLevel.Error);
  } else {
    await executeCommand(command, args);
  }

  rl.prompt();
});

// Initialization.
await executeCommand(splash, []);
rl.setPrompt(renderPrompt(context.prompt));
rl.prompt();
