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
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const node_child_process_1 = require("node:child_process");
function getExecType() {
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
        const result = (0, node_child_process_1.spawnSync)(execPath, [], {
            input: inputContent,
            encoding: 'utf-8'
        });
        if (result.error) {
            console.error(`Error: ${result.error.message}`);
        }
        else {
            console.log(`Stdout: ${result.stdout}`);
            console.error(`Stderr: ${result.stderr}`);
        }
    }
    catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
    }
}
run();
