const router = require("express").Router();
const { createTask, deleteTask, allTasksByCompany, finishTask } = require("../controller/taskController");
const authMiddleware = require('../middleware/auth.middleware')

router.post("/add", authMiddleware, createTask);
router.post("/finish", authMiddleware, finishTask);
router.delete("/delete", authMiddleware, deleteTask);
router.get("/company", authMiddleware, allTasksByCompany);

module.exports = router;
