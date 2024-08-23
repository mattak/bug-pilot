import * as core from '@actions/core';
import * as github from '@actions/github';
import * as fs from 'fs';
import {spawnSync} from "node:child_process";
import {writeSummary} from "./summary_writer";
import {getExecType, parseInput, validateInput} from "./input";

async function run() {
  try {
    const input = parseInput();
    const logFile = input.logFile;
    core.info(`Input: ${JSON.stringify(input.logFile)}!`);
    core.info(`Event: ${github.context.eventName}`);

    const [isValid, errorMessage] = validateInput(input);
    if (!isValid) {
      core.setFailed(errorMessage);
      return;
    }

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
      await writeSummary(lintResult, input);
    } else {
      console.log(`Stdout: ${result.stdout}`);
      console.error(`Stderr: ${result.stderr}`);
      core.setFailed(result.stderr);
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