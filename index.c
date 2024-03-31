
  const readline = require('readline');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Enter first number: ', (num1) => {
    rl.question('Enter second number: ', (num2) => {
      const sum = parseInt(num1) + parseInt(num2);
      console.log('Sum:', sum);
      rl.close();
    });
  });
  
  
