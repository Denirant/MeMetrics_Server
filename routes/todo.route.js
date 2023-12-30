const router = require("express").Router();
const authMiddleware = require('../middleware/auth.middleware')

const {
  createTodo,
  deleteTodo,
  editTodo,
  completeTodo,
  getAllTodo,
} = require("../controller/todoController");

router.post("/", authMiddleware, createTodo);
router.get("/", authMiddleware, getAllTodo);
router.delete("/:id", authMiddleware, deleteTodo);
router.patch("/:id/complete", authMiddleware, completeTodo);
router.put("/:id", authMiddleware, editTodo);

module.exports = router;
