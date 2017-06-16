"use strict";

const dataStore = require('../shared/data-store');

module.exports.submit = (event, context, callback) => {
  var eventText = JSON.stringify(event, null, 2);
  console.log(eventText, event);

  const chlorine = 1203;

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
