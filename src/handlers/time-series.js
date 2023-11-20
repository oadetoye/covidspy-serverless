const covidData = require('../models/covid-data');
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,GET',
  'Access-Control-Allow-Headers': '*'
};
exports.handler = async (event, context) => {
  try {
    const params = event.queryStringParameters;
    const body = await covidData.getTimeSeries(params);
    return {
      headers,
      statusCode: 200,
      body: JSON.stringify(body)
    };
  } catch(err) {

  }
};