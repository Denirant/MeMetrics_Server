const mongoose = require('mongoose');

const companyShema = new mongoose.Schema({
    name: {
        type: String, 
        required: true,
        minlength: 5,
        maxlength: 100,
    },
    legalForm: {
        type: String, 
        required: true,
        minlength: 20,
        maxlength: 100,
    },
    INN: {
        type: Number, 
        required: true,
    },
    KPP: {
        type: Number, 
        required: true,
    },
    OGRN: {
        type: Number, 
        required: true,
    },
    OKATO: {
        type: Number, 
        required: true,
    },
    OKPO: {
        type: Number, 
        required: true,
    },
    OKTMO: {
        type: Number, 
        required: true,
    },
    adress: {
        type: String, 
        required: true,
    },
    managment: {
        type: String, 
        required: true,
    },
    status: {
        type: String, 
        required: true,
    },
    addedAt: {
        type: Date,
        default: Date.now()
    },
    description: {
        type: String,
    },
    iconUrl: {
        type: String,
        default: 'uploads/companyPlaceholder.webp'
    },
    mainColor: {
        type: String,
        default: 'white'
    },
    employees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker',
    }],
    departments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
    }],
})


const Company = mongoose.model("Company", companyShema);


module.exports = Company