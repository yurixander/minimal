import chalk from "chalk";
import {
  Line,
  LineOverrides,
  LineVariant,
  LogColor,
  LogLevel,
} from "./types.js";
import { clipString, joinSegments } from "./util.js";
import { LINE_CLIP_LENGTH } from "./constants.js";
import assert from "assert";

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

    const clippedMainContent =
      line.clip === true
        ? clipString(mainContent, LINE_CLIP_LENGTH)
        : mainContent;

    const emoji = line.emoji !== undefined ? line.emoji : "";

    const suffix =
      line.suffixes !== undefined ? joinSegments(line.suffixes) : "";

    assert(
      suffix !== null,
      "Suffixes array should contain at least one item if it was passed as an argument"
    );

    const segments = [
      namespace,
      variantStyle,
      emoji,
      clippedMainContent,
      suffix,
    ];

    const lineText = joinSegments(segments);

    // Avoid logging empty newlines.
    if (lineText !== null) {
      logger(lineText);
    }
  }

  static getColorFromLogLevel(logLevel: LogLevel): LogColor {
    return (
      {
        [LogLevel.Info]: "gray",
        [LogLevel.Warning]: "yellow",
        [LogLevel.Error]: "red",
        [LogLevel.Verbose]: "gray",
        [LogLevel.Debug]: "magenta",
      } satisfies Record<LogLevel, LogColor>
    )[logLevel];
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
    this.writeRaw("\n");
  }

  static writeRaw(textChunk: string): void {
    // REVIEW: Might need to manually flush the stream here, since it seems to be getting overwritten by other console logs.
    if (process.stdout.writable) {
      process.stdout.write(textChunk);
    }
  }

  static write(overrides: LineOverrides): void {
    // REVISE: Merge this with the `display` method.

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
    this.write({ text, logLevel: LogLevel.Error, emoji: "🤔" });
  }
}

export default Output;
