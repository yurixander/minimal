import * as fs from "node:fs";
import * as path from "node:path";
import Output from "../output.js";
import { Command, CommandDef, LineVariant } from "../types.js";

const l: Command = (_args, context) => {
  const all = fs.readdirSync(context.workingDirectory);
  const filePaths = all.filter((file) => fs.statSync(file).isFile());
  const folderPaths = all.filter((file) => fs.statSync(file).isDirectory());

  for (const folderPath of folderPaths) {
    const folderName = path.basename(folderPath);

    Output.write({
      text: folderName,
      color: "cyan",
      variant: LineVariant.ListItem,
    });
  }

  for (const filePath of filePaths) {
    const fileName = path.basename(filePath);

    Output.write({
      text: fileName,
      color: "white",
      variant: LineVariant.ListItem,
    });
  }
};

export default {
  execute: l,
  description: "List the contents of the current directory.",
} satisfies CommandDef;
