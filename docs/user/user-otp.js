module.exports = {
    get:{
        tags:['User routes'],
        description: "Get user otp code",
        operationId: "otpUser",
        parameters:[
            {
                name:"id",
                in:"path",
                required:true,
                description: "User id"
            }
        ],
        responses:{
            '200':{
                description: "Send code"
            },
            '500':{
                description: 'Iternal server error'
            }
        }
    }
}