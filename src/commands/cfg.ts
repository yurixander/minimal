import chalk from "chalk";
import Config from "../config.js";
import Output from "../output.js";
import { Command, CommandDef, LineVariant } from "../types.js";
import { autoParse, isConfigKey } from "../util.js";

const cfg: Command = (args) => {
  // TODO: Need to use framework for this kind of thing.
  if (args.length > 2) {
    Output.error(
      "Invalid number of arguments. Expected 0-2, but got " + args.length
    );

    return;
  }
  // If there are no arguments, show all config values.
  else if (args.length === 0) {
    const config = Config.readContents();

    for (const [key, value] of Object.entries(config)) {
      Output.write({
        text: `${chalk.white(key)}: ${value}`,
        variant: LineVariant.ListItem,
      });
    }

    return;
  }

  const key = args[0];

  if (!isConfigKey(key)) {
    Output.error("Invalid config key: " + key);

    return;
  }
  // Only show the value if there is only one argument (the key).
  else if (args.length === 1) {
    Output.writeSimple(Config.readAsString(key));

    return;
  }

  const value = autoParse(args[1]);

  Config.write(key, value);
};

export default {
  execute: cfg,
  description:
    "Configure certain aspects of the CLI, including options, paths, and more.",
} satisfies CommandDef;
