
module.exports = {
    components:{
        schemas:{
            User:{
                type: 'object',
                properties: {
                    client_id:{
                        type:'ObjectId'
                    },
                    name:{
                        type:'String'
                    },
                    surname:{
                        type:'String'
                    },
                    email:{
                        type:'String'
                    },
                    phone:{
                        type:'String'
                    }
                }
            },
            Token:{
                type: 'object',
                properties: {
                    client_id:{
                        type:'ObjectId'
                    },
                    token:{
                        type:'String'
                    },
                    createdAt:{
                        type:'Date'
                    }
                }
            },
            Error:{
                type:'object',
                properties:{
                    message:{
                        type:'String'
                    },
                    internal_code:{
                        type:'String'
                    }
                }
            }
        }
    }
}