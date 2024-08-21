import * as core from '@actions/core';
import * as github from '@actions/github';
import * as os from 'os';
import { execSync } from 'child_process';
import * as fs from 'fs';
import {spawnSync} from "node:child_process";

function getExecType(): string {
  const _operatingSystem = os.platform(); // e.g. 'darwin', 'win32', 'linux'
  const _architecture = os.arch(); // e.g. 'x64', 'arm', 'arm64'

  let operatingSystem = '';
  switch (_operatingSystem) {
    case 'darwin':
      operatingSystem = 'macos';
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
      return `${operatingSystem}_x64`;
    case 'arm':
      return `${operatingSystem}_arm`;
    case 'arm64':
      return `${operatingSystem}_arm64`;
    default:
      throw new Error(`Unsupported architecture: ${_architecture}`);
  }
}

async function run() {
  try {
    const logFile = core.getInput('log_file');
    core.info(`Target log file: ${logFile}!`);
    core.info(`Event: ${github.context.eventName}`);
    const platform = getExecType();
    const execPath = `${__dirname}/../bin/${platform}/loglint`;

    // spawnSyncでコマンドを実行し、inputとしてファイル内容を渡す
    const inputContent = fs.readFileSync(logFile, { encoding: 'utf-8' });
    const result = spawnSync(execPath, [], {
      input: inputContent,
      encoding: 'utf-8'
    });

    if (result.error) {
      console.error(`Error: ${result.error.message}`);
    } else {
      console.log(`Stdout: ${result.stdout}`);
      console.error(`Stderr: ${result.stderr}`);
    }

  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();