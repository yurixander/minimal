import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import Config, { ConfigKey } from "../config.js";
import {
  GPT_MAX_MESSAGE_HISTORY_LENGTH,
  GPT_SYSTEM_PROMPT,
  LINE_CLIP_LENGTH,
} from "../constants.js";
import Output from "../output.js";
import Storage from "../storage.js";
import {
  Command,
  CommandDef,
  EnvVariableKey,
  LineVariant,
  LogLevel,
} from "../types.js";
import { getEnvVariable, joinSegments } from "../util.js";
import StorageRef from "../storageRef.js";

const messageHistory = new StorageRef(
  "gpt",
  "context",
  // TODO: Add the argument/option to specify a custom system prompt for the user.
  // FIXME: When the message history limit is exceeded, this prompt message is removed from the history. This is not ideal, as it should be kept in the history, and the oldest message should be removed instead.
  [{ role: "system", content: GPT_SYSTEM_PROMPT }],
  "array"
);

// TODO: Need a timeout system for data fetching. Perhaps even better would be an entire tiny framework for handling async data fetching, with timeouts, retries, and other features, that are all automatically handled by the framework and inform the user.
async function streamGptResponse(
  openai: OpenAI,
  prompt: string
): Promise<Error | void> {
  const newMessage: ChatCompletionMessageParam = {
    role: "user",
    content: prompt,
  };

  const maxMessageHistoryLength = Storage.getOrDefault(
    "gpt",
    "maxMessageHistoryLength",
    GPT_MAX_MESSAGE_HISTORY_LENGTH,
    "number"
  );

  // Limit the message history to a certain length.
  if (messageHistory.value.length >= maxMessageHistoryLength) {
    messageHistory.value.shift();
  }

  // Save the input in the message history.
  messageHistory.transform((messages) => messages.concat(newMessage));

  // TODO: Give this an appropriate type.
  const model = Config.read(ConfigKey.GptModel, "string");

  const maxTokens = Config.read(ConfigKey.GptMaxTokens, "number");

  // TODO: Error handling.
  const stream = await openai.chat.completions.create({
    stream: true,
    model,
    // TODO: Add cutoff '...' to the end of the output if it exceeds the max tokens.
    max_tokens: maxTokens,
    messages: messageHistory.value,
  });

  let isFirstChunk = true;
  let chunkLength = 0;
  let chunks: string[] = [];

  // TODO: Abstract this into a function, such as `streamTextChunks` for `Output`.
  for await (const chunk of stream) {
    const textChunk = chunk.choices[0]?.delta?.content || null;

    if (textChunk === null) {
      continue;
    } else if (isFirstChunk) {
      isFirstChunk = false;
      Output.writeRaw(Output.getLineVariantPrefix(LineVariant.ListItem));
    }
    // TODO: Need to find a way to handle periods, since currently it's breaking up text in a strict way.
    else if (chunkLength > LINE_CLIP_LENGTH) {
      Output.newLine();
      Output.writeRaw(Output.getLineVariantPrefix(LineVariant.ListItem));
      chunkLength = 0;
    }

    Output.writeRaw(
      Output.colorize(textChunk, Output.getColorFromLogLevel(LogLevel.Info))
    );

    chunkLength += textChunk.length;
    chunks.push(textChunk);
  }

  // TODO: Account for max message history length. Might need some custom data structure to abstract this, perhaps a queue with a max length.
  // Save the response in the message history.
  messageHistory.transform((messages) =>
    messages.concat({ role: "system", content: chunks.join("") })
  );

  Output.newLine();
}

// CONSIDER: Initializing GPT messages with a list of all the commands and their output so far, so it has more context. Perhaps this would require a `GptProvider` feature with an interceptor to go along with this command, which may use the `Storage` API to store the messages.
// CONSIDER: Add ability for GPT to execute commands, with the user's approval. Or even, make it automatic via an argument. Or perhaps do both: Automatic command selection & execution via an argument/option, and the ability for GPT to select & execute commands via functions.
const gpt: Command = async (args) => {
  const apiKey = getEnvVariable(EnvVariableKey.OpenAiApiKey);
  const prompt = joinSegments(args);

  if (apiKey === null) {
    // CONSIDER: Ask for this on-demand, via a prompt.
    Output.error(
      `Please set the '${EnvVariableKey.OpenAiApiKey}' environment variable`
    );

    return;
  } else if (prompt === null) {
    Output.error("Please provide a prompt");

    return;
  }

  // TODO: Need to maintain context between calls to this command, and add an argument/option to reset the context. Need an API to handle persistent contexts like that, in a functional way.
  let openai = new OpenAI({ apiKey });

  const gptResponse = await streamGptResponse(openai, prompt);

  if (gptResponse instanceof Error) {
    Output.write({ text: gptResponse.message, logLevel: LogLevel.Error });
  }
};

export default {
  execute: gpt,
  description: "Interact with the GPT API in an intuitive way.",
} satisfies CommandDef;
