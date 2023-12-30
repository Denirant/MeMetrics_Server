const mongoose = require('mongoose')

const tokenSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        // по этой ссылке заполняются остальные поля, которые соответствуют данным пользователя
        ref: "user",
        unique: true
    },
    token: {type: String, required: true},
    createdAt: {type: Date, default: Date.now()} //Ссылка будет действительна 1 час
})

module.exports = mongoose.model('token', tokenSchema)