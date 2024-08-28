import os from "os";
import * as github from "@actions/github";
import * as core from "@actions/core";
import * as fs from "node:fs";

export type ActionInput = {
  // logFile: string,
  runId: string,
  jobName: string,
  stepName: string,
  githubToken: string,
}

export function getExecType(): string {
  const _operatingSystem = os.platform(); // e.g. 'darwin', 'win32', 'linux'
  const _architecture = os.arch(); // e.g. 'x64', 'arm', 'arm64'

  let operatingSystem = '';
  switch (_operatingSystem) {
    case 'darwin':
      operatingSystem = 'darwin';
      break;
    case 'win32':
      operatingSystem = 'windows';
      break;
    case 'linux':
      operatingSystem = 'linux';
      break;
    default:
      throw new Error(`Unsupported operating system: ${_operatingSystem}`);
  }

  switch (_architecture) {
    case 'x64':
      return `${operatingSystem}_amd64`;
    case 'amd64':
      return `${operatingSystem}_amd64`;
    case 'arm64':
      return `${operatingSystem}_arm64`;
    default:
      throw new Error(`Unsupported architecture: ${_architecture}`);
  }
}

export function validateInput(input: ActionInput): [boolean, string] {
  if (input.githubToken === "") return [false, "ERROR: github-token is not set."];
  return [true, ""];
}

export function parseInput(): Promise<ActionInput> {
  // const logFile = core.getInput('log-file', {required: true});
  const runId = core.getInput('run-id', {required: true});
  const stepName = core.getInput('step-name', {required: false});
  const jobName = core.getInput('job-name', {required: false});
  const githubToken = process.env.GITHUB_TOKEN;
  if (githubToken === undefined) return Promise.reject("ERROR: Environment variable GITHUB_TOKEN is not set.");

  return Promise.resolve({
    runId,
    jobName,
    stepName,
    githubToken,
  });
}
