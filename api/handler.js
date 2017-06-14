"use strict";

const uuid = require("uuid");
const AWS = require("aws-sdk");

AWS.config.setPromisesDependency(require("bluebird"));

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.submit = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  const chlorine = requestBody.chlorine;

  if (typeof chlorine !== "number") {
    console.error("Validation Failed");
    callback(new Error("Couldn't submit data because of validation errors."));
    return;
  }

  saveRow(makeRow(chlorine))
    .then(res => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          message: `Sucessfully submitted data with chlorine ${chlorine}`,
          id: res.id
        })
      });
    })
    .catch(err => {
      console.log(err);
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          message: `Unable to submit data with chlorine ${chlorine}`
        })
      });
    });
};

module.exports.list = (event, context, callback) => {
  var params = {
    TableName: process.env.WSP_DATA_TABLE,
    ProjectionExpression: "chlorine"
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

const makeRow = chlorine => {
  const timestamp = new Date().getTime();
  return {
    id: uuid.v1(),
    chlorine: chlorine,
    submittedAt: timestamp,
    updatedAt: timestamp
  };
};
