"use strict";

const uuid = require("uuid");
const AWS = require("aws-sdk");
const dataStore = require('../shared/data-store');

AWS.config.setPromisesDependency(require("bluebird"));

const dynamoDb = new AWS.DynamoDB.DocumentClient();


module.exports.submit = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  console.log(event.body);
  const { data, temp, time } = requestBody;

  if (typeof temp !== "number") {
    console.error("Validation Failed");
    callback(new Error("Couldn't submit data because of validation errors."));
    return;
  }

  saveRow(makeRow(data, temp, time))
    .then(res => {
      callback(null, {
        statusCode: 200,
      });
    })
    .catch(err => {
      console.log(err);
      callback(null, {
        statusCode: 500,
      });
    });
};

module.exports.list = (event, context, callback) => {
  var params = {
    TableName: process.env.WSP_DATA_TABLE,
    ProjectionExpression: "temp"
  };

  console.log("Scanning Data table.");
  const onScan = (err, data) => {
    if (err) {
      console.log(
        "Scan failed to load data. Error JSON:",
        JSON.stringify(err, null, 2)
      );
      callback(err);
    } else {
      console.log("Scan succeeded.");
      return callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          data: data.Items
        })
      });
    }
  };

  dynamoDb.scan(params, onScan);
};



const saveRow = data => {
  console.log("Submitting data");
  const tableInfo = {
    TableName: process.env.WSP_DATA_TABLE,
    Item: data
  };
  return dynamoDb.put(tableInfo).promise().then(res => data);
};

const makeRow = (data, temp, time) => {
  const timestamp = new Date().getTime();
  console.log(data, temp, time);
  return {
    id: uuid.v1(),
    temp: temp,
    submittedAt: timestamp,
    updatedAt: timestamp
  };
};

