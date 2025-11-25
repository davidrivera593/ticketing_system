# Capstone Ticketing System Backend

This is the backend server for the Capstone Ticketing System project, built using Node.js, Express, and PostgreSQL with Sequelize as the ORM.

## 🛠️ Installation

### Prerequisites

- **Node.js & npm**: Make sure you have [Node.js](https://nodejs.org/) and npm installed.
- **PostgreSQL Database**: Set up a local PostgreSQL database. (prod uses MySQL)

### Dependencies

The project uses the following npm packages:

- **express**: Web framework for Node.js
- **cors**: Enable CORS for cross-origin requests
- **dotenv**: Manage environment variables
- **sequelize**: ORM for working with databases
- **mysql2**: MySQL database client
- **nodemon**: Monitor and auto-restart server during development

To install these packages, run:
npm install express cors dotenv sequelize mysql2 nodemon

### 🚀 Running the Server

To run the server:  
node server.js

To run the server in development mode with auto-restart:
npx nodemon server.js

### 📁 Project Structure

- **config/:** Database configuration.
- **controllers/:**: Handles request processing and business logic 
- **models/:** Sequelize models (database tables).
- **migrations/:** Database migrations (adding or modifying tables)
- **routes/:** Express routes (API endpoints).
- **services/** API for sending email notifications 
- **server.js:** Main server file.

### 📝 Notes

Ensure your MySQL database is set up correctly and the **.env** file has valid credentials. 
