"use strict";

const uuid = require("uuid");
const AWS = require("aws-sdk");

AWS.config.setPromisesDependency(require("bluebird"));

const dynamoDb = new AWS.DynamoDB.DocumentClient();

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
