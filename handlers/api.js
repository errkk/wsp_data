"use strict";

const uuid = require("uuid");
const AWS = require("aws-sdk");

AWS.config.setPromisesDependency(require("bluebird"));

const dynamoDb = new AWS.DynamoDB.DocumentClient();

function conversion(inMin, inMax, outMin, outMax) {
  return (value) => {
    const x = (typeof value === 'string') ? parseInt(value, 10) : value;
    return (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
  }
}

const convertTemp = (t) => parseInt(t, 10) / 100;
const convertPh = conversion(0, 1023, 0, 14.0);
const convertCurrent = conversion(0, 1023, 0, 20);
const convertChlorine = (t) => conversion(4, 20, 0, 4.0)(convertCurrent(t));

module.exports.list = (event, context, callback) => {
  const now = new Date();
  const since = Math.round((now - (48 * 60 * 60 * 1000)) / 1000);

  var params = {
    TableName: process.env.WSP_DATA_TABLE,
    ProjectionExpression: 'payload, #timestamp',
    ExpressionAttributeNames: { '#timestamp': 'time' },
    ExpressionAttributeValues: { ':since': since },
    FilterExpression: ":since < #timestamp",
  };

  const onScan = (err, data) => {
    if (err) {
      console.log(
        "Scan failed to load data. Error JSON:",
        JSON.stringify(err, null, 2)
      );
      callback(err);
    } else {
      const items = data.Items.map(i => {
        return {
          tempInternal: convertTemp(i.payload.tempInternal),
          tempExternal: convertTemp(i.payload.tempExternal),
          chlorine: convertChlorine(i.payload.chlorine),
          ph: convertPh(i.payload.ph),
          timestamp: new Date(i.time * 1000),
        };
      });
      const last = items[items.length -1];
      const lastModified = (last) ? last.timestamp : new Date();
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
