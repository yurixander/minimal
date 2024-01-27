import {
  Line,
  LineOverrides,
  LineVariant,
  LogColor,
  LogLevel,
} from "./types.js";

function getColorFromLogLevel(logLevel: LogLevel): LogColor {
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

class LineBuffer {
  static get empty(): LineBuffer {
    return new LineBuffer();
  }

  private readonly lines: Line[];

  constructor() {
    this.lines = [];
  }

  pushWithDefaults(overrides: LineOverrides): void {
    const logLevel = overrides.logLevel ?? LogLevel.Info;

    this.lines.push({
      variant: LineVariant.Normal,
      logLevel,
      color: getColorFromLogLevel(logLevel),
      ...overrides,
    });
  }

  push(text: string, logLevel = LogLevel.Info): void {
    this.pushWithDefaults({ text, logLevel });
  }

  pushListHeader(text: string): void {
    this.pushWithDefaults({
      text,
      variant: LineVariant.ListHeader,
      logLevel: LogLevel.Debug,
    });
  }

  pushListItem(overrides: LineOverrides): void {
    this.pushWithDefaults({
      ...overrides,
      variant: LineVariant.ListItem,
    });
  }

  pushLine(line: Line): void {
    this.lines.push(line);
  }

  extend(other: LineBuffer): void {
    this.lines.push(...other.lines);
  }

  getLines(): Line[] {
    return [...this.lines];
  }
}

export default LineBuffer;
