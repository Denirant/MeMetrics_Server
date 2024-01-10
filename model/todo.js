const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
    required: true,
  },
  complete: {
    type: Boolean,
    default: false
  }
});

const Todo = mongoose.model('Todo', todoSchema);

module.exports = Todo;
