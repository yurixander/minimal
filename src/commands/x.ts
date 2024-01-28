import { exec } from "node:child_process";
import Output from "../output.js";
import { Command, CommandDef, LineVariant, LogLevel } from "../types.js";
import { extractLines } from "../util.js";

const x: Command = (args) => {
  // TODO: Need an argument parser library, as well as a way to validate arguments.
  if (args.length === 0) {
    return;
  }

  return new Promise((resolve) => {
    // TODO: Consider working directory.
    // TODO: Process error.
    exec(args.join(" "), (error, stdout, stderr) => {
      const errors = extractLines(stderr);
      const output = extractLines(stdout);

      for (const line of output) {
        Output.write({
          text: line,
          logLevel: LogLevel.Info,
          variant: LineVariant.ListItem,
          preserveColor: true,
        });
      }

      for (const error of errors) {
        Output.write({
          text: error,
          logLevel: LogLevel.Error,
          variant: LineVariant.ListItem,
        });
      }

      resolve();
    });
  });
};

export default {
  execute: x,
  description: "Execute an external command.",
} satisfies CommandDef;
