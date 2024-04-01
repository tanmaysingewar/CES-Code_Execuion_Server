import express, { Express, Request, Response , Application } from 'express';
import dotenv from 'dotenv';
import CMS from './CMS';

//For env File 
dotenv.config();

const app: Application = express();
const port = process.env.PORT || 8000;

// console.log(CMS.demo())
const task = {
  code: `
#include <stdio.h>

int add(int a, int b) {
    return a - b;
}

int main() {
    int num1, num2;
    scanf("%d %d", &num1, &num2);
    int sum = add(num1, num2);
    printf("%d", sum);
    return 0;
}
`,
  user_id: "42344244",
  testCases: [
    {caseID:  1, input: [ "5", "3" ], output: "8"},
    {caseID:  2, input: [ "-2", "7" ], output: "5" }
  ]
};

const taskNodeJS = {
  code: `
  const readline = require('readline');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('', (num1) => {
    rl.question('', (num2) => {
      const sum = parseInt(num1) + parseInt(num2);
      console.log( sum);
      rl.close();
    });
  });
  `,
  user_id: "42344244",
  testCases: [
    {caseID:  1, input: ["5 4"], output: "9" },
    {caseID:  2, input: ["-2 8"], output: "6" },
    {caseID:  3, input: ["0 0"], output: "0" },
    {caseID:  4, input: ["10 20"], output: "30" },
    {caseID:  5, input: ["-5 5"], output: "0" }
  ]
};

const jsonTaskNodeJS = JSON.stringify(taskNodeJS);
// console.log(jsonTaskNodeJS);
// CMS.codeExecutionNodeJs(JSON.parse(jsonTaskNodeJS))

async function executeGPP() {
  await CMS.codeExecutionGCC(task)
  .then((data) => {
    console.log("Main GCC",JSON.parse(data))
  })
  await CMS.codeExecutionNodeJs(JSON.parse(jsonTaskNodeJS))
  .then((data) => {
    console.log("Main NodeJS", JSON.parse(data))
  })
}

executeGPP()


CMS.healthCheck()

app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to Express & TypeScript Server'); 
});

app.listen(port, () => {
  console.log(`Server is Fire at http://localhost:${port}`);
});