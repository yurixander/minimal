import { LogLevel } from "./types.js";

export type ContextOpts = {
  workingDirectory: string;
  logLevel: LogLevel;
  prompt: string[];
};

export class Context {
  readonly workingDirectory: string;
  readonly logLevel: LogLevel;
  readonly prompt_: string[];

  constructor(opts: ContextOpts) {
    this.workingDirectory = opts.workingDirectory;
    this.logLevel = opts.logLevel;
    this.prompt_ = opts.prompt;
  }

  get prompt(): string[] {
    return [...this.prompt_];
  }

  with(opts: Partial<ContextOpts>): Context {
    return new Context({
      workingDirectory: opts.workingDirectory ?? this.workingDirectory,
      logLevel: opts.logLevel ?? this.logLevel,
      prompt: opts.prompt ?? this.prompt,
      ...opts,
    });
  }

  clone(): Context {
    return this.with({});
  }
}
