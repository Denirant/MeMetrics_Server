module.exports = {
    get:{
        tags:['User routes'],
        description: "Check user phone otp code",
        operationId: "verifyOTPUser",
        parameters:[
            {
                name:"id",
                in:"path",
                required:true,
                description: "User id"
            },
            {
                name:"code",
                in:"path",
                required:true,
                description: "User code from phone message"
            }
        ],
        responses:{
            '200':{
                description: "Phone verified"
            },
            '201':{
                description: "Code was sent again"
            },
            '400':{
                description: "Invalid user"
            },
            '401':{
                description: "Time was ended"
            },
            '409':{
                description: "Incorrect code"
            },
            '500':{
                description: 'Iternal server error'
            }
        }
    }
}