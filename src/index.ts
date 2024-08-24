import * as core from '@actions/core';
import * as github from '@actions/github';
import * as fs from 'fs';
import {spawnSync} from "node:child_process";
import {writeSummary} from "./summary_writer";
import {getExecType, parseInput, validateInput} from "./input";
import axios from "axios";
import path from "node:path";

async function run() {
  try {
    // 必要な入力を取得
    const token = core.getInput('github-token', {required: true});
    const runId = github.context.runId;
    const owner = github.context.repo.owner;
    const repo = github.context.repo.repo;

    // GitHub APIリクエストの設定
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`;
    const headers = {
      'User-Agent': 'Awesome-Curl-Client',
      'Authorization': `token ${token}`,
    };

    // ログURLを取得
    const response = await axios.get(apiUrl, {headers});
    const logUrl = response.data.logs_url;

    if (!logUrl) {
      throw new Error('Failed to retrieve logs URL.');
    }

    core.info(`Log URL: ${logUrl}`);

    // ログファイルをダウンロード
    const logResponse = await axios.get(logUrl, {
      headers,
      responseType: 'arraybuffer', // バイナリデータとして取得
    });

    const outputPath = path.join(process.cwd(), 'tmp.zip');
    fs.writeFileSync(outputPath, logResponse.data);

    core.info(`Logs have been downloaded to ${outputPath}`);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`Action failed with error: ${error.message}`);
    } else {
      core.setFailed(`An unexpected error occurred: ${error}`);
    }
  }
}


// async function run() {
//   try {
//     const input = parseInput();
//     const logFile = input.logFile;
//     core.info(`Input: ${JSON.stringify(input.logFile)}!`);
//     core.info(`Event: ${github.context.eventName}`);
//
//     const [isValid, errorMessage] = validateInput(input);
//     if (!isValid) {
//       core.setFailed(errorMessage);
//       return;
//     }
//
//     const platform = getExecType();
//     const execPath = `${__dirname}/bin/${platform}/loglint`;
//     const lintPath = `${__dirname}/.loglint.json`;
//
//     // spawnSyncでコマンドを実行し、inputとしてファイル内容を渡す
//     const inputContent = fs.readFileSync(logFile, {encoding: 'utf-8'});
//     const result = spawnSync(execPath, ['-f', lintPath], {
//       input: inputContent,
//       encoding: 'utf-8'
//     });
//
//     if (result.status === 0) {
//       console.log(`Stdout: ${result.stdout}`);
//       core.setOutput('result', result.stdout);
//       const lintResult = JSON.parse(result.stdout);
//       await writeSummary(lintResult, input);
//     } else {
//       console.log(`Stdout: ${result.stdout}`);
//       console.error(`Stderr: ${result.stderr}`);
//       core.setFailed(result.stderr);
//     }
//
//   } catch (error) {
//     if (error instanceof Error) {
//       core.setFailed(error.message);
//     } else {
//       core.setFailed(`An unexpected error occurred: ${error}`);
//     }
//   }
// }

run();