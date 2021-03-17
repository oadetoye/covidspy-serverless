const express = require('express');
const router = express.Router();
const fs = require('fs');
const connection = require('../connection');
const formatDate = require('../format-date');
const countriesMap = require('../countries-map');

function getParameters(query, isTimeSeries) {
  const predicates = [];
  const values = [];

  let { startDate, endDate, location }  = query;

  if (startDate) {
    predicates.push('date >= ?');
    values.push(formatDate(startDate));
  }

  if (endDate) {
    predicates.push('date <= ?');
    values.push(formatDate(endDate));
  }

  predicates.push('location=?');
  values.push(location || 'World');

  if (location && location !== 'World') {
    predicates.push(`NOT location='World'`);
  }


  let predicateString = ' WHERE ' + predicates.join(' AND ');
  if (values.length === 1 && !isTimeSeries) {
     predicateString += ' AND date=(select MAX(date) FROM covid_data)';
  }

  return { predicateString, values };
}

router.get('/', (req, res) => {
  const queryParams = req.query;
  const start = queryParams.pageSize * (queryParams.page - 1);
  const end = start + parseInt(queryParams.pageSize);
  const promises = [];
  const params = getParameters(req.query)
  const { startDate, endDate } =  req.query;
  const location = req.query.location || 'World';

  promises.push(new Promise((resolve, reject) => {
    const sql = `SELECT SUM(new_cases) as new_cases FROM covid_data ${params.predicateString}`;
    connection.query(sql, params.values, (err, output) => {
      if (err) {
        reject(err);
      } else {
        resolve(output);
      }

    });
  }));

  promises.push(new Promise((resolve, reject) => {
    const sql = `SELECT SUM(new_deaths) as new_deaths FROM covid_data ${params.predicateString}`;
    connection.query(sql, params.values, (err, output) => {
      if (err) {
        reject(err);
      } else {
        resolve(output);
      }

    });
  }));

  promises.push(new Promise((resolve, reject) => {
    const sql = `SELECT total_cases FROM covid_data WHERE location=? AND date=(SELECT MAX(date) FROM covid_data WHERE location=?)`;
    const query = connection.query(sql, [location, location], (err, output) => {
      if (err) {
        reject(err);
      } else {
        resolve(output);
      }
    });
  }));

  promises.push(new Promise((resolve, reject) => {
    const sql = `SELECT total_deaths FROM covid_data WHERE location=? AND date=(SELECT MAX(date) FROM covid_data WHERE location=?)`;
    connection.query(sql, [location, location], (err, output) => {
      if (err) {
        reject(err);
      } else {
        resolve(output);
      }

    });
  }));

  Promise.all(promises).then((responses) => {
    console.log(responses);
    res.send({
      new_cases: responses[0][0].new_cases,
      new_deaths: responses[1][0].new_deaths,
      total_cases: responses[2][0].total_cases,
      total_deaths: responses[3][0].total_deaths
    });

  }, err => {
    res.status(500).send(err);
  });
});

router.get('/table-data', (req, res) => {
  const queryParams = req.query;
  const start = queryParams.pageSize * (queryParams.page - 1);
  const end = start + parseInt(queryParams.pageSize);
  const promises = [];
  const params = getParameters(req.query)
  const { startDate, endDate } =  req.query;
  const location = req.query.location || 'World';

  const sql = `SELECT * FROM covid_data WHERE date=(select MAX(date) FROM covid_data) AND NOT location='World'`;
  connection.query(sql, (err, output) => {
    if (err) {
      console.log(err);
      res.status(500).send('an error occured');
    } else {
      res.send(output);
    }
  });
});

router.get('/continents', (req, res) => {
  const params = getParameters(req.query)
  const promises = [];
  const { startDate, endDate } =  req.query;

  promises.push(new Promise((resolve, reject) => {
    const predicates = [];
    const values = [];
    if (startDate) {
      predicates.push('date>=?');
      values.push(formatDate(startDate));
    }
    predicates.push(endDate ? 'date<=?' : 'date=(select MAX(date) FROM covid_data)');
    if (endDate) values.push(formatDate(endDate));

    const sql = `SELECT SUM(new_cases) as today_cases, SUM(new_deaths) as today_deaths, continent FROM covid_data WHERE ${predicates.join(' AND ')} AND NOT location='World' GROUP BY continent`;
    connection.query(sql, values, (err, output) => {
      if (err) {
        reject(err);
      } else {
        resolve(output);
      }

    });
  }));

  promises.push(new Promise((resolve, reject) => {
    const predicate = endDate ? '?' : '(select MAX(date) FROM covid_data)';
    const sql = `SELECT SUM(total_cases) as total_cases, SUM(total_deaths) as total_deaths, continent FROM covid_data WHERE date=${predicate} AND NOT location='World' GROUP BY continent`;
    connection.query(sql, [formatDate(endDate)], (err, output) => {
      if (err) {
        reject(err);
      } else {
        resolve(output);
      }

    });
  }));

  Promise.all(promises).then((responses) => {
    res.send({
      today: responses[0],
      totals: responses[1]
    });

  });

});

router.get('/time-series', (req, res) => {
  const params = getParameters(req.query, true)


  const sql = `SELECT date AS date, SUM(new_cases) AS cases, SUM(new_deaths) AS deaths, SUM(total_cases) AS total_cases, SUM(total_deaths) AS total_deaths FROM covid_data ${params.predicateString} GROUP BY date`;

  connection.query(sql, params.values, (error, results) => {
    if (error) {
      console.log(error);
      res.status(500).send('A server error occured');
    } else {
      res.send(results);
    }
  });
});

router.get('/locations', (req, res) => {
  connection.query(`SELECT DISTINCT location FROM covid_data WHERE NOT location='World' ORDER BY location`, (err, results) => {
    res.send(results.map(row => row.location));
  });
});

router.get('/location-data', (req, res) => {
  const promises = [];
  const location = countriesMap[req.query.location] || req.query.location;
  const sql = 'SELECT SUM(dr.confirmed) AS total_cases, SUM(dr.deaths) AS total_deaths, l.province_state AS location FROM daily_reports dr JOIN locations l ON dr.location_id=l.id WHERE l.country_region=? AND date=(SELECT MAX(date) FROM daily_reports) GROUP BY l.province_state';
  promises.push(new Promise((resolve, reject) => {
    connection.query(sql, [location], (err, results) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve(results);
      }
    });
  }));

  const sql2 = 'SELECT SUM(dr.confirmed) AS previous_cases, SUM(dr.deaths) AS previous_deaths, l.province_state AS location FROM daily_reports dr JOIN locations l ON dr.location_id=l.id WHERE l.country_region=? AND date=DATE_SUB((SELECT MAX(date) FROM daily_reports), INTERVAL 1 DAY) GROUP BY location';
  promises.push(new Promise((resolve, reject) => {
    connection.query(sql2, [location], (err, results) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve(results);
      }
    });
  }));

  Promise.all(promises).then(data => {
    data[0].forEach(record => {
      const previousData = data[1].find(row => row.location === record.location);
      record.new_cases = record.total_cases - previousData.previous_cases;
      record.new_deaths = record.total_deaths - previousData.previous_deaths;
    });
    res.send(data[0]);
  }, err => {
        res.status(500).send('An error occured');
  });
});

module.exports = router;
