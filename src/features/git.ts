import chalk from "chalk";
import _ from "lodash";
import path from "node:path";
import { simpleGit } from "simple-git";
import { AppEvent, Feature, FeatureDef, PromptIndex } from "../types.js";

const git: Feature = async (event, context) => {
  if (event !== AppEvent.WorkingDirectoryChanged) {
    return;
  }

  const git = simpleGit(context.workingDirectory);
  const nextContext = _.cloneDeep(context);

  if (!(await git.checkIsRepo())) {
    delete nextContext.prompt[PromptIndex.GitBranch];

    return nextContext;
  }

  const repoName = path.basename(await git.revparse(["--show-toplevel"]));
  const branchSummary = await git.branchLocal();

  const branchName =
    branchSummary.current === "" ? "HEAD" : branchSummary.current;

  const promptSegment = chalk.gray(
    `${chalk.green(repoName)}(${chalk.blue(branchName)})`
  );

  nextContext.prompt[PromptIndex.GitBranch] = promptSegment;

  return nextContext;
};

export default {
  listener: git,
  description:
    "Useful Git integration, including displaying the branch name in prompt.",
} satisfies FeatureDef;
