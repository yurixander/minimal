import fs from "node:fs";
import path from "node:path";
import Config, {
  ConfigKey,
  JsonValue,
  RuntimeType,
  StaticType,
} from "./config.js";
import Output from "./output.js";
import { LogLevel, Namespace } from "./types.js";
import { isOfType } from "./util.js";

// REVIEW: Any way of directly specifying the value type, perhaps with something like `[Key (string), RuntimeType]`?
export type GptStorageKey =
  | "context"
  | "model"
  | "maxMessageHistoryLength"
  | "maxTokens";

export type StoreName = "gpt";

export type StorageKey<T extends StoreName> = T extends "gpt"
  ? GptStorageKey
  : never;

export type Store<T extends StoreName> = Record<
  StorageKey<T>,
  JsonValue | undefined
>;

abstract class Storage {
  private static readCache: Map<StoreName, Store<StoreName>> = new Map();

  private static requireStorePath(storeName: StoreName): string {
    const storageBasePath = Config.read(ConfigKey.StorageBasePath, "string");

    if (!fs.existsSync(storageBasePath)) {
      fs.mkdirSync(storageBasePath, { recursive: true });
    }

    return path.join(storageBasePath, `${storeName}.json`);
  }

  static read<T extends StoreName>(storeName: T): Store<T> {
    const existingStore = Storage.readCache.get(storeName);

    if (existingStore !== undefined) {
      return existingStore;
    }

    const storePath = this.requireStorePath(storeName);

    // Write default storage if it doesn't exist.
    if (!fs.existsSync(storePath)) {
      fs.writeFileSync(storePath, JSON.stringify({}));
    }

    const contents = fs.readFileSync(storePath, "utf-8");
    const store: Store<T> = JSON.parse(contents);

    Storage.readCache.set(storeName, store);

    return store;
  }

  static write<T extends StoreName>(
    storeName: StoreName,
    store: Store<T>
  ): void {
    fs.writeFileSync(this.requireStorePath(storeName), JSON.stringify(store));

    // Invalidate entry in cache if it exists.
    if (Storage.readCache.has(storeName)) {
      Storage.readCache.delete(storeName);

      Output.write({
        text: `${storeName} was updated, so its cache was invalidated`,
        namespace: Namespace.Storage,
        logLevel: LogLevel.Debug,
      });
    }
  }

  static patch<T extends StoreName>(
    storeName: StoreName,
    patch: Partial<Store<T>>
  ): void {
    const store = Storage.read(storeName);

    const patchedStore = {
      ...store,
      ...patch,
    };

    Storage.write(storeName, patchedStore);
  }

  static getOrDefault<Key extends StoreName, Value extends RuntimeType>(
    storeKey: Key,
    key: StorageKey<Key>,
    defaultValue: StaticType<Value>,
    type: Value
  ): StaticType<Value> {
    const store = Storage.read(storeKey);

    // FIXME: Proper type for this value, it should be `JsonValue | undefined`.
    const value = store[key];

    // The key-value pair may not have been set yet.
    if (value === undefined) {
      return defaultValue;
    }

    if (!isOfType(value, type)) {
      throw new Error(`Value is not of type '${type}'`);
    }

    return value ?? defaultValue;
  }
}

export default Storage;
