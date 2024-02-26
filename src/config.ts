import fs from "node:fs";
import { CACHE_PATH, CONFIG_FILE_PATH, DEFAULT_CONFIG } from "./constants.js";
import Output from "./output.js";
import { LogLevel, Namespace } from "./types.js";
import { isOfType } from "./util.js";

export enum ConfigKey {
  StorageBasePath = "storageBasePath",
  GptModel = "gptModel",
  GptMaxTokens = "gptMaxTokens",
  SplashFetchNews = "splashFetchHeadlines",
}

export type JsonPrimitive = string | number | boolean;

export type JsonValue =
  | JsonPrimitive
  | JsonPrimitive[]
  | Record<string, JsonPrimitive>;

export type StaticType<T extends RuntimeType> = T extends "string"
  ? string
  : T extends "number"
  ? number
  : T extends "boolean"
  ? boolean
  : T extends "array"
  ? JsonValue[]
  : T extends "object"
  ? JsonValue
  : never;

export type ConfigContents = {
  [key in ConfigKey]: JsonValue;
};

export type RuntimeType = "string" | "number" | "boolean" | "array" | "object";

// TODO: Need to validate that the existing config file is valid JSON & also has all the required keys, this should happen on startup. Perhaps define a boot function that performs validation and sanity checks, and then starts the app.
abstract class Config {
  static writeDefaults(): void {
    // Create the config directory if it doesn't exist, since
    // `fs.writeFileSync()` will not automatically create the directory.
    if (!fs.existsSync(CACHE_PATH)) {
      // Use recursion in case that the base path is nested.
      fs.mkdirSync(CACHE_PATH, { recursive: true });
    }

    fs.writeFileSync(CONFIG_FILE_PATH(), JSON.stringify(DEFAULT_CONFIG));

    Output.write({
      text: `Wrote default config to '${CONFIG_FILE_PATH()}'`,
      logLevel: LogLevel.Verbose,
      namespace: Namespace.Config,
    });
  }

  static readContents(): ConfigContents {
    if (!fs.existsSync(CONFIG_FILE_PATH())) {
      Config.writeDefaults();
    }

    // CONSIDER: Caching this.
    const contents = fs.readFileSync(CONFIG_FILE_PATH(), "utf-8");

    return JSON.parse(contents);
  }

  static write(key: ConfigKey, value: JsonValue): void {
    const existingContents = Config.readContents();

    const patchedContents: ConfigContents = {
      ...existingContents,
      [key]: value,
    };

    fs.writeFileSync(CONFIG_FILE_PATH(), JSON.stringify(patchedContents));

    Output.write({
      text: `Set '${key}' to '${value}'`,
      logLevel: LogLevel.Verbose,
      namespace: Namespace.Config,
    });
  }

  static readAsString(key: ConfigKey): string {
    return Config.readContents()[key].toString();
  }

  static read<Value extends RuntimeType>(
    key: ConfigKey,
    type: Value
  ): StaticType<Value> {
    const value = Config.readContents()[key];

    if (!isOfType<Value>(value, type)) {
      throw new Error(`Config value '${key}' is not of type '${type}'`);
    }

    return value;
  }
}

export default Config;
