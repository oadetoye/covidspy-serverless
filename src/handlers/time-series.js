const covidData = require('../models/covid-data');
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,GET',
  'Access-Control-Allow-Headers': '*'
};
exports.handler = async (event, context) => {
  try {
    const params = event.queryStringParameters;
    const country = params && params.location ? params.location : 'OWID_WRL';
    const body = await covidData.getTimeSeries(country);
    return {
      headers,
      statusCode: 200,
      body: JSON.stringify(body)
    };
  } catch(err) {

  }
};