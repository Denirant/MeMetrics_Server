const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    workers: 
    [
        {
            type: mongoose.Schema.Types.ObjectId, ref: 'Worker'
        }
    ],
    companies: 
    [
        {
            type: mongoose.Schema.Types.ObjectId, ref: 'Company'
        }
    ],
    steps: 
    [
        {
            title: {
                type: String,
                required: true
            },
        }
    ],
    labels: 
    [
        {
            type: String,
        }
    ],
    date: {
        start: {
            type: Date,
            default: Date.now()
        },
        end: {
            type: Date,
            default: Date.now() + 3600
        }
    }
})


const Task = mongoose.model("Task", workerSchema);

module.exports = Task