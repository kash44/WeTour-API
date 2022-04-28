const mongoose = require('mongoose');
// They declarion of dotenv and its config have to be directly after eachother
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION ...Shuting down');
  console.log(err.name, err.message);
  process.exit(1);
});

// environment variables from config.env to development
dotenv.config({ path: './config.env' });
const app = require('./app');

mongoose
  .connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    // console.log(con.connections);
    console.log('DB connections successful!');
  });

// 4) Start Server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Handling all promise rejections - last safety net
// Listening to the unhandledRejection event which allows us to
// handle the errors in async code which werent previously handled
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION...Shuting down');
  server.close(() => {
    process.exit(1);
  });
});
