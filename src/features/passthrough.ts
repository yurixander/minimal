import fs from "node:fs";
import path from "node:path";
import { PATH_FILE_ITERATION_WARNING_THRESHOLD } from "../constants.js";
import Output from "../output.js";
import {
  EnvVariableKey,
  FeatureDef,
  FeatureInitializer,
  FeatureListener,
  LogLevel,
} from "../types.js";
import { canAccessPath, getEnvVariable, lazy, tryOrDefault } from "../util.js";

const cache: Map<string, string> = new Map();

const passthrough: FeatureListener = async () => {
  //
};

// CONSIDER: Do not do this on initialization, but rather on demand, when passthrough first occurs.
const init: FeatureInitializer = async () => {
  const pathEnvVariable = getEnvVariable(EnvVariableKey.Path);

  if (pathEnvVariable === null) {
    Output.write({
      text: `Strangely, there seems to be no ${EnvVariableKey.Path} environment variable defined; pass-through feature will be limited to working directory`,
      logLevel: LogLevel.Verbose,
    });

    return true;
  }

  const pathEntries = pathEnvVariable.split(":");
  let iterationCount = 0;
  let didWarnAboutManyFiles = false;

  for (const pathEntry of pathEntries) {
    // Just because it's in the PATH doesn't mean it exists.
    // Also, usually some entries in the PATH are not accessible
    // due to permissions.
    if (!fs.existsSync(pathEntry) || !canAccessPath(pathEntry)) {
      continue;
    }

    const items = fs.readdirSync(pathEntry);

    for (const item of items) {
      const itemPath = path.join(pathEntry, item);

      const doIgnore =
        // Can't take stats of files that are under permission
        // restrictions. Thus, need to perform permission check first.
        !canAccessPath(itemPath) ||
        fs.statSync(itemPath).isDirectory() ||
        // TODO: Add support for other executable file extensions, and cross-platform support, which will likely be based off the file's permissions (is it marked as executable?).
        // Ignore non-executable files.
        path.extname(item) !== ".exe";

      if (doIgnore) {
        continue;
      } else if (cache.has(item)) {
        Output.write({
          text: `Multiple executables with the same name '${item}' were found in the PATH; using the first one found`,
          logLevel: LogLevel.Warning,
        });

        continue;
      }

      cache.set(item, pathEntry);
      iterationCount += 1;

      if (
        !didWarnAboutManyFiles &&
        iterationCount >= PATH_FILE_ITERATION_WARNING_THRESHOLD
      ) {
        Output.write({
          text: "There are many files in the PATH; this may cause performance issues when starting the shell",
          logLevel: LogLevel.Warning,
        });

        didWarnAboutManyFiles = true;
      }
    }
  }

  return true;
};

export default {
  listener: passthrough,
  initializer: init,
  description:
    "Useful Git integration, including displaying the branch name in prompt.",
} satisfies FeatureDef;
