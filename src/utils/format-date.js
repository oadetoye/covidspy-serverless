module.exports = function(date) {
  const eDate = new Date(date);
  return eDate.getFullYear() + '-' + (eDate.getMonth() + 1) + '-' + eDate.getDate();
}

