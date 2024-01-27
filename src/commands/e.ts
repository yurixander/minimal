import { exec } from "node:child_process";
import LineBuffer from "../lineBuffer.js";
import { Command, CommandDef, LogLevel } from "../types.js";
import { Helper, extractLines } from "../util.js";

const e: Command = (args) => {
  // TODO: Need an argument parser library, as well as a way to validate arguments.
  if (args.length === 0) {
    return Helper.nothing;
  }

  return new Promise((resolve) => {
    const buffer = new LineBuffer();

    // TODO: Consider working directory.
    exec(args.join(" "), (error, stdout, stderr) => {
      const errors = extractLines(stderr);
      const output = extractLines(stdout);

      for (const line of output) {
        buffer.pushListItem({
          text: line,
          logLevel: LogLevel.Info,
        });
      }

      for (const error of errors) {
        buffer.pushListItem({
          text: error,
          logLevel: LogLevel.Error,
        });
      }

      resolve([buffer]);
    });
  });
};

export default {
  execute: e,
  description: "Execute an external command.",
} satisfies CommandDef;
