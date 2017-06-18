"use strict";

const uuid = require("uuid");
const AWS = require("aws-sdk");

AWS.config.setPromisesDependency(require("bluebird"));

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const convertTemp = (t) => parseInt(t, 10) / 100;

module.exports.list = (event, context, callback) => {
  var params = {
    TableName: process.env.WSP_DATA_TABLE,
    ProjectionExpression: 'payload, #timestamp',
    ExpressionAttributeNames: {'#timestamp': 'timestamp'},
  };

  const onScan = (err, data) => {
    if (err) {
      console.log(
        "Scan failed to load data. Error JSON:",
        JSON.stringify(err, null, 2)
      );
      callback(err);
    } else {
      console.log("Scan succeeded.");
      console.log(data.Items);
      const items = data.Items.map(i => {
        return {
          temp: convertTemp(i.payload.temp),
          chlorine: i.payload.chlorine,
          ph: i.payload.ph,
          timestamp: new Date(i.timestamp * 1000)
        };
      });
      return callback(null, {
        statusCode: 200,
        body: JSON.stringify({
          data: items
        })
      });
    }
  };

  dynamoDb.scan(params, onScan);
};
