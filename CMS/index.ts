import { exec, ExecException } from 'child_process';
import redis from '../redis-client';

interface TestCase {
    input: string[];
    output: string;
}

interface codeExecutionProps {
    code: string;
    user_id: string;
    testCases: TestCase[];
}
const CMS = {
    demo: (): Promise<string> => {
        return new Promise((resolve, reject) => {
            resolve("Promise resolved")
        })
    },

    codeExecutionGCC: (props: codeExecutionProps): Promise<string> => {
        const containerImageName: string = 'gcc';
        return new Promise((resolve, reject) => {
            console.log(props)
            // Create machine 
            exec(`docker run -itd ${containerImageName}`, (error, stdout, stderr) => {
                if (error || stderr) {
                    console.error(`Error executing command: ${error} ${stderr}`);
                    resolve("unable to spin up machine")
                    return;
                }
                const container_name = stdout.slice(0, 12)
                console.log(stdout.slice(0, 12))
                // Assigning the machine to user in Redis DB
                redis.set(`${containerImageName}:${container_name}`, `${props.user_id}`)

                const filterCode = props.code.replace(/"/g, '\\"');

                exec(`docker exec ${container_name} bash -c 'echo "${filterCode}" > index.c'`, (error, stdout, stderr) => {
                    if (error || stderr) {
                        console.error(`Error executing command: ${error} ${stderr}`);
                        resolve("unable to spin up machine")
                        return;
                    }
                    console.log(stdout)
                    exec(`docker exec ${container_name} gcc -o index index.c`, (error, stdout, stderr) => {
                        if (error || stderr) {
                            console.error(`Error executing command: ${error} ${stderr}`);
                            resolve("unable to spin up machine")
                            return;
                        }
                        props.testCases.map((data) => {
                            var testCasesInput: string = '';

                            const assigningInput = data.input.map((input: string) => {
                                return new Promise((resolve, reject) => {
                                    testCasesInput = `${testCasesInput} ${input}`;
                                    resolve("")
                                    return
                                })
                            })
                            Promise.all(assigningInput)
                                .then((data) => {
                                    exec(`printf "${testCasesInput}" | docker exec -i ${container_name} ./index`, (error, stdout, stderr) => {
                                        if (error || stderr) {
                                            console.error(`Error executing command: ${error} ${stderr}`);
                                            resolve("unable to spin up machine")
                                            return;
                                        }
                                        console.log("FInal Out :", stdout)
                                        exec(`docker rm --force ${container_name} `, (error, stdout, stderr) => {
                                            if (error || stderr) {
                                                console.error(`Error executing command: ${error} ${stderr}`);
                                                return;
                                            }
                                            console.log("Container Deleted")
                                            return
                                        })
                                    })
                                })

                        })
                    })
                })
            })
            // Echo the code
            // Compline the code if required
            // Running the code with the test cases
        })
    },
    codeExecutionNodeJs: (props: codeExecutionProps): Promise<string> => {
        const containerImageName: string = 'node';
        console.log(props)
        return new Promise((resolve, reject) => {
            console.log(props)
            // Create machine 
            exec(`docker run -itd ${containerImageName}`, (error, stdout, stderr) => {
                if (error || stderr) {
                    console.error(`Error executing command: ${error} ${stderr}`);
                    resolve("unable to spin up machine")
                    return;
                }
                const container_name = stdout.slice(0, 12)
                console.log(stdout.slice(0, 12))
                // Assigning the machine to user in Redis DB
                redis.set(`${containerImageName}:${container_name}`, `${props.user_id}`)

                // const filterCode = (props.code).replace(/"/g, '\\"'); // props.code.replace(/`/g, '\\`').replace(/\\/g, '\\\\'); //.replace(/"/g, '\\"'); const code = task.code.replace(/`/g, '\\`').replace(/\\/g, '\\\\');

                const filterCode = props.code.replace(/`/g, '\\`').replace(/"/g, '\\"').replace(/'/g, '\\"').replace(/\$/g, '\\$');;
                console.log(filterCode)

                exec(`docker exec ${container_name} sh -c 'echo "${filterCode}" > index.js'`, (error, stdout, stderr) => {
                    if (error || stderr) {
                        console.error(`Error executing command: ${error}`);
                        resolve("unable to spin up machine")
                        return;
                    }
                    const RunAllTestCases = props.testCases.map((data) => {
                        return new Promise((resolve, reject) => {
                            var testCasesInput: string = data.input.flatMap(input => input.split(' ')).join('\n') + '\n';
                            console.log(JSON.stringify(testCasesInput))
                            console.log(`echo "5\n10\n" | docker exec -i ${container_name} node  index.js`);
                            exec(`echo "${testCasesInput}" | docker exec -i ${container_name} node index.js`, (error, stdout, stderr) => {
                                if (error || stderr) {
                                    console.error(`Error executing command: ${error} ${stderr}`);
                                    resolve("unable to spin up machine")
                                    return;
                                }
                                console.log("Final Out :", stdout)
                                resolve("")
                            })
                        })
                    })

                    Promise.all(RunAllTestCases)
                    .then((data) => {
                        exec(`docker rm --force ${container_name} `, (error, stdout, stderr) => {
                            if (error || stderr) {
                                console.error(`Error executing command: ${error} ${stderr}`);
                                return;
                            }
                            console.log("Container Deleted")
                            return redis.del(`${containerImageName}:${container_name}`)
                        })
                    })
                    
                })
            })
        })
    }

}

export default CMS;