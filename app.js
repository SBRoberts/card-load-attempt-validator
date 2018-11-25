const app = {}
app.load_attempts = [];
app.track_customers = {};
app.load_validation = [];

app.fetchLoadAttempts = () => {
  return axios.get('http://localhost:5000/loadAttempts')
}
const formatDateMs = (date) => {
  return new Date(date).getTime()
}
const formatLoadAmount = (str) => {
  const formatted = str.split('$').splice(1, 1)[0]
  // console.log(formatted);
  return formatted
}
const countDays = (date1, date2) => {
  const msInOneDay = 1000*60*60*24
  date1 = formatDateMs(date1)
  date2 = formatDateMs(date2)
  const difference = Math.round((date2 - date1)/msInOneDay)
  return difference
}
app.parseLoadAttempts = (array) => {
  array.map((item) => {
    const {customer_id, id, time, load_amount} = item
    const validate = {id, customer_id}
    if(!app.track_customers[customer_id]){
      // initialize customer
      app.track_customers[customer_id] = {};
      app.track_customers[customer_id].day = time
      app.track_customers[customer_id].daily_transactions = 1;
      // object to track weeks
      app.track_customers[customer_id].week = {
        start: app.track_customers[customer_id].day,
        current: time,
      };
      // start week count
      app.track_customers[customer_id].week.count = countDays(app.track_customers[customer_id].week.start, app.track_customers[customer_id].week.current);
      
      app.track_customers[customer_id].daily_limit = 5000 - formatLoadAmount(load_amount);
      app.track_customers[customer_id].weekly_limit = 20000 - formatLoadAmount(load_amount);
      
      let {daily_limit, weekly_limit, daily_transactions, week} = app.track_customers[customer_id];

      if (daily_limit < 0 || weekly_limit < 0 || daily_transactions > 3 || week.count > 7) {
        validate.accepted = false;
        app.load_validation.push(validate)
      } else {
        validate.accepted = true;
        app.load_validation.push(validate)
      }
      
    } else {
      let { day } = app.track_customers[customer_id]

      // Compare current transaction date to previous one
      const timeBetweenTransactions = countDays(day, time);

      if(timeBetweenTransactions < 0){
        daily_transactions++;
        weekly_transactions++;
        daily_limit -= formatLoadAmount(load_amount);
        weekly_limit -= formatLoadAmount(load_amount);

        if(daily_limit < 0 || weekly_limit < 0 || daily_transactions > 3){
          validate.accepted = false;
          app.load_validation.push(validate)
        } else {
          validate.accepted = true;
          app.load_validation.push(validate)
        }
      } else {
        daily_transactions = 1;
        daily_limit = 5000 - formatLoadAmount(load_amount);
        weekly_limit = 20000 - formatLoadAmount(load_amount);

        if (daily_limit < 0 || weekly_limit < 0 || daily_transactions > 3) {
          validate.accepted = false;
          app.load_validation.push(validate)
        } else {
          validate.accepted = true;
          app.load_validation.push(validate)
        }

      }
    }
  })
  console.log(app.track_customers);
  console.log(app.load_validation);
}
app.init = () => {
  app.fetchLoadAttempts().then(({data}) => {
    const loadAttempts = data;
    app.parseLoadAttempts(loadAttempts)
  })
  // await app.parseLoadAttempts(app.loadAttempts)
}

app.init()