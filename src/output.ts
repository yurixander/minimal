import chalk from "chalk";
import {
  Line,
  LineOverrides,
  LineVariant,
  LogColor,
  LogLevel,
} from "./types.js";
import { joinSegments } from "./util.js";

abstract class Output {
  private static display(line: Line, logLevel: LogLevel): void {
    // TODO: Need to ignore empty lines, but here?
    if (line.logLevel > logLevel) {
      return;
    }

    const logger: (message: string) => void = {
      [LogLevel.Info]: console.log,
      [LogLevel.Debug]: console.debug,
      [LogLevel.Verbose]: console.debug,
      [LogLevel.Error]: console.error,
      [LogLevel.Warning]: console.warn,
    }[line.logLevel];

    const namespace =
      line.namespace !== undefined
        ? chalk.gray(`@${chalk.green(line.namespace)}`)
        : "";

    const variantStyle = this.getLineVariantPrefix(line.variant);

    // FIXME: Color is still getting stripped. Could it be because of the logger?
    const mainContent = line.preserveColor
      ? line.text
      : this.colorize(line.text, line.color);

    const segments = [namespace, variantStyle, mainContent];
    const text = joinSegments(segments);

    // Avoid displaying empty lines.
    if (text !== null) {
      logger(text);
    }
  }

  static getColorFromLogLevel(logLevel: LogLevel): LogColor {
    switch (logLevel) {
      case LogLevel.Info:
        return "gray";
      case LogLevel.Warning:
        return "yellow";
      case LogLevel.Error:
        return "red";
      case LogLevel.Verbose:
        return "gray";
      case LogLevel.Debug:
        return "magenta";
    }
  }

  static colorize(text: string, color: LogColor): string {
    return chalk[color](text);
  }

  static getLineVariantPrefix(variant: LineVariant): string {
    const SPACING = " ";

    return {
      [LineVariant.Normal]: "",
      [LineVariant.ListHeader]: chalk.green("◆"),
      [LineVariant.ListItem]: chalk.gray(`${SPACING}.`),
    }[variant];
  }

  static newLine(): void {
    this.write({ text: "" });
  }

  static writeRaw(textChunk: string): void {
    process.stdout.write(textChunk);
  }

  static write(overrides: LineOverrides): void {
    const logLevel = overrides.logLevel ?? LogLevel.Info;

    this.display(
      {
        variant: LineVariant.Normal,
        logLevel,
        color: this.getColorFromLogLevel(logLevel),
        ...overrides,
      },
      // TODO: Use a static singleton for this. Right now it has no effect as an argument since its taken from the overrides.
      logLevel
    );
  }

  static writeSimple(text: string, logLevel = LogLevel.Info): void {
    this.write({ text, logLevel });
  }

  static error(text: string): void {
    this.write({ text, logLevel: LogLevel.Error });
  }
}

export default Output;
