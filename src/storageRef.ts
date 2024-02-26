import _ from "lodash";
import { RuntimeType, StaticType } from "./config.js";
import Storage, { StorageKey, StoreName } from "./storage.js";

class StorageRef<Name extends StoreName, Value extends RuntimeType> {
  readonly storeName: Name;
  readonly key: StorageKey<Name>;
  readonly defaultValue: StaticType<Value>;
  readonly type: Value;

  constructor(
    store: Name,
    key: StorageKey<Name>,
    defaultValue: StaticType<Value>,
    type: Value
  ) {
    this.storeName = store;
    this.key = key;
    this.defaultValue = defaultValue;
    this.type = type;
  }

  get value(): StaticType<Value> {
    return Storage.getOrDefault<Name, Value>(
      this.storeName,
      this.key,
      this.defaultValue,
      this.type
    );
  }

  set value(newValue: StaticType<Value>) {
    Storage.patch(this.storeName, {
      [this.key]: newValue,
    });
  }

  get isDefault(): boolean {
    return this.value === this.defaultValue;
  }

  transform(f: (currentValue: StaticType<Value>) => StaticType<Value>[]): void {
    const newValue = f(_.cloneDeep(this.value));

    Storage.patch(this.storeName, {
      [this.key]: newValue,
    });
  }

  reset(): void {
    Storage.patch(this.storeName, {
      [this.key]: this.defaultValue,
    });
  }
}

export default StorageRef;
