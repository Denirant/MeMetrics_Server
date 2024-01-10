// подключение бибдиотеки config файлы
require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");

const docs = require("./docs");
const swaggerUI = require("swagger-ui-express");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const corsMiddleware = require("./middleware/cors.middleware");

const port = 8080,
  host = "127.0.0.1";

const connection = require("./utils/database");

const userRoutes = require("./routes/user.route"),
  companyRoutes = require("./routes/company.route"),
  workersRoutes = require("./routes/worker.route"),
  fileRouter = require("./routes/file.routes"),
  taskRouter = require("./routes/task.route"),
  todoRouter = require("./routes/todo.route");

app.use(
  fileUpload({
    createParentPath: true,
    defCharset: "utf8",
    defParamCharset: "utf8",
  })
);
app.use(corsMiddleware);
app.use(cors());

app.use(express.json({ extended: true, limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

connection();
// cors();

app.use("/uploads", express.static("uploads"));
app.use("/files", express.static("files"));

app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/workers", workersRoutes);
app.use("/api/files", fileRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/todos", todoRouter);

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(docs));

app.listen(port, () => {
  console.log(`Server is up at http://${host}:${port}`);
});
