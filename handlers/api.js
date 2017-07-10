"use strict";

const uuid = require("uuid");
const AWS = require("aws-sdk");

AWS.config.setPromisesDependency(require("bluebird"));

const dynamoDb = new AWS.DynamoDB.DocumentClient();

function conversion(inMin, inMax, outMin, outMax) {
  return (value) => {
    const x = parseInt(value, 10);
    return (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
  }
}

const convertTemp = (t) => parseInt(t, 10) / 100;
const convertPh = conversion(0, 1023, 0, 14.0);
const convertCurrent = conversion(0, 1023, 0, 20);
const convertChlorine = (t) => conversion(4, 20, 0, 4.0)(convertCurrent(t));

module.exports.list = (event, context, callback) => {
  var params = {
    TableName: process.env.WSP_DATA_TABLE,
    ProjectionExpression: 'payload, #timestamp',
    ExpressionAttributeNames: {'#timestamp': 'timestamp'},
    Limit: 100,
  };

  const onScan = (err, data) => {
    if (err) {
      console.log(
        "Scan failed to load data. Error JSON:",
        JSON.stringify(err, null, 2)
      );
      callback(err);
    } else {
      console.log(`Scan succeeded. ${data.Items.length} items`);
      const items = data.Items.map(i => {
        return {
          tempInternal: convertTemp(i.payload.tempInternal),
          tempExternal: convertTemp(i.payload.tempExternal),
          chlorine: convertChlorine(i.payload.chlorine),
          ph: convertPh(i.payload.ph),
          timestamp: new Date(i.timestamp * 1000),
        };
      });
      const lastModified = items[items.length -1].timestamp;
      return callback(null, {
        statusCode: 200,
        headers: {
          "Last-Modified": lastModified.toUTCString(),
          "Cache-Control": "public, max-age=60",
          "Access-Control-Allow-Origin" : "*",
        },
        body: JSON.stringify({
          data: items
        })
      });
    }
  };

  dynamoDb.scan(params, onScan);
};
