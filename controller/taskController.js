const { User } = require("../model/user");
const Company = require("../model/company");
const Event = require("../model/eventModel");
const Worker = require("../model/worker");
const Token = require("../model/token");
const Joi = require("joi");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const asyncHandler = require("express-async-handler");
const generateOTP = require("../utils/generateOTP");
const File = require('../model/file')

const AES = require("crypto-js/aes");
const Utf8 = require("crypto-js/enc-utf8");

const GreenSMS = require("greensms");
const client = new GreenSMS({ user: "konkin", pass: "Ydh23FsE" });

function parseDateStringToDate(dateString) {
  const [day, month, year] = dateString.split(".").map(Number);

  // Месяцы в JavaScript начинаются с 0, поэтому вычитаем 1
  const jsMonth = month - 1;

  // Создаем объект даты
  const dateObject = new Date(year, jsMonth, day);

  return dateObject;
}

function formatDateToDateString(dateObject) {
  const day = dateObject.getDate().toString().padStart(2, "0");
  const month = (dateObject.getMonth() + 1).toString().padStart(2, "0");
  const year = dateObject.getFullYear().toString();

  return `${year}-${month}-${day}`;
}

function generatePastelColor() {
  // Генерируем три компоненты цвета (R, G, B) в пределах от 150 до 255
  const red = Math.floor(Math.random() * 105) + 150;
  const green = Math.floor(Math.random() * 105) + 150;
  const blue = Math.floor(Math.random() * 105) + 150;

  // Преобразуем компоненты в строку HEX
  const hexColor = `#${red.toString(16)}${green.toString(16)}${blue.toString(
    16
  )}`;

  return hexColor;
}

async function formatEvent(el){
  const peoplePromises = el.members.map(async (id) => {
    const worker = await Worker.findById(id);
    return {
      image: worker.image,
      name: `${worker.name} ${worker.surname}`,
    };
  });

  const people = await Promise.all(peoplePromises);


  const filesPromise = el.files.map(async (el) => {
    const file = await File.findById(el.fileId);
    return {
      // image: worker.image,
      // name: `${worker.name} ${worker.surname}`,
      fileId: file._id,
      host: el.host,
      name: file.name,
      type: file.type
    };
  });

  const files = await Promise.all(filesPromise);

  const owner = await User.findById(el.owner);

  let checkes = el.stages.reduce((acc, item) => {
    acc.push(...item.planner);
    return acc;
  }, []);

  if (!el.stages.length || el.taskStatus.every(obj => obj.complete)) {
    checkes = el.taskStatus.map(el => ({
      complete: el.status
    }));
  }
  

  return {
    title: el.title,
    files: files,
    description: el.description,
    start: formatDateToDateString(el.startDay),
    end: formatDateToDateString(el.endDay),
    checkes: checkes,
    people,
    tags: el.tags,
    id: el._id,
    stages: el.stages.map((item, index) => ({
      id: item.id,
      name: item.title,
      description: item.description,
      start: item.startDay,
      end: item.endDay,
      points: item.planner.map(el => el.complete),
      files: item.files
    })),
    owner: {
      name: owner.firstName + ' ' + owner.lastName,
      image: owner.photoUrl
    }
  };
}

const createTask = asyncHandler(async (req, res) => {
  try {
    console.log("Create task route");
    // console.log(req.files)

    // Массивы для файлов задачи и этапов
    const bodyFiles = [],
      stageFiles = [];

    for (let item in req.files) {
      if (item.startsWith("bodyFiles")) {
        bodyFiles.push(req.files[item]);
      } else {
        const match = item.match(/stagesFiles\[(\d+)\]\[(\d+)\]/);

        if (match) {
          const stageIndex = parseInt(match[1], 10);
          const fileIndex = parseInt(match[2], 10);

          if (!stageFiles[stageIndex]) {
            stageFiles[stageIndex] = [];
          }

          stageFiles[stageIndex][fileIndex] = req.files[item];
        }
      }
    }

    // Остальные поля для задачи
    const body = JSON.parse(req.body.body);

    // Массив этапов с полями
    const stages = JSON.parse(req.body.stages);

    body.stages = stages;
    body.taskStatus = body.members.map(el => ({
      workerId: el,
      status: false
    }))

    const task = await new Event({ ...body, owner: req.user.id }).save();
    const result = await formatEvent(task);

    console.log(result)

    return res.status(200).send(result);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "Iternal server error!" });
  }
});

const deleteTask = asyncHandler(async (req, res) => {
  try {
    const {id} = req.body;
    await Event.findByIdAndRemove(id);

    return res.status(200).send('Event was deleted');

  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "Iternal server error!" });
  }
});

const allTasksByCompany = asyncHandler(async (req, res) => {
  try {
    console.log("Get all events by company");

    const company = await Company.findById(req.query.id),
      events = await Event.find({ company: company._id });

    const data = await Promise.all(
      Array.from(events).map(async (el) => {
        const peoplePromises = el.members.map(async (id) => {
          const worker = await Worker.findById(id);
          return {
            image: worker.image,
            name: `${worker.name} ${worker.surname}`,
          };
        });

        const people = await Promise.all(peoplePromises);


        const filesPromise = el.files.map(async (el) => {
          const file = await File.findById(el.fileId);
          return {
            // image: worker.image,
            // name: `${worker.name} ${worker.surname}`,
            fileId: file._id,
            host: el.host,
            name: file.name,
            type: file.type
          };
        });

        const files = await Promise.all(filesPromise);

        const owner = await User.findById(el.owner);

        let checkes = el.stages.reduce((acc, item) => {
          acc.push(...item.planner);
          return acc;
        }, []);

        if (!el.stages.length || el.taskStatus.every(obj => obj.complete)) {
          checkes = el.taskStatus.map(el => ({
            complete: el.status
          }));
        }
        

        return {
          title: el.title,
          files: files,
          description: el.description,
          start: formatDateToDateString(el.startDay),
          end: formatDateToDateString(el.endDay),
          checkes: checkes,
          people,
          tags: el.tags,
          id: el._id,
          stages: el.stages.map((item, index) => ({
            id: item.id,
            name: item.title,
            description: item.description,
            start: item.startDay,
            end: item.endDay,
            points: item.planner.map(el => el.complete),
            files: item.files
          })),
          owner: {
            name: owner.firstName + ' ' + owner.lastName,
            image: owner.photoUrl
          }
        };
      })
    );
    return res.json({ array: data });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "Iternal server error!" });
  }
});

const finishTask = asyncHandler(async (req, res) => {
  try {
    const {id} = req.body;

    console.log(id)

    const event = await Event.findById(id);

    event.taskStatus = event.taskStatus.map(el => ({...el, status: true}));
    event.save();

    return res.status(200);
  }catch(err){
    console.log(err);
    return res.status(500).send({ message: "Iternal server error!" });
  }
})

module.exports = {
  createTask,
  deleteTask,
  allTasksByCompany,
  finishTask
};
