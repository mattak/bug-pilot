import * as github from "@actions/github";
import * as core from "@actions/core";
import {LogLintResult} from "./loglint";
import {ActionInput} from "./input";

async function getTargetJobURL(githubToken: string, jobName: string, stepName: string): Promise<string | null> {
  const octokit = github.getOctokit(githubToken);
  const repo = {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
  };
  const runId = github.context.runId;
  const {data: jobs} = await octokit.rest.actions.listJobsForWorkflowRun({
    ...repo,
    run_id: runId
  });

  const job = jobs.jobs.find(job => job.name === jobName);
  if (!job) return null;

  const buildStep = job.steps?.find(step => step.name === stepName);
  if (!buildStep) return null;

  const stepNumber = buildStep.number;
  return `${job.run_url}/job/${job.id}#step:${stepNumber}`;
}

export async function writeSummary(json: LogLintResult, input: ActionInput) {
  const baseURL = await getTargetJobURL(input.githubToken, input.jobName, input.stepName);
  console.log("writeSummary: json=", JSON.stringify(json));
  console.log("baseURL: ", baseURL);
  if (json.errors) {
    const errorCount = json.errors.length;
    let summary = core.summary.addHeading(`Errors (${errorCount})`, 2);
    for (const error of json.errors) {
      const items: string[] = error.matches.map(x =>
        `[L${x.start},${x.end}](${baseURL}:${x.start})\n\n`
        + '```text\n'
        + x.message
        + '\n```\n'
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
