"use strict";

const dataStore = require('../shared/data-store');
const dynamoDb = new AWS.DynamoDB.DocumentClient();


module.exports.submit = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  const chlorine = requestBody.chlorine;

  if (typeof chlorine !== "number") {
    console.error("Validation Failed");
    callback(new Error("Couldn't submit data because of validation errors."));
    return;
  }

  dataStore.saveRow(dataStrore.makeRow(chlorine))
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

