"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeSummary = writeSummary;
const github = __importStar(require("@actions/github"));
const core = __importStar(require("@actions/core"));
async function getTargetJobURL(githubToken, jobName, stepName, targetLogFile) {
    const octokit = github.getOctokit(githubToken);
    const repo = {
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
    };
    const runId = github.context.runId;
    const { data: jobs } = await octokit.rest.actions.listJobsForWorkflowRun({
        ...repo,
        run_id: runId
    });
    const job = jobs.jobs.find(job => job.name === jobName);
    if (!job) {
        console.debug(`jobName not found: ${jobName} in ${jobs.jobs.map(job => job.name).join(", ")}`);
        return null;
    }
    // XXX: not working if build failed.
    // const buildStep = job.steps?.find(step => step.name === stepName);
    // if (!buildStep) {
    //   console.debug(`stepName not found: ${stepName} in ${job.steps?.map(step => step.name).join(", ")}`);
    //   return null;
    // }
    // const stepNumber = buildStep.number;
    // get step number from log file name `jobName/<step_number>_<stepName>.txt`
    const match = targetLogFile.match(/\/(\d+)_[^\/]+\.txt$/);
    if (match === null) {
        console.debug(`stepNumber not found in filePath: ${targetLogFile}`);
        return null;
    }
    const stepNumber = match[1];
    return `${job.html_url}#step:${stepNumber}`;
}
function createLogLinkText(baseURL, match) {
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
async function writeSummary(json, input, targetLogFile) {
    const baseURL = await getTargetJobURL(input.githubToken, input.jobName, input.stepName, targetLogFile);
    console.log("writeSummary: json=", JSON.stringify(json));
    console.log("baseURL: ", baseURL);
    if (json.errors) {
        const errorCount = json.errors.length;
        let summary = core.summary.addHeading(`Errors (${errorCount})`, 2);
        for (const error of json.errors) {
            const items = error.matches.map(x => createLogLinkText(baseURL, x) + '\n\n```text\n' + x.message + '\n```\n');
            const statement = `<details><summary>${error.name}</summary>`
                + '\n\n'
                + items.join("\n")
                + '\n</details>\n';
            summary = summary.addRaw(statement);
        }
        await summary.write();
    }
}
