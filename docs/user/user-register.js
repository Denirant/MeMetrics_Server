
module.exports = {
    post:{
        tags:['User routes'],
        description: "Register user",
        operationId: "registerUser",
        parameters:[
            {
                name:"email",
                in:"path",
                required:true,
                description: "User email address"
            },
            {
                name:"password",
                in:"path",
                required:true,
                description: "Password for user account"
            },
            {
                name:"name",
                in:"path",
                required:true,
                description: "User name"
            },
            {
                name:"surname",
                in:"path",
                required:true,
                description: "User surname"
            }
        ],
        responses:{
            '201':{
                description: "An email sent to your account..."
            },
            '400':{
                description: 'Ivalid data of user'
            },
            '409':{
                description: 'User with given email already exist'
            },
            '500':{
                description: 'Iternal server error'
            }
        }
    }
}