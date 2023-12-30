const mongoose = require("mongoose");
const { model, Schema, ObjectId } = require("mongoose");

const jwt = require("jsonwebtoken");
const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: false,
  },
  gender: {
    type: String,
    require: false,
    default: "Male",
  },
  birthday: {
    type: String,
    require: "None",
  },
  photoUrl: {
    type: String,
    default: "uploads/placeholder.png",
  },
  email: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    default: "CEO",
  },
  password: {
    type: String,
    required: true,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  phone: {
    type: String,
    default: "None",
  },
  companies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Company" }],
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  todos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Todo" }],
  agents: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Agent",
      },
      group_status: {
        type: Boolean,
        default: false,
      },
    },
  ],
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Group" }],
  workers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Worker" }],
  diskSpace: { type: Number, default: 5368709120 },
  usedSpace: { type: Number, default: 0 },
  files: [{ type: ObjectId, ref: "File" }],
  notifications: {
    type: Object,
    default: {}, // Можете задать начальное значение, если нужно
  },
  isAccessable: {
    type: Boolean,
    default: true,
  },
  tags: [{
    title: {
      type: 'String',
      required: true
    },
    color: {
      type: 'String',
      default: '#000'
    },
  }]
});
// JWTPRIVATEKEY - ключ к токену в файле .env
userSchema.methods.generateAuthToken = (user) => {
  // console.log(user._id);
  return jwt.sign({ id: user._id }, process.env.JWTPRIVATEKEY, {
    expiresIn: "7d",
  });
};

const User = mongoose.model("User", userSchema);

const validate = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().required().label("First Name"),
    lastName: Joi.string().required().label("Last Name"),
    email: Joi.string().email().required().label("Email"),
    password: passwordComplexity().required().label("Password"),
    // repeat_password: Joi.ref('Password')
  });

  return schema.validate(data);
};

module.exports = { User, validate };
