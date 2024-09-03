import * as github from "@actions/github";
import * as core from "@actions/core";
import {LogLintResult} from "./loglint";
import {ActionInput} from "./input";

async function getTargetJobURL(githubToken: string, runId: number, jobName: string, stepName: string, targetLogFile: string): Promise<string | null> {
  const octokit = github.getOctokit(githubToken);
  const repo = {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
  };
  // const runId = github.context.runId;
  const {data: jobs} = await octokit.rest.actions.listJobsForWorkflowRun({
    ...repo,
    run_id: runId
  });

  const job = jobs.jobs.find(job => job.name === jobName);
  if (!job) {
    console.debug(`jobName not found: ${jobName} in ${jobs.jobs.map(job => job.name).join(", ")}`);
    return null;
  }

  // XXX: not working if build failed.
  const buildStep = job.steps?.find(step => step.name === stepName);
  if (!buildStep) {
    console.debug(`stepName not found: ${stepName} in ${job.steps?.map(step => step.name).join(", ")}`);
    return null;
  }
  const stepNumber = buildStep.number;

  // get step number from log file name `jobName/<step_number>_<stepName>.txt`
  // const match = targetLogFile.match(/\/(\d+)_[^\/]+\.txt$/);
  // if (match === null) {
  //   console.debug(`stepNumber not found in filePath: ${targetLogFile}`);
  //   return null;
  // }
  // const stepNumber = match[1];
  return `${job.html_url}#step:${stepNumber}`;
}

function createLogLinkText(baseURL: string | null, match: { start: number, end: number, message: string }): string {
  const link = (baseURL === null) ? `L${match.start},${match.end}` : `[L${match.start},${match.end}](${baseURL}:${match.start})`;
  return link;
  //  + '```text\n' + match.message + '\n```\n';
}
//
// return `[L${match.start},${match.end}](${baseURL}:${match.start}) \n\n`
//   + '```text\n'
//   + match.message
//   + '\n```\n'
// }

export async function writeSummary(json: LogLintResult, input: ActionInput, targetLogFile: string) {
  const baseURL = await getTargetJobURL(input.githubToken, input.runId, input.jobName, input.stepName, targetLogFile);
  console.log("writeSummary: json=", JSON.stringify(json));
  console.log("baseURL: ", baseURL);
  if (json.errors) {
    const errorCount = json.errors.length;
    let summary = core.summary.addHeading(`Errors (${errorCount})`, 2);
    for (const error of json.errors) {
      const items: string[] = error.matches.map(x =>
        createLogLinkText(baseURL, x) + '\n\n```text\n' + x.message + '\n```\n'
      );
      const statement = `<details><summary>${error.name}</summary>`
        + '\n\n'
        + items.join("\n")
        + '\n</details>\n';
      summary = summary.addRaw(statement);
    }
    await summary.write();
  }
}
