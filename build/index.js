"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const CMS_1 = __importDefault(require("./CMS"));
//For env File 
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 8000;
console.log(CMS_1.default.demo());
const task = {
    code: `
#include <stdio.h>

int add(int a, int b) {
    return a + b;
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
        { input: ["5", "3"], output: "8" },
        { input: ["-2", "7"], output: "5" }
    ]
};
const taskNodeJS = {
    code: `
  const readline = require('readline');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Enter first number: ', (num1) => {
    rl.question('Enter second number: ', (num2) => {
      const sum = parseInt(num1) + parseInt(num2);
      console.log("NUM 1 :", num1, "num2", num2);
      console.log(\`The sum of \${num1} and \${num2} is \${sum}.\`);
      console.log('Sum:', sum);
      rl.close();
    });
  });
  `,
    user_id: "42344244",
    testCases: [
        { input: ["5 4"], output: "8" },
        { input: ["-2 8"], output: "6" },
        { input: ["0 0"], output: "0" },
        { input: ["10 20"], output: "30" },
        { input: ["-5 5"], output: "0" }
    ]
};
const jsonTaskNodeJS = JSON.stringify(taskNodeJS);
console.log(jsonTaskNodeJS);
CMS_1.default.codeExecutionNodeJs(taskNodeJS);
CMS_1.default.codeExecutionGCC(task);
app.get('/', (req, res) => {
    res.send('Welcome to Express & TypeScript Server');
});
app.listen(port, () => {
    console.log(`Server is Fire at http://localhost:${port}`);
});
