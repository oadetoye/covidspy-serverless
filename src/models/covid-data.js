const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();

AWS.config.update({
  region: 'us-east-1'
});

class CovidData {
  get7DayAverages(results) {
    const fields = ['new_deaths', 'new_cases', 'total_deaths', 'total_cases']
    const current = results[0];
    const data = results.slice(0, 7);
    const data2 = results.slice(1, 8);
    const average7Days = {};
    fields.forEach(field => {
      average7Days[field] = Math.round(data.map(item => item.data[field])
        .reduce((a, b) => a + b, 0) / 7);
      average7Days[`${field}_change`] = Math.round(current.data[field] / results[1].data[field] * 100 - 100);

      const prior = Math.round(data2.map(item => item.data[field])
        .reduce((a, b) => a + b, 0) / 7);
      average7Days[`${field}_average_change`] = Math.round(average7Days[field] / prior * 100 - 100);
    });

    return average7Days;
  }


  getSummary(options) {
    const country = options && options.location ? options.location : 'OWID_WRL';
    return new Promise((resolve, reject) => {
      const params = {
        TableName: 'covid_global_data',
        KeyConditionExpression: '#c = :country',
        ExpressionAttributeNames: { '#c': 'country' },
        ExpressionAttributeValues: {
          ':country': country
        },
        ScanIndexForward: false
      };

      const { startDate, endDate } = options || {};

      switch (true) {
        case (!!startDate && !!endDate):
          params.KeyConditionExpression += ' AND #d BETWEEN :start_date AND :end_date';
          params.ExpressionAttributeNames['#d'] =  'date' ;
          params.ExpressionAttributeValues[':start_date'] = startDate;
          params.ExpressionAttributeValues[':end_date'] = endDate;
          break;
        
        case (!!startDate && !endDate):
          params.KeyConditionExpression += ' AND #d >= :start_date';
          params.ExpressionAttributeNames['#d'] =  'date' ;
          params.ExpressionAttributeValues[':start_date'] = startDate;
          break;
        
        case (!!endDate && !startDate):
          params.KeyConditionExpression += ' AND #d <= :end_date';
          params.ExpressionAttributeNames['#d'] =  'date' ;
          params.ExpressionAttributeValues[':end_date'] = endDate;
          break;

        default:
          params.Limit =  14;
          break;
      }
      
      db.query(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          const average7Days = this.get7DayAverages(data.Items);
          const results = data.Items[0];
          Object.assign(results, {
            average7Days
          });
          //this.getIncreases7Day(results);
          //this.getIncreasesDaily(results);

          resolve(results);
        }
      });
    }); 
  }

  getTimeSeries(options) {
    const country = options && options.location ? options.location : 'OWID_WRL';
    return new Promise((resolve, reject) => {
      const params = {
        TableName: 'covid_global_data',
        KeyConditionExpression: 'country = :country',
        ExpressionAttributeValues: {
          ':country': country
        },
        Limit: 365,
        ScanIndexForward: false
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

  getTableData(options) {
    const country = options && options.location ? options.location : 'OWID_WRL';
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
