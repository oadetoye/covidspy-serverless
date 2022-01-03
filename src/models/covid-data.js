const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();

AWS.config.update({
  region: 'us-east-1'
});

class CovidData {
  getSummary(country) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: 'covid_global_data',
        KeyConditionExpression: 'country = :country',
        ExpressionAttributeValues: {
          ':country': country
        },
        ScanIndexForward: false,
        Limit: 1
      };

      db.query(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          const results = data.Items;
          resolve(results);
        }
      });
    }); 
  }

  getTimeSeries(country) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: 'covid_global_data',
        KeyConditionExpression: 'country = :country',
        ExpressionAttributeValues: {
          ':country': country
        }
      };

      db.query(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          const results = data.Items.map(item => {
            return {
              date: item.date,
              cases: item.data.new_cases || 0,
              deaths: item.data.new_deaths || 0,
              total_cases: item.data.total_cases || 0,
              total_deaths: item.data.total_deaths || 0
            }
          });
          resolve(results);
        }
      });
    }); 
  }

  getTableData(country) {
    return new Promise((resolve, reject) => {
      const params = {
        TableName: 'covid_global_data',
        KeyConditionExpression: 'country = :country',
        ExpressionAttributeValues: {
          ':country': country
        }
      };

      db.query(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          const results = data.Items.map(item => {
            return {
              date: item.date,
              cases: item.data.new_cases || 0,
              deaths: item.data.new_deaths || 0,
              total_cases: item.data.total_cases || 0,
              total_deaths: item.data.total_deaths || 0
            }
          });
          resolve(results);
        }
      });
    }); 
  }
}

module.exports = new CovidData();
