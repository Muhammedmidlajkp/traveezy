const mongoose = require('mongoose');


const otpSchema = new mongoose.Schema({
    email:{
        type:String,
        require:true
    },
    otp:{
        type:String,
        require:true
    },
    expiresAt:{
        type:Date,
        require:true
    }
});

module.exports = mongoose.model('OTP',otpSchema);