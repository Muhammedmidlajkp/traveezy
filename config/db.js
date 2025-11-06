const mongoose = require('mongoose')

const connectDB = async()=>{

    try{
        conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`Mongoose connected: ${conn.connection.host}`)
    }catch(error){
        console.error(`error:${error.message}`);
        process.exit(1)
    };
    }

    module.exports=connectDB;