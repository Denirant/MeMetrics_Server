const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 100,
    },
    head: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker',
    },
    employees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker',
    }],
    departments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
    }],
    path: {
        type: String, 
        required: false,
    },
});


const Department = mongoose.model('Department', departmentSchema);

module.exports = { Department };
