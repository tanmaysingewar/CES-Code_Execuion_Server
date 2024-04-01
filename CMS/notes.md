- Health check 
1. Check if machine is running for more than 5 sec
2. Check every 5 sec / Interval
3. If any terminate it - before terminating - check 
4. If any user acquired it - remove record form Redis DB and remove machine also 
5. Raise red Flag for user 

- Code Execution
1. Create a Machine with - limited resource and no network
2. Assign the user in Redis Db
            User - Machine DB
    KEY              VALUE         TTL 
machine:machine_id - user_id       -1

3. echo the code in file
4. Run the file
5. Delete the container

Return 
checkedTestCases [
        {
            status : true,
            executionRecord {
                input : ["5" ,"4"],
                expectedOutput : "9",
                userOutput : "9"
            }
        }
    ]