import * as core from '@actions/core';
import * as github from '@actions/github';
import * as fs from 'fs';
import axios from "axios";
import path from "node:path";
import * as unzipper from 'unzipper';
import {parseInput, validateInput} from "./input";
import {spawnSync} from "node:child_process";
import {writeSummary} from "./summary_writer";

type Headers = {
  'User-Agent': string,
  'Authorization': string,
};

async function requestLogUrl(owner: string, repo: string, runId: string, headers: Headers): Promise<string> {
  // GitHub APIリクエストの設定
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}`;
  // ログURLを取得
  const response = await axios.get(apiUrl, {headers});
  return response.data.logs_url;
}

async function downloadLogZip(logUrl: string, headers: Headers): Promise<string> {
  // ログファイルをダウンロード
  const logResponse = await axios.get(logUrl, {
    headers,
    responseType: 'arraybuffer', // バイナリデータとして取得
  });

  const outputPath = path.join(process.cwd(), 'log.zip');
  fs.writeFileSync(outputPath, logResponse.data);
  return outputPath;
}

async function getFilesRecursively(directory: string): Promise<string[]> {
  let files: string[] = [];
  const items = await fs.promises.readdir(directory, {withFileTypes: true});

  for (const item of items) {
    const fullPath = path.join(directory, item.name);
    if (item.isDirectory()) {
      const nestedFiles = await getFilesRecursively(fullPath);
      files = files.concat(nestedFiles);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

async function unzipLogFile(zipFilePath: string): Promise<string[]> {
  const extractPath = path.join(process.cwd(), 'tmp');
  await fs.promises.mkdir(extractPath, {recursive: true});

  const directory = await unzipper.Open.file(zipFilePath);
  await directory.extract({path: extractPath});

  return await getFilesRecursively(extractPath);
}

function getTargetLogFile(files: string[], jobName: string, stepName: string): string | null {
  const targetFile = files.find((file) => {
    const segments = file.split('/');
    return segments.length > 2
      && segments[segments.length - 2] == jobName
      && segments[segments.length - 1].includes(stepName);
  });

  return targetFile || null;
}

async function run() {
  try {
    // 必要な入力を取得
    const input = await parseInput();
    const token = input.githubToken;
    const runId = input.runId;
    const owner = github.context.repo.owner;
    const repo = github.context.repo.repo;
    const userAgent = "actions-bug-pilot";
    const headers = {
      'User-Agent': userAgent,
      'Authorization': `token ${token}`,
    };

    const [isValid, invalidMessage] = validateInput(input);
    if (!isValid) {
      core.setFailed(invalidMessage);
      return;
    }

    // 1. Log URLを取得
    const logUrl = await requestLogUrl(owner, repo, runId, headers);
    if (!logUrl) throw new Error('Failed to retrieve logs URL.');
    core.info(`Log URL: ${logUrl}`);

    // 2. LogZipをダウンロード
    const logZipFilePath = await downloadLogZip(logUrl, headers);

    // 3. LogZipを解凍して中身のファイル一覧を取得
    const unzippedFiles = await unzipLogFile(logZipFilePath);
    core.info(`logZipFilePath: ${logZipFilePath}`);
    core.info(`unzipped files: ${unzippedFiles.join(', ')}`)
    unzippedFiles.forEach((file) => {
      core.info(" " + file);
    });

    // 4. LogFileの中から対象のファイルを取得
    const targetLogFile = getTargetLogFile(unzippedFiles, input.jobName, input.stepName);
    if (!targetLogFile) throw new Error('Failed to find target log file.');
    core.info(`targetLogFile: ${targetLogFile}`);

    // 5. LogLintを実行
    const platform = 'linux_amd64';
    const execPath = `${__dirname}/bin/${platform}/loglint`;
    const lintPath = `${__dirname}/.loglint.json`;

    // spawnSyncでコマンドを実行し、inputとしてファイル内容を渡す
    const inputContent = fs.readFileSync(targetLogFile, {encoding: 'utf-8'});
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