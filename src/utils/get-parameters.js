module.exports = (query, isTimeSeries) => {
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
};
