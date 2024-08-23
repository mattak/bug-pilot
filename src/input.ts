import os from "os";
import * as core from "@actions/core";
import * as fs from "node:fs";

export type ActionInput = {
  logFile: string,
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
  if (!fs.existsSync(input.logFile)) return [false, `ERROR: logFile is not found: ${input.logFile}`];
  return [true, ""];
}

export function parseInput(): ActionInput {
  const logFile = core.getInput('log_file', {required: true});
  const stepName = core.getInput('step_name', {required: false});
  const jobName = core.getInput('job_name', {required: false});
  const githubToken = core.getInput('github_token', {required: true});

  return {
    logFile,
    jobName,
    stepName,
    githubToken,
  };
}

