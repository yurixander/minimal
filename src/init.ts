import { CommandDef, Feature, FeatureDef } from "./types.js";

export function createCommandMap(
  commands: CommandDef[]
): Map<string, CommandDef> {
  const map = new Map<string, CommandDef>();

  for (const command of commands) {
    map.set(command.execute.name, command);
  }

  return map;
}

export function createFeatureMap(features: FeatureDef[]): Map<string, Feature> {
  const map = new Map<string, Feature>();

  for (const feature of features) {
    map.set(feature.listener.name, feature.listener);
  }

  return map;
}
