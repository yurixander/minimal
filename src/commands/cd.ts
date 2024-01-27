import * as fs from "node:fs";
import * as path from "node:path";
import LineBuffer from "../lineBuffer.js";
import { Command, CommandDef } from "../types.js";
import { Helper } from "../util.js";

const cd: Command = (_args, context) => {
  const { workingDirectory } = context;
  const nextWorkingDirectory = path.join(workingDirectory, ..._args);

  let stats: fs.Stats;

  try {
    stats = fs.statSync(nextWorkingDirectory);
  } catch (_error) {
    return Helper.error(`${nextWorkingDirectory} does not exist`);
  }

  if (!stats.isDirectory()) {
    return Helper.error(`${nextWorkingDirectory} is not a directory.`);
  }

  // REVIEW: Investigate where to place this, whether to do it in this command, or automatically detect it in the main loop.
  process.chdir(nextWorkingDirectory);

  return [
    LineBuffer.empty,
    {
      ...context,
      workingDirectory: nextWorkingDirectory,
    },
  ];
};

export default {
  execute: cd,
  description: "List the contents of the current directory.",
} satisfies CommandDef;
