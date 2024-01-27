import chalk from "chalk";
import _ from "lodash";
import * as readline from "readline";
import { isDeepStrictEqual } from "util";
import splash from "./commands/splash.js";
import {
  COMMANDS,
  EVENT_DELTA_POINTS,
  FEATURES,
  INITIAL_CONTEXT,
  MAX_CONTEXT_ITERATIONS,
} from "./constants.js";
import LineBuffer from "./lineBuffer.js";
import {
  AppEvent,
  CommandDef,
  Context,
  LineVariant,
  LogLevel,
} from "./types.js";
import { renderPrompt } from "./util.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  tabSize: 2,
});

let context: Context = { ...INITIAL_CONTEXT };

// Initialize the prompt.
rl.setPrompt(renderPrompt(context.prompt));

const render = (buffer: LineBuffer): void => {
  for (const line of buffer.getLines()) {
    // TODO: Need to ignore empty lines, but here?
    if (line.logLevel > context.logLevel) {
      continue;
    }

    const logger: (message: string) => void = {
      [LogLevel.Info]: console.log,
      [LogLevel.Debug]: console.debug,
      [LogLevel.Verbose]: console.debug,
      [LogLevel.Error]: console.error,
      [LogLevel.Warning]: console.warn,
    }[line.logLevel];

    const SPACING = " ";

    const prefix = {
      [LineVariant.Normal]: "",
      [LineVariant.ListHeader]: chalk.green("◆"),
      [LineVariant.ListItem]: chalk.gray(`${SPACING}.`),
    }[line.variant];

    logger([prefix, chalk[line.color](line.text)].join(" "));
  }
};

const executeCommand = async (
  command: CommandDef,
  args: string[]
): Promise<LineBuffer> => {
  // TODO: Graciously handle command & feature executing errors, show appropriate debug information, and beautify error stack traces, as well as report the name of the command or feature that failed.

  const preCommandContext = { ...context };

  let [buffer, postCommandContext] = await command.execute(
    [...args],
    _.cloneDeep(context)
  );

  const response = new LineBuffer();

  response.extend(buffer);

  // A context transition did not occur.
  if (postCommandContext === undefined) {
    return response;
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

    for (const [_name, listener] of FEATURES()) {
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
      response.push(
        `Max context iteration count of ${MAX_CONTEXT_ITERATIONS} was exceeded, the last event was ${currentEvent}`,
        LogLevel.Debug
      );

      break;
    }
  }

  // Update the prompt in case it changed.
  rl.setPrompt(renderPrompt(context.prompt));

  return response;
};

rl.on("line", async (input) => {
  // Ignore empty commands.
  if (input === "") {
    rl.prompt();

    return;
  }

  const [commandName, ...args] = input
    .split(" ")
    .map((arg) => arg.trim())
    .filter((arg) => arg !== "");

  const command = COMMANDS().get(commandName);
  const response = new LineBuffer();

  if (command === undefined) {
    response.push(`Unknown command: ${commandName}`);
  } else {
    response.extend(await executeCommand(command, args));
  }

  render(response);
  rl.prompt();
});

// Initialization.
render(await executeCommand(splash, []));
rl.prompt();
