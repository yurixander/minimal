import * as fs from "node:fs";
import * as path from "node:path";
import LineBuffer from "../lineBuffer.js";
import { Command, CommandDef } from "../types.js";

const l: Command = (_args, context) => {
  const all = fs.readdirSync(context.workingDirectory);
  const filePaths = all.filter((file) => fs.statSync(file).isFile());
  const folderPaths = all.filter((file) => fs.statSync(file).isDirectory());
  const buffer = new LineBuffer();

  for (const folderPath of folderPaths) {
    const folderName = path.basename(folderPath);

    buffer.pushListItem({
      text: folderName,
      color: "cyan",
    });
  }

  for (const filePath of filePaths) {
    const fileName = path.basename(filePath);

    buffer.pushListItem({
      text: fileName,
      color: "white",
    });
  }

  return [buffer];
};

export default {
  execute: l,
  description: "List the contents of the current directory.",
} satisfies CommandDef;
