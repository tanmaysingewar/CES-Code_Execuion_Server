"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
        { caseID: 1, input: ["5", "3"], output: "8" },
        { caseID: 2, input: ["-2", "7"], output: "5" }
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
        { caseID: 1, input: ["5 4"], output: "9" },
        { caseID: 2, input: ["-2 8"], output: "6" },
        { caseID: 3, input: ["0 0"], output: "0" },
        { caseID: 4, input: ["10 20"], output: "30" },
        { caseID: 5, input: ["-5 5"], output: "0" }
    ]
};
const jsonTaskNodeJS = JSON.stringify(taskNodeJS);
// console.log(jsonTaskNodeJS);
// CMS.codeExecutionNodeJs(JSON.parse(jsonTaskNodeJS))
function executeGPP() {
    return __awaiter(this, void 0, void 0, function* () {
        yield CMS_1.default.codeExecutionGCC(task)
            .then((data) => {
            console.log("Main GCC", JSON.parse(data));
        });
        yield CMS_1.default.codeExecutionNodeJs(JSON.parse(jsonTaskNodeJS))
            .then((data) => {
            console.log("Main NodeJS", JSON.parse(data));
        });
    });
}
executeGPP();
CMS_1.default.healthCheck();
app.get('/', (req, res) => {
    res.send('Welcome to Express & TypeScript Server');
});
app.listen(port, () => {
    console.log(`Server is Fire at http://localhost:${port}`);
});
