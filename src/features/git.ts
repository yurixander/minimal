import chalk from "chalk";
import _ from "lodash";
import path from "node:path";
import { simpleGit } from "simple-git";
import {
  AppEvent,
  FeatureDef,
  FeatureListener,
  PromptIndex,
} from "../types.js";

const git: FeatureListener = async (event, state) => {
  if (event !== AppEvent.WorkingDirectoryChanged) {
    return;
  }

  const git = simpleGit(state.workingDirectory);
  const nextState = _.cloneDeep(state);

  if (!(await git.checkIsRepo())) {
    delete nextState.prompt[PromptIndex.GitBranch];

    return nextState;
  }

  const repoName = path.basename(await git.revparse(["--show-toplevel"]));
  const branchSummary = await git.branchLocal();

  const branchName =
    branchSummary.current === "" ? "HEAD" : branchSummary.current;

  const promptSegment = chalk.gray(
    `${chalk.green(repoName)}(${chalk.blue(branchName)})`
  );

  nextState.prompt[PromptIndex.GitBranch] = promptSegment;

  return nextState;
};

export default {
  listener: git,
  description:
    "Useful Git integration, including displaying the branch name in prompt.",
} satisfies FeatureDef;
