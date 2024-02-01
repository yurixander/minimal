import * as fs from "node:fs";
import * as path from "node:path";
import Output from "../output.js";
import { Command, CommandDef, LineVariant } from "../types.js";
import chalk from "chalk";
import { filesize } from "filesize";

const l: Command = (_args, state) => {
  const all = fs.readdirSync(state.workingDirectory);
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
    const fileExtension = path.extname(filePath);
    const fileName = path.basename(filePath, fileExtension);
    const fileSize = filesize(fs.statSync(filePath).size).split(" ").join("");

    Output.write({
      text: fileName,
      color: "white",
      variant: LineVariant.ListItem,
      suffixes: [chalk.green(fileExtension), chalk.gray(fileSize)],
    });
  }
};

export default {
  execute: l,
  description: "List the contents of the current directory.",
} satisfies CommandDef;
