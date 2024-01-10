const util = require("util");
const multer = require("multer");
const maxSize = 2 * 1024 * 1024;
const {v4: uuidv4} = require('uuid');

let uuid = uuidv4();

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/accounts");
  },
  filename: (req, file, cb) => {
    cb(null, uuid + file.originalname);
  },
});

let uploadFile = multer({
  storage: storage,
  limits: { fileSize: maxSize },
}).single("image");

// create the exported middleware object
let uploadFileMiddleware = util.promisify(uploadFile);
module.exports = uploadFileMiddleware;