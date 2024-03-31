"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const redis_client_1 = __importDefault(require("../redis-client"));
const CMS = {
    demo: () => {
        return new Promise((resolve, reject) => {
            resolve("Promise resolved");
        });
    },
    codeExecutionGCC: (props) => {
        const containerImageName = 'gcc';
        return new Promise((resolve, reject) => {
            console.log(props);
            // Create machine 
            (0, child_process_1.exec)(`docker run -itd ${containerImageName}`, (error, stdout, stderr) => {
                if (error || stderr) {
                    console.error(`Error executing command: ${error} ${stderr}`);
                    resolve("unable to spin up machine");
                    return;
                }
                const container_name = stdout.slice(0, 12);
                console.log(stdout.slice(0, 12));
                // Assigning the machine to user in Redis DB
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
                        props.testCases.map((data) => {
                            var testCasesInput = '';
                            const assigningInput = data.input.map((input) => {
                                return new Promise((resolve, reject) => {
                                    testCasesInput = `${testCasesInput} ${input}`;
                                    resolve("");
                                    return;
                                });
                            });
                            Promise.all(assigningInput)
                                .then((data) => {
                                (0, child_process_1.exec)(`printf "${testCasesInput}" | docker exec -i ${container_name} ./index`, (error, stdout, stderr) => {
                                    if (error || stderr) {
                                        console.error(`Error executing command: ${error} ${stderr}`);
                                        resolve("unable to spin up machine");
                                        return;
                                    }
                                    console.log("FInal Out :", stdout);
                                    (0, child_process_1.exec)(`docker rm --force ${container_name} `, (error, stdout, stderr) => {
                                        if (error || stderr) {
                                            console.error(`Error executing command: ${error} ${stderr}`);
                                            return;
                                        }
                                        console.log("Container Deleted");
                                        return;
                                    });
                                });
                            });
                        });
                    });
                });
            });
            // Echo the code
            // Compline the code if required
            // Running the code with the test cases
        });
    },
    codeExecutionNodeJs: (props) => {
        const containerImageName = 'node';
        console.log(props);
        return new Promise((resolve, reject) => {
            console.log(props);
            // Create machine 
            (0, child_process_1.exec)(`docker run -itd ${containerImageName}`, (error, stdout, stderr) => {
                if (error || stderr) {
                    console.error(`Error executing command: ${error} ${stderr}`);
                    resolve("unable to spin up machine");
                    return;
                }
                const container_name = stdout.slice(0, 12);
                console.log(stdout.slice(0, 12));
                // Assigning the machine to user in Redis DB
                redis_client_1.default.set(`${containerImageName}:${container_name}`, `${props.user_id}`);
                // const filterCode = (props.code).replace(/"/g, '\\"'); // props.code.replace(/`/g, '\\`').replace(/\\/g, '\\\\'); //.replace(/"/g, '\\"'); const code = task.code.replace(/`/g, '\\`').replace(/\\/g, '\\\\');
                const filterCode = props.code.replace(/`/g, '\\`').replace(/"/g, '\\"').replace(/'/g, '\\"').replace(/\$/g, '\\$');
                ;
                console.log(filterCode);
                (0, child_process_1.exec)(`docker exec ${container_name} sh -c 'echo "${filterCode}" > index.js'`, (error, stdout, stderr) => {
                    if (error || stderr) {
                        console.error(`Error executing command: ${error}`);
                        resolve("unable to spin up machine");
                        return;
                    }
                    const RunAllTestCases = props.testCases.map((data) => {
                        return new Promise((resolve, reject) => {
                            var testCasesInput = data.input.flatMap(input => input.split(' ')).join('\n') + '\n';
                            console.log(JSON.stringify(testCasesInput));
                            console.log(`echo "5\n10\n" | docker exec -i ${container_name} node  index.js`);
                            (0, child_process_1.exec)(`echo "${testCasesInput}" | docker exec -i ${container_name} node index.js`, (error, stdout, stderr) => {
                                if (error || stderr) {
                                    console.error(`Error executing command: ${error} ${stderr}`);
                                    resolve("unable to spin up machine");
                                    return;
                                }
                                console.log("Final Out :", stdout);
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
                            console.log("Container Deleted");
                            return redis_client_1.default.del(`${containerImageName}:${container_name}`);
                        });
                    });
                });
            });
        });
    }
};
exports.default = CMS;
