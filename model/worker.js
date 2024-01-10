const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Joi = require('joi')
const passwordComplexity = require('joi-password-complexity')

const workerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    menager: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    },
    department: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Department'
    },
    companies: 
    [
        {
            type: mongoose.Schema.Types.ObjectId, ref: 'Company'
        }
    ],
    birthday: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    lastOnline: {
        type: Date,
        default: null
    }
})

// name: req.body.name,
//       surname: req.body.surname,
//       gender: req.body.gender,
//       birthday: new Date(birthday),
//       companies: [req.body.company_id],
//       department: req.body.department_id,
//       menager: req.body.menager_id,
//       position: req.body.position,
//       phone: req.body.phone,
//       email: req.body.email,
//       image: req.file ? "/accounts/" + req.file.filename : "/placeholder.png",
//       password: hashPassword,

workerSchema.methods.generateAuthToken = () => {
    return jwt.sign({_id: this._id}, process.env.JWTPRIVATEKEY, {expiresIn: "7d"})
}

const Worker = mongoose.model("Worker", workerSchema);

module.exports = Worker