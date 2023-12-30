module.exports = {
    post:{
        tags:['User routes'],
        description: "Reset user password",
        operationId: "resetUser",
        parameters:[
            {
                name:"id",
                in:"path",
                required:true,
                description: "User id"
            },
            {
                name:"token",
                in:"path",
                required:true,
                description: "User token"
            }
        ],
        responses:{
            '200':{
                description: "Password reset"
            },
            '400':{
                description: 'Invalid link'
            },
            '500':{
                description: 'Iternal server error'
            }
        }
    }
}