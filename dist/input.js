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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExecType = getExecType;
exports.validateInput = validateInput;
exports.parseInput = parseInput;
const os_1 = __importDefault(require("os"));
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("node:fs"));
function getExecType() {
    const _operatingSystem = os_1.default.platform(); // e.g. 'darwin', 'win32', 'linux'
    const _architecture = os_1.default.arch(); // e.g. 'x64', 'arm', 'arm64'
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
function validateInput(input) {
    if (!fs.existsSync(input.logFile))
        return [false, `ERROR: logFile is not found: ${input.logFile}`];
    return [true, ""];
}
function parseInput() {
    const logFile = core.getInput('log_file', { required: true });
    const stepName = core.getInput('step_name', { required: false });
    const jobName = core.getInput('job_name', { required: false });
    const githubToken = core.getInput('github_token', { required: true });
    return {
        logFile,
        jobName,
        stepName,
        githubToken,
    };
}
