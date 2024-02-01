import * as fs from "node:fs";
import * as path from "node:path";
import Output from "../output.js";
import { Command, CommandDef } from "../types.js";

const cd: Command = (_args, state) => {
  const { workingDirectory } = state;
  const nextWorkingDirectory = path.join(workingDirectory, ..._args);

  let stats: fs.Stats;

  try {
    stats = fs.statSync(nextWorkingDirectory);
  } catch (_error) {
    Output.error(`Path does not exist: ${nextWorkingDirectory}`);

    return;
  }

  if (!stats.isDirectory()) {
    Output.error(`${nextWorkingDirectory} is not a directory.`);

    return;
  }

  // REVIEW: Investigate where to place this, whether to do it in this command, or automatically detect it in the main loop.
  process.chdir(nextWorkingDirectory);

  return state.with({
    workingDirectory: nextWorkingDirectory,
  });
};

export default {
  execute: cd,
  description: "List the contents of the current directory.",
} satisfies CommandDef;
