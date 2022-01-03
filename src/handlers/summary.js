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
    const results = await covidData.getSummary(country);

    return {
      headers,
      statusCode: 200,
      body: JSON.stringify(results)
    }; 
  } catch (err) {
    console.log(err);
    return {
      statusCode: err.statusCode || 500,
      body: err || 'There was an error retrieving summaries'
    };
  }
};
