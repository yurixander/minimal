import OpenAI from "openai";
import { GPT_SYSTEM_PROMPT } from "../constants.js";
import LineBuffer from "../lineBuffer.js";
import { Command, CommandDef, EnvVariableKey, LogLevel } from "../types.js";
import { Helper, beautifyText, getEnvVariable, joinSegments } from "../util.js";

async function fetchGptResponse(
  openai: OpenAI,
  prompt: string
): Promise<string | Error> {
  try {
    const response = await openai.chat.completions.create({
      // TODO: Make this configurable via arguments.
      model: "gpt-3.5-turbo",
      max_tokens: 150,
      messages: [
        {
          role: "system",
          content: GPT_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseContent = response.choices[0].message.content;

    // TODO: Proper error handling.
    if (responseContent === null) {
      return new Error("No response returned from OpenAI");
    }

    return responseContent;
  } catch (error) {
    console.error("Error fetching response from OpenAI:", error);
  }

  return new Error("Error fetching response from OpenAI");
}

// CONSIDER: Add ability for GPT to execute commands, with the user's approval. Or even, make it automatic via an argument. Or perhaps do both: Automatic command selection & execution via an argument/option, and the ability for GPT to select & execute commands via functions.
const gpt: Command = async (args, context) => {
  const apiKey = getEnvVariable(EnvVariableKey.OpenAiApiKey);
  const prompt = joinSegments(args);

  if (apiKey === null) {
    // CONSIDER: Ask for this on-demand, via a prompt.
    return Helper.error(
      `Please set the '${EnvVariableKey.OpenAiApiKey}' environment variable`
    );
  } else if (prompt === null) {
    return Helper.error("Please provide a prompt");
  }

  const openai = new OpenAI({
    apiKey,
  });

  const gptResponse = await fetchGptResponse(openai, prompt);
  const response = new LineBuffer();

  if (gptResponse instanceof Error) {
    response.pushWithDefaults({
      text: gptResponse.message,
      logLevel: LogLevel.Error,
    });
  } else {
    const lines = beautifyText(gptResponse);

    for (const line of lines) {
      response.pushListItem({
        text: line,
      });
    }
  }

  return [response];
};

export default {
  execute: gpt,
  description: "Interact with the GPT API in an intuitive way.",
} satisfies CommandDef;
