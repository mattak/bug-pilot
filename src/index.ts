import * as core from '@actions/core';
import * as github from '@actions/github';
import * as os from 'os';
import * as fs from 'fs';
import {spawnSync} from "node:child_process";

type LogLintResult = {
  passed: boolean,
  errors?: [
    {
      matches: [
        { start: number, end: number, message: string }
      ],
      help: string,
      name: string,
    },
  ],
}

function getExecType(): string {
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

async function writeSummary(json: LogLintResult) {
  console.log("writeSummary: json=", JSON.stringify(json));
  if (json.errors) {
    const errorCount = json.errors.length;
    let summary = core.summary.addHeading(`Errors (${errorCount})`, 2);
    for (const error of json.errors) {
      const items: string[] = error.matches.map(x =>
        `LINE: ${x.start},${x.end}\n`
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

async function run() {
  try {
    const logFile = core.getInput('log_file');
    core.info(`Target log file: ${logFile}!`);
    core.info(`Event: ${github.context.eventName}`);
    const platform = getExecType();
    const execPath = `${__dirname}/bin/${platform}/loglint`;
    const lintPath = `${__dirname}/.loglint.json`;

    // spawnSyncでコマンドを実行し、inputとしてファイル内容を渡す
    const inputContent = fs.readFileSync(logFile, {encoding: 'utf-8'});
    const result = spawnSync(execPath, ['-f', lintPath], {
      input: inputContent,
      encoding: 'utf-8'
    });

    if (result.status === 0) {
      console.log(`Stdout: ${result.stdout}`);
      core.setOutput('result', result.stdout);
      const lintResult = JSON.parse(result.stdout);
      await writeSummary(lintResult);
    } else {
      console.log(`Stdout: ${result.stdout}`);
      console.error(`Stderr: ${result.stderr}`);
      core.setFailed(`Stderr: ${result.stderr}`);
    }

  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed(`An unexpected error occurred: ${error}`);
    }
  }
}

run();