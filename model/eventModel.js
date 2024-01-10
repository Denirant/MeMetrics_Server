const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
    },
  ],
  startDay: {
    type: Date,
    default: Date.now(),
  },
  endDay: {
    type: Date,
    default: Date.now(),
  },
  tags: [
    {
      title: {
        type: String,
      },
      color: {
        type: String,
      },
    },
  ],
  files: [
    {
      fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "File",
      },
      host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
  stages: [
    {
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      members: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Worker",
        },
      ],
      startDay: {
        type: Date,
        default: Date.now(),
      },
      endDay: {
        type: Date,
        default: Date.now(),
      },
      files: [
        {
            fileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "File",
          },
          host: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        },
      ],
      planner: [{
        title: {
            type: String,
            required: true,
          },
          complete: {
            type: Boolean,
            default: false
          }
      }]
    },
  ],
  taskStatus: [
    {
      workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker",
      },
      status: {
        type: Boolean,
        default: false,
      },
    },
  ]
});

const Event = mongoose.model("Event", EventSchema);

module.exports = Event;
