import { Context } from "./context.js";
import Output from "./output.js";
import {
  CommandDef,
  FeatureDef,
  FeatureListener,
  LogLevel,
  Namespace,
} from "./types.js";
import { safelyTry } from "./util.js";

export function createCommandMap(
  commands: CommandDef[]
): Map<string, CommandDef> {
  const map = new Map<string, CommandDef>();

  for (const command of commands) {
    map.set(command.execute.name, command);
  }

  return map;
}

export async function initializeFeatures(
  initialContext: Context,
  features: FeatureDef[]
): Promise<Map<string, FeatureListener>> {
  const map = new Map<string, FeatureListener>();

  for (const feature of features) {
    const didInitialize = await safelyTry(
      async () =>
        feature.initializer !== undefined
          ? await feature.initializer(initialContext)
          : true,
      Promise.resolve(false)
    );

    if (!didInitialize) {
      Output.write({
        text: `Feature '${feature.listener.name}' failed to initialize`,
        logLevel: LogLevel.Warning,
        namespace: Namespace.Boot,
      });

      continue;
    }

    map.set(feature.listener.name, feature.listener);
  }

  return map;
}
