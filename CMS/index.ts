import { exec, ExecException } from 'child_process';
import redis from '../redis-client';
import moment from 'moment';


interface TestCase {
    caseID : number;
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

    healthCheck: (): Promise<string> => {
        return new Promise((resolve, reject) => {
            exec('docker ps --format "{{ json . }}"', (error, stdout, stderr) => {
                if (error || stderr) {
                    console.error(`Error executing command: ${error} ${stderr}`);
                    return
                }
                const rawOutput = stdout.split("\n")
                // console.log("Raw Output", (JSON.parse(rawOutput[0]).CreatedAt))

                const checkIfMachineExcitedTTL = rawOutput.map((data) => {
                    return new Promise((resolve, reject) => {

                        if(data != ''){
                            const _data = JSON.parse(data)
                            const date1String = _data.CreatedAt.toString();
                            const date1 = moment(date1String, 'YYYY-MM-DD HH:mm:ss Z').valueOf();
                            const date2 = Date.now();

                            const differenceInMilliseconds = date2 - date1;
                            const differenceInSeconds = Math.floor(differenceInMilliseconds / 1000);
                            if(differenceInSeconds > 10){
                                exec(`docker rm --force ${_data.ID} `, (error, stdout, stderr) => {
                                    if (error || stderr) {
                                        console.error(`Error executing command: ${error} ${stderr}`);
                                        return;
                                    }
                                    redis.del(`${_data.Image}:${_data.ID}`)
                                    console.log("Container Deleted GCC")
                                    return
                                })
                            }
                            console.log(differenceInSeconds);
                        
                        
                    }})
                })
                Promise.all(checkIfMachineExcitedTTL)
                
            })
        })
    },

    codeExecutionGCC: (props: codeExecutionProps) : Promise<string> => {
        const containerImageName: string = 'gcc';
        return new Promise((resolve, reject) => {
            const resultArray: { status: boolean; expectedOutput: string; userOutput: string; caseID: number; }[] = []
            exec(`docker run -itd ${containerImageName}`, (error, stdout, stderr) => {
                if (error || stderr) {
                    console.error(`Error executing command: ${error} ${stderr}`);
                    resolve("unable to spin up machine")
                    return;
                }
                const container_name = stdout.slice(0, 12)
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

                        const testCaseExecutions = props.testCases.map((data) => {
                            return new Promise((resolve, reject) => {
                                var testCasesInput: string = '';

                            const assigningInput = data.input.map((input: string) => {
                                return new Promise((resolve, reject) => {
                                    testCasesInput = `${testCasesInput} ${input}`;
                                    resolve("")
                                    return
                                })
                            })

                            Promise.all(assigningInput)
                                .then(() => {
                                    exec(`printf "${testCasesInput}" | docker exec -i ${container_name} ./index`, (error, stdout, stderr) => {
                                        if (error || stderr) {
                                            console.error(`Error executing command: ${error} ${stderr}`);
                                            resolve("unable to spin up machine")
                                            return;
                                        }
                                        if(stdout === data.output){
                                            resultArray.push({
                                                caseID: data.caseID ,
                                                status : true,
                                                expectedOutput : data.output.toString(),
                                                userOutput : stdout.toString()
                                            })
                                            resolve("")
                                        } else {
                                            resultArray.push({
                                                caseID: data.caseID ,
                                                status : false,
                                                expectedOutput : data.output.toString(),
                                                userOutput : stdout.toString()
                                            })
                                            resolve("")
                                        }

                                        // console.log("FInal Out :", stdout)
                                        exec(`docker rm --force ${container_name} `, (error, stdout, stderr) => {
                                            if (error || stderr) {
                                                // console.error(`Error executing command: ${error} ${stderr}`);
                                                return;
                                            }
                                            redis.del(`${containerImageName}:${container_name}`)
                                        })
                                    })
                                })
                            })
                        })

                        Promise.all(testCaseExecutions)
                        .then(() => {
                            resolve(JSON.stringify(resultArray))
                            return resultArray;
                        })
                    })
                })
            })
            

        })
    },
    codeExecutionNodeJs: (props: codeExecutionProps): Promise<string> => {
        const containerImageName: string = 'node';
        const resultArray: { status: boolean; expectedOutput: string; userOutput: string;  caseID: number;}[] = []

        return new Promise((resolve, reject) => {
            exec(`docker run -itd ${containerImageName}`, (error, stdout, stderr) => {
                if (error || stderr) {
                    console.error(`Error executing command: ${error} ${stderr}`);
                    resolve("unable to spin up machine")
                    return;
                }
                const container_name = stdout.slice(0, 12)
                // Assigning the machine to user in Redis DB
                redis.set(`${containerImageName}:${container_name}`, `${props.user_id}`)
                const filterCode = props.code.replace(/`/g, '\\`').replace(/"/g, '\\"').replace(/'/g, '\\"').replace(/\$/g, '\\$');;

                exec(`docker exec ${container_name} sh -c 'echo "${filterCode}" > index.js'`, (error, stdout, stderr) => {
                    if (error || stderr) {
                        console.error(`Error executing command: ${error}`);
                        resolve("unable to spin up machine")
                        return;
                    }
                    const RunAllTestCases = props.testCases.map((data) => {
                        return new Promise((resolve, reject) => {
                            var testCasesInput: string = data.input.flatMap(input => input.split(' ')).join('\n');
                            exec(`echo "${testCasesInput}" | docker exec -i ${container_name} node index.js`, (error, stdout, stderr) => {
                                if (error || stderr) {
                                    console.error(`Error executing command: ${error} ${stderr}`);
                                    resolve("unable to spin up machine")
                                    return;
                                }

                                const _stdout = stdout.replace('\n', '');

                                if(_stdout.replace('\n', '') === data.output){
                                    resultArray.push({
                                        caseID: data.caseID ,
                                        status : true,
                                        expectedOutput : data.output,
                                        userOutput : _stdout
                                    })
                                    resolve("")
                                } else {
                                    resultArray.push({
                                        caseID: data.caseID ,
                                        status : false,
                                        expectedOutput : data.output,
                                        userOutput : _stdout
                                    })
                                    resolve("")
                                }
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
                                resultArray.sort((a, b) => a.caseID - b.caseID);
                                resolve(JSON.stringify(resultArray))
                                return redis.del(`${containerImageName}:${container_name}`)
                            })
                        })

                })
            })
        })
    }
}

export default CMS;