const body = require('./locations.json');
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,GET',
  'Access-Control-Allow-Headers': '*'
};

exports.handler = async (event, context) => {
  return {
    headers,
    statusCode: 200,
    body: JSON.stringify(body)
  };
};