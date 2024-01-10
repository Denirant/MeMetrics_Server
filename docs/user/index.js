const login = require('./user-login');
const register = require('./user-register');
const otp = require('./user-otp');
const otp_verify = require('./user-otp-verify');
const verify = require('./user-verify');
const reset = require('./user-reset');

module.exports = {
    paths:{
        '/login':{
            ...login
        },
        '/register':{
            ...register
        },
        '/verify':{
            ...verify
        },
        '/reset':{
            ...reset
        },
        '/OTP':{
            ...otp
        },
        '/OTP/verify':{
            ...otp_verify
        },
    }
}