require('dotenv').config();

const app = require("./app");
const port = process.env.PORT || 5000;
const connectDB = require('./config/db');


connectDB().then(() => {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}).catch((err: any) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
});