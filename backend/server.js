const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load .env variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// This new line allows our server to accept JSON data in the body of a request
app.use(express.json());

// This new line tells the server to use our user routes
app.use('/api/users', require('./routes/userRoutes'));

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));