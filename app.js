const app = {}
app.load_attempts = [];
app.track_customers = {};
app.load_validation = [];

app.fetchLoadAttempts = () => {
  return axios.get('http://localhost:5000/loadAttempts')
}
app.fetchOutput = () => {
  return axios.get('http://localhost:5000/output')
}

const formatDateMs = (date) => {
  return new Date(date).getTime()
}
const formatLoadAmount = (str) => {
  const formatted = parseFloat(str.split('$').splice(1, 1)[0])
  return formatted.toFixed(2)
}
const countDays = (date1, date2) => {
  const msInOneDay = 1000*60*60*24
  date1 = formatDateMs(date1)
  date2 = formatDateMs(date2)
  const difference = Math.round((date2 - date1)/msInOneDay)
  return difference
}

const sendResult = (daily_limit, weekly_limit, daily_transactions, validate) => {
  if (daily_limit < 0 || weekly_limit < 0 || daily_transactions > 3) {
    validate.accepted = false;
    app.load_validation.push(validate)
  } else {
    validate.accepted = true;
    app.load_validation.push(validate)
  }
}

const resetLimit = (limit) => {
  if(limit > 0){
    limit = 0;
  }
  return limit
}

app.parseLoadAttempts = (array) => {
  array.map((item) => {
    const {customer_id, id, time, load_amount} = item
    const validate = {id, customer_id}

    if(!app.track_customers[customer_id]){
      // initialize customer
      app.track_customers[customer_id] = {};
      app.track_customers[customer_id].currentDay = time
      app.track_customers[customer_id].daily_transactions = 1;
      // object to track weeks
      app.track_customers[customer_id].week = {
        start: app.track_customers[customer_id].currentDay,
        current: time,
    };
      // start week count
      app.track_customers[customer_id].week.count = countDays(app.track_customers[customer_id].week.start, app.track_customers[customer_id].week.current);

      app.track_customers[customer_id].daily_limit = 5000 - formatLoadAmount(load_amount);
      app.track_customers[customer_id].weekly_limit = 20000 - formatLoadAmount(load_amount);
      
      // initialize useful variables in this scope
      let {daily_limit, weekly_limit, daily_transactions} = app.track_customers[customer_id];

      sendResult(daily_limit,weekly_limit,daily_transactions, validate)
      
    } else {
      // initialize useful variables in this scope
      let { currentDay, week, daily_limit, weekly_limit, daily_transactions } = app.track_customers[customer_id]

      // Update the current day
      app.track_customers[customer_id].currentDay = time;

      // Compare current transaction date to previous one
      const timeBetweenTransactions = countDays(currentDay, time);

      // reset daily_limit, if necessary
      resetLimit(daily_limit)

      // console.log(`User: ${customer_id}`,`Day: ${currentDay}`, `Time: ${time}`, `Count: ${timeBetweenTransactions}`);

      // function to update week
      const updateWeek = (week) => {
        week.current = time;
        week.count = countDays(week.start, week.current)

        if(week.count > 6){
          week.start = time;
          week.current = time;
          resetLimit(weekly_limit);
          week.count = countDays(week.start, week.current)
        } 
        return week
      }
      week = updateWeek(week)

      if(timeBetweenTransactions === 0){
        daily_transactions++;
        daily_limit -= formatLoadAmount(load_amount);
        weekly_limit -= formatLoadAmount(load_amount);
        sendResult(daily_limit, weekly_limit, daily_transactions, validate)

        // reset daily_limit, if necessary
        resetLimit(daily_limit);

      } else {
        daily_transactions = 1;
        daily_limit = 5000 - formatLoadAmount(load_amount);
        weekly_limit = 20000 - formatLoadAmount(load_amount);
        sendResult(daily_limit, weekly_limit, daily_transactions, validate);

        // reset daily_limit, if necessary
        resetLimit(daily_limit);
      }
    }
    console.log(app.load_validation);
    axios.post(`http://localhost:5000/results?id=${validate.id}&customer_id=${validate.customer_id}&accepted=${validate.accepted}`);
  })
}
app.init = () => {
  app.fetchLoadAttempts().then(({data}) => {
    const loadAttempts = data;
    app.parseLoadAttempts(loadAttempts)
  })
}

app.init()