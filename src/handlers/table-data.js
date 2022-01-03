const covidData = require('../models/covid-data');
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,GET',
  'Access-Control-Allow-Headers': '*'
};
exports.handler = (event, context) => {
  try {
    const params = event.queryStringParameters;
    const country = params && params.location ? params.location : 'OWID_WRL';
    const body = await covidData.getTableData(country);
    return {
      headers,
      statusCode: 200,
      body: JSON.stringify(body)
    };
  } catch(err) {
    console.log(err);
    return {
      headers,
      statusCode: err.statusCode || 500,
      body: err
    }
  }
};
