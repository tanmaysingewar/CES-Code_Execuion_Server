"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const redis_client_1 = __importDefault(require("../redis-client"));
const moment_1 = __importDefault(require("moment"));
const CMS = {
    demo: () => {
        return new Promise((resolve, reject) => {
            resolve("Promise resolved");
        });
    },
    healthCheck: () => {
        return new Promise((resolve, reject) => {
            (0, child_process_1.exec)('docker ps --format "{{ json . }}"', (error, stdout, stderr) => {
                if (error || stderr) {
                    console.error(`Error executing command: ${error} ${stderr}`);
                    return;
                }
                const rawOutput = stdout.split("\n");
                // console.log("Raw Output", (JSON.parse(rawOutput[0]).CreatedAt))
                const checkIfMachineExcitedTTL = rawOutput.map((data) => {
                    return new Promise((resolve, reject) => {
                        if (data != '') {
                            const _data = JSON.parse(data);
                            const date1String = _data.CreatedAt.toString();
                            const date1 = (0, moment_1.default)(date1String, 'YYYY-MM-DD HH:mm:ss Z').valueOf();
                            const date2 = Date.now();
                            const differenceInMilliseconds = date2 - date1;
                            const differenceInSeconds = Math.floor(differenceInMilliseconds / 1000);
                            if (differenceInSeconds > 10) {
                                (0, child_process_1.exec)(`docker rm --force ${_data.ID} `, (error, stdout, stderr) => {
                                    if (error || stderr) {
                                        console.error(`Error executing command: ${error} ${stderr}`);
                                        return;
                                    }
                                    redis_client_1.default.del(`${_data.Image}:${_data.ID}`);
                                    console.log("Container Deleted GCC");
                                    return;
                                });
                            }
                            console.log(differenceInSeconds);
                        }
                    });
                });
                Promise.all(checkIfMachineExcitedTTL);
            });
        });
    },
    codeExecutionGCC: (props) => {
        const containerImageName = 'gcc';
        return new Promise((resolve, reject) => {
            const resultArray = [];
            (0, child_process_1.exec)(`docker run -itd ${containerImageName}`, (error, stdout, stderr) => {
                if (error || stderr) {
                    console.error(`Error executing command: ${error} ${stderr}`);
                    resolve("unable to spin up machine");
                    return;
                }
                const container_name = stdout.slice(0, 12);
                redis_client_1.default.set(`${containerImageName}:${container_name}`, `${props.user_id}`);
                const filterCode = props.code.replace(/"/g, '\\"');
                (0, child_process_1.exec)(`docker exec ${container_name} bash -c 'echo "${filterCode}" > index.c'`, (error, stdout, stderr) => {
                    if (error || stderr) {
                        console.error(`Error executing command: ${error} ${stderr}`);
                        resolve("unable to spin up machine");
                        return;
                    }
                    console.log(stdout);
                    (0, child_process_1.exec)(`docker exec ${container_name} gcc -o index index.c`, (error, stdout, stderr) => {
                        if (error || stderr) {
                            console.error(`Error executing command: ${error} ${stderr}`);
                            resolve("unable to spin up machine");
                            return;
                        }
                        const testCaseExecutions = props.testCases.map((data) => {
                            return new Promise((resolve, reject) => {
                                var testCasesInput = '';
                                const assigningInput = data.input.map((input) => {
                                    return new Promise((resolve, reject) => {
                                        testCasesInput = `${testCasesInput} ${input}`;
                                        resolve("");
                                        return;
                                    });
                                });
                                Promise.all(assigningInput)
                                    .then(() => {
                                    (0, child_process_1.exec)(`printf "${testCasesInput}" | docker exec -i ${container_name} ./index`, (error, stdout, stderr) => {
                                        if (error || stderr) {
                                            console.error(`Error executing command: ${error} ${stderr}`);
                                            resolve("unable to spin up machine");
                                            return;
                                        }
                                        if (stdout === data.output) {
                                            resultArray.push({
                                                caseID: data.caseID,
                                                status: true,
                                                expectedOutput: data.output.toString(),
                                                userOutput: stdout.toString()
                                            });
                                            resolve("");
                                        }
                                        else {
                                            resultArray.push({
                                                caseID: data.caseID,
                                                status: false,
                                                expectedOutput: data.output.toString(),
                                                userOutput: stdout.toString()
                                            });
                                            resolve("");
                                        }
                                        // console.log("FInal Out :", stdout)
                                        (0, child_process_1.exec)(`docker rm --force ${container_name} `, (error, stdout, stderr) => {
                                            if (error || stderr) {
                                                // console.error(`Error executing command: ${error} ${stderr}`);
                                                return;
                                            }
                                            redis_client_1.default.del(`${containerImageName}:${container_name}`);
                                        });
                                    });
                                });
                            });
                        });
                        Promise.all(testCaseExecutions)
                            .then(() => {
                            resolve(JSON.stringify(resultArray));
                            return resultArray;
                        });
                    });
                });
            });
        });
    },
    codeExecutionNodeJs: (props) => {
        const containerImageName = 'node';
        const resultArray = [];
        return new Promise((resolve, reject) => {
            (0, child_process_1.exec)(`docker run -itd ${containerImageName}`, (error, stdout, stderr) => {
                if (error || stderr) {
                    console.error(`Error executing command: ${error} ${stderr}`);
                    resolve("unable to spin up machine");
                    return;
                }
                const container_name = stdout.slice(0, 12);
                // Assigning the machine to user in Redis DB
                redis_client_1.default.set(`${containerImageName}:${container_name}`, `${props.user_id}`);
                const filterCode = props.code.replace(/`/g, '\\`').replace(/"/g, '\\"').replace(/'/g, '\\"').replace(/\$/g, '\\$');
                ;
                (0, child_process_1.exec)(`docker exec ${container_name} sh -c 'echo "${filterCode}" > index.js'`, (error, stdout, stderr) => {
                    if (error || stderr) {
                        console.error(`Error executing command: ${error}`);
                        resolve("unable to spin up machine");
                        return;
                    }
                    const RunAllTestCases = props.testCases.map((data) => {
                        return new Promise((resolve, reject) => {
                            var testCasesInput = data.input.flatMap(input => input.split(' ')).join('\n');
                            (0, child_process_1.exec)(`echo "${testCasesInput}" | docker exec -i ${container_name} node index.js`, (error, stdout, stderr) => {
                                if (error || stderr) {
                                    console.error(`Error executing command: ${error} ${stderr}`);
                                    resolve("unable to spin up machine");
                                    return;
                                }
                                const _stdout = stdout.replace('\n', '');
                                if (_stdout.replace('\n', '') === data.output) {
                                    resultArray.push({
                                        caseID: data.caseID,
                                        status: true,
                                        expectedOutput: data.output,
                                        userOutput: _stdout
                                    });
                                    resolve("");
                                }
                                else {
                                    resultArray.push({
                                        caseID: data.caseID,
                                        status: false,
                                        expectedOutput: data.output,
                                        userOutput: _stdout
                                    });
                                    resolve("");
                                }
                                resolve("");
                            });
                        });
                    });
                    Promise.all(RunAllTestCases)
                        .then((data) => {
                        (0, child_process_1.exec)(`docker rm --force ${container_name} `, (error, stdout, stderr) => {
                            if (error || stderr) {
                                console.error(`Error executing command: ${error} ${stderr}`);
                                return;
                            }
                            resultArray.sort((a, b) => a.caseID - b.caseID);
                            resolve(JSON.stringify(resultArray));
                            return redis_client_1.default.del(`${containerImageName}:${container_name}`);
                        });
                    });
                });
            });
        });
    }
};
exports.default = CMS;
