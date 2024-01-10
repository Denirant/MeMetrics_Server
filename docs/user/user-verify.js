
module.exports = {
    get:{
        tags:['User routes'],
        description: "Verify user",
        operationId: "verifyUser",
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
                description: "Email verified"
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