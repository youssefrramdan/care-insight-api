import app from './app.js';
import databaseConnection from './config/dbConnection.js';

// Connect to database
databaseConnection();

const PORT = process.env.PORT || 8000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


// Handle errors that occur within promises but weren't caught
process.on('unhandledRejection', err => {
  console.error(`unhandledRejection Error : ${err.name} | ${err.message}`);
  server.close(() => {
    console.error(`Shutting down ...`);
    process.exit(1);
  });
});

// Handle errors that happen synchronously outside Express
process.on('uncaughtException', err => {
  console.error(`Uncaught Exception: ${err.name} | ${err.message}`);
  process.exit(1);
});
