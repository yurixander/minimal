import {
  EnvVariableKey,
  FeatureDef,
  FeatureInit,
  FeatureListener,
} from "../types.js";
import { getEnvVariable } from "../util.js";

const cache: Map<string, string> = new Map();

const passthrough: FeatureListener = async () => {
  //
};

const init: FeatureInit = async () => {
  const pathDirectories = getEnvVariable(EnvVariableKey.Path);

  if (pathDirectories) {
    // TODO: Implement.
  }
};

export default {
  listener: passthrough,
  description:
    "Useful Git integration, including displaying the branch name in prompt.",
} satisfies FeatureDef;
