const express = require('express');
const router = express.Router();
const Todo = require('../model/todo');
const { User } = require("../model/user");
const asyncHandler = require("express-async-handler");

// Создание задачи
const createTodo = asyncHandler(async (req, res) => {
  try {
    const { id, title, start, end } = req.body;
    const user = await User.findById(req.user.id);

    console.log(req.user)

    const newTodo = await new Todo({
      title,
      start,
      end,
    });
    const savedTodo = await newTodo.save();

    await user.todos.push(newTodo._id);
    await user.save()

    res.status(201).json(savedTodo);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Error while creating todo' });
  }
});

// Получение всех задач
const getAllTodo = asyncHandler(async (req, res) => {
  try {

    const user = await User.findById(req.user.id),
        todoArray = [];

    for(let todoId of user.todos){
        const todo = await Todo.findById(todoId);
        await todoArray.push(todo)
    }

    res.json(todoArray);
  } catch (error) {
    res.status(500).json({ error: 'Error while getting todos' });
  }
});

// Удаление задачи по id
const deleteTodo = asyncHandler(async (req, res) => {
  try {

    console.log(req)

    const deletedTodo = await Todo.findOneAndDelete({ _id: req.params.id });
    if (deletedTodo) {
        
        await User.updateOne(
            { _id: req.user.id },
            { $pull: { todos: deletedTodo._id } },
            { new: true }
          );

      res.json('Task was deleted');
    } else {
      res.status(404).json({ error: 'No todo with given id' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error while deleting todo' });
  }
});

// Отметка задачи как выполненной
const completeTodo = asyncHandler(async (req, res) => {
  try {
    const existingTodo = await Todo.findById(req.params.id);
const updatedTodo = await Todo.findOneAndUpdate(
  { _id: req.params.id },
  { $set: { complete: !existingTodo.complete } },
  { new: true }
);
      
    if (updatedTodo) {
      res.json('Task was updated');
    } else {
      res.status(404).json({ error: 'No todo' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error while completing todo' });
  }
});

// Редактирование задачи по id
const editTodo = asyncHandler(async (req, res) => {
  try {

    console.log(req.params.id)

    const { title, start, end } = req.body;
    const updatedTodo = await Todo.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { title, start, end } },
      { new: true }
    );
    if (updatedTodo) {
      res.json('Task was edited');
    } else {
      res.status(404).json({ error: 'No todo' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error while editing todo' });
  }
});

module.exports = {
    createTodo,
    getAllTodo,
    deleteTodo,
    completeTodo,
    editTodo
};
