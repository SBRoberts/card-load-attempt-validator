const express = require("express");
const app = express();
const fs = require('fs');
const readline = require("readline");

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next()
})

// Creating the readline interface to read input.txt on a line by line basis
const rl = readline.createInterface({
  input: fs.createReadStream("input.txt"),
  crlfDelay: Infinity
});

const port = process.env.PORT || 5000;

// initialize an array to push each each line of the input file to, converted to json
const loadAttempts = []

// read each line of the input.txt file, procedurally converting them to json
rl.on("line", line => {
  loadAttempts.push(JSON.parse(line))
})

// set up API end point to recieve and maniupulate data in a secure way
app.get('/loadAttempts', (req,res) => {
  res.send(loadAttempts)
})

// create api get request that will read all the inputs
// format inputs by user - rejecting duplicate load id's
// under each user
// Do the json outputs need to be stored in a txt/json file, or is it sufficiet for them returned on the console?

app.listen(port, () => {
  console.log(`Listening on Port ${port}`);
});