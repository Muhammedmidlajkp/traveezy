const mongoose = require('mongoose')

const connectDB = async()=>{

    try{
        conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`Mongoose connected: ${conn.connection.host}`)
    } catch (error) {
        console.error(`Database connection error: ${error.message}`);
        // Do not process.exit(1) in serverless environments
    }
    }

    module.exports=connectDB;