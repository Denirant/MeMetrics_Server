
module.exports = {
    post:{
        tags:['User routes'],
        description: "Login user",
        operationId: "loginUser",
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
            }
        ],
        responses:{
            '200':{
                description: "User created"
            },
            '400':{
                description: 'Ivalid email or password'
            },
            '401':{
                description: 'Unverified email'
            },
            '500':{
                description: 'Iternal server error'
            }
        }
    }
}