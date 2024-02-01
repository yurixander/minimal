import { LogLevel } from "./types.js";

export type StateOpts = {
  workingDirectory: string;
  logLevel: LogLevel;
  prompt: string[];
};

export class State {
  readonly workingDirectory: string;
  readonly logLevel: LogLevel;
  readonly prompt_: string[];

  constructor(opts: StateOpts) {
    this.workingDirectory = opts.workingDirectory;
    this.logLevel = opts.logLevel;
    this.prompt_ = opts.prompt;
  }

  get prompt(): string[] {
    return [...this.prompt_];
  }

  with(opts: Partial<StateOpts>): State {
    return new State({
      workingDirectory: opts.workingDirectory ?? this.workingDirectory,
      logLevel: opts.logLevel ?? this.logLevel,
      prompt: opts.prompt ?? this.prompt,
      ...opts,
    });
  }

  clone(): State {
    return this.with({});
  }
}
