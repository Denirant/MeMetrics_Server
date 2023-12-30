const { User } = require("../model/user");
const Company = require("../model/company");
const Worker = require("../model/worker");
const Token = require("../model/token");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const asyncHandler = require("express-async-handler");
const generateOTP = require("../utils/generateOTP");

const AES = require("crypto-js/aes");
const Utf8 = require("crypto-js/enc-utf8");

const GreenSMS = require("greensms");
const client = new GreenSMS({ user: "konkin", pass: "Ydh23FsE" });

// Create worker,
// Verify worker by email,
// Login worker,
// Get all workers,
// Get all workers by company,
// Get worker,
// Change worker data,
// Delete worker,

const uploadFile = require("../utils/upload");
const { Department } = require("../model/department");

const Allowed = {
  Uppers: "QWERTYUIOPASDFGHJKLZXCVBNM",
  Lowers: "qwertyuiopasdfghjklzxcvbnm",
  Numbers: "1234567890",
  Symbols: "!@#$%^&*",
};

const getRandomCharFromString = (str) =>
  str.charAt(Math.floor(Math.random() * str.length));

const generatePassword = (length = 8) => {
  let pwd = "";
  pwd += getRandomCharFromString(Allowed.Uppers); // pwd will have at least one upper
  pwd += getRandomCharFromString(Allowed.Lowers); // pwd will have at least one lower
  pwd += getRandomCharFromString(Allowed.Numbers); // pwd will have at least one number
  pwd += getRandomCharFromString(Allowed.Symbols); // pwd will have at least one symbol
  for (let i = pwd.length; i < length; i++)
    pwd += getRandomCharFromString(Object.values(Allowed).join("")); // fill the rest of the pwd with random characters
  return pwd;
};

const createWorker = asyncHandler(async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const photo = req.files.file; // Получаем загруженный файл
    const userId = req.body.id; // Получаем идентификатор пользователя4
    const user = await User.findById(userId);

    let worker = await Worker.findOne({ email: req.body.email.toLowerCase() });
    if (worker) {
      return res
        .status(409)
        .send({ message: "Worker with given email already exist!" });
    }

    const password = generatePassword(10);

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(password, salt);

    worker = await new Worker({
      name: req.body.name,
      surname: req.body.surname,
      gender: req.body.gender,
      birthday: req.body.birthday,
      companies: [req.body.company_id],
      department: req.body.department_id,
      menager: req.body.menager_id,
      position: req.body.position,
      phone: req.body.phone,
      email: req.body.email,
      image: photo ? "uploads/" + photo.name : "/placeholder.png",
      password: hashPassword,
    }).save();

    const photoRoute = `uploads/${photo.name}`;
    // Можно сохранить файл в папку 'uploads'
    photo.mv(photoRoute, async (err) => {
      if (err) {
        return res.status(500).json({ message: "Error uploading file" });
      }
    });

    user.workers.push(worker._id);
    user.save();

    const company = await Company.findById(req.body.company_id),
      department = await Department.findById(req.body.department_id);

    company.employees.push(worker._id);
    department.employees.push(worker._id);

    if (req.body.department) {
      const newDepartment = await new Department({
        name: req.body.department,
        head: worker._id,
        departments: [],
        employees: [],
        path: department.path + req.body.department + "/",
      }).save();
      company.departments.push(newDepartment._id);
      department.departments.push(newDepartment._id);
    }


    company.save();
    department.save();

    const token = await new Token({
      userId: worker._id,
      token: crypto.randomBytes(32).toString("hex"),
    }).save();

    const url = `${process.env.BASE_URL}worker/${worker._id}/verify/${token.token}`;

    await sendEmail(
      worker.email,
      "Verify email",
      `URL: ${url}\nPassword: ${password}`
    );


    const manager = await Worker.findById(req.body.menager_id);
    
    const workerResult = {
      name: worker.name,
      surname: worker.surname,
      gender: worker.gender,
      birthday: worker.birthday,
      company: company.name,
      department: department.name,
      manager: manager?.name + " " + manager?.surname,
      position: worker.position,
      phone: worker.phone,
      email: worker.email,
      image: worker.image,
    };

    return res.json(workerResult);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error." });
  }
});

const updateWorker = asyncHandler(async (req, res) => {
  // Если есть фотография, то обновляем сначала отдельно ее и
  // сохраняем новое фото, а затем все остальное

  try {
    if (req.files) {
      console.log("Update worker photo");

      const photo = req.files.file,
        photoRoute = `uploads/${photo.name}`;
      photo.mv(photoRoute, async (err) => {
        if (err) {
          return res.status(500).json({ message: "Error uploading file" });
        }
      });

      await Worker.findOneAndUpdate(
        { _id: req.body.id },
        {
          $set: {
            image: "uploads/" + photo.name,
          },
        },
        { new: true }
      );
    }

    const worker = await Worker.findById(req.body.id);

    // console.log(, req.body.company_id)

    // Если обновилась компания, то обновился и отдел и руководитель
    if(!worker.companies.map(objectId => objectId.toString()).includes(req.body.company_id)){
      console.log('Detect company update')

      // Обновляем пока что только в том случае если нет подчиненных (те не глава отдела)
      const department = await Department.findOne({
        head: worker._id,
      })

      if(!department){

        await Worker.findOneAndUpdate(
          { _id: req.body.id },
          {
            $set: {
              companies: [req.body.company_id],// Меняем компанию
              department: req.body.department_id,// Меняет отдел
              menager: req.body.menager_id,// Меняем руководителя
            },
          },
          { new: true }
        );

        // Удаляем работника из компании старой компании и добавляем в новую
        await Company.findByIdAndUpdate(
          worker.companies[0],
          { $pull: { employees: worker._id } },
          { new: true }
        );
        await Company.findByIdAndUpdate(
          req.body.company_id,
          { $push: { employees: worker._id } },
          { new: true }
        );


        // Удаляем работника из старого отдела и добавляем в новый
        await Department.findByIdAndUpdate(
          worker.department,
          { $pull: { employees: worker._id } },
          { new: true }
        );
        await Department.findByIdAndUpdate(
          req.body.department_id,
          { $push: { employees: worker._id } },
          { new: true }
        );


      }else{
        console.log('You cant change company or department if you are the head...')
      }
    }

    // Если обновился отдел, то обновился и руководитель
    if(worker.department != req.body.department_id){
      console.log('Detect department update')

      // Обновляем пока что только в том случае если нет подчиненных (те не глава отдела)
      const department = await Department.findOne({
        head: worker._id,
      })

      if(!department){
        await Worker.findOneAndUpdate(
          { _id: req.body.id },
          {
            $set: {
              department: req.body.department_id,// Меняет отдел
              menager: req.body.menager_id,// Меняем руководителя
            },
          },
          { new: true }
        );

        // Удаляем работника из старого отдела и добавляем в новый
        await Department.findByIdAndUpdate(
          worker.department,
          { $pull: { employees: worker._id } },
          { new: true }
        );
        await Department.findByIdAndUpdate(
          req.body.department_id,
          { $push: { employees: worker._id } },
          { new: true }
        );


      }else{
        console.log('You cant change company or department if you are the head...')
      }
    }


    console.log("Update other data");
    
    await Worker.findOneAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          name: req.body.name,
          surname: req.body.surname,
          gender: req.body.gender,
          birthday: req.body.birthday,
          position: req.body.position,
          phone: req.body.phone,
        },
      },
      { new: true }
    );

    const updatedWorker = await Worker.findById(req.body.id),
      company = await Company.findById(updatedWorker.companies[0]),
      department = await Department.findById(updatedWorker.department),
      manager = await Worker.findById(updatedWorker.menager);

    const workerResult = {
      name: updatedWorker.name,
      surname: updatedWorker.surname,
      gender: updatedWorker.gender,
      birthday: updatedWorker.birthday,
      company: company.name,
      department: department.name,
      manager: manager?.name + " " + manager?.surname,
      position: updatedWorker.position,
      phone: updatedWorker.phone,
      email: updatedWorker.email,
      image: updatedWorker.image,
      id: updatedWorker._id
    };

    return res.json(workerResult);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error." });
  }
});

const loginWorker = asyncHandler(async (req, res) => {
  try {
    const worker = await Worker.findOne({ email: req.body.email });

    if (!worker)
      return res.status(401).send({ message: "Invalid Email or Password!" });

    const validPassword = await bcrypt.compare(
      req.body.password,
      worker.password
    );

    if (!validPassword)
      return res.status(401).send({ message: "Invalid Email or Password!" });

    // проверяем поле varified при логине
    if (!worker.emailVerified) {
      let token = await Token.findOne({ userId: worker._id });
      if (!token) {
        token = await new Token({
          userId: worker._id,
          token: crypto.randomBytes(32).toString("hex"),
        }).save();

        console.log(token);

        // Ссылка для верификации 'http://localhost:300/user/63c5a7dd04cc19c8e3689533/verify/fedf64a50d67c6'
        const url = `${process.env.BASE_URL}worker/${worker._id}/verify/${token.token}`;

        await sendEmail(worker.email, "Verify email", url);
        return res
          .status(400)
          .send({ message: "An email sent to your account again..." });
      } else {
        return res.status(400).send({ message: "Check mailbox..." });
      }
    }

    const jwt_token = worker.generateAuthToken();
    return res.status(200).send({
      data: jwt_token,
      status: "worker",
      id: worker._id,
      message: "Logged in successfully.",
    });
  } catch (err) {
    res.status(500).send({ message: "Iternal server error!" });
  }
});

const verifyWorker = asyncHandler(async (req, res) => {
  try {
    const worker = await Worker.findOne({ _id: req.query.id });
    if (!worker) {
      return res.status(400).send({ message: "Invalid link" });
    }

    const token = await Token.findOne({
      userId: worker._id,
      token: req.query.token,
    });

    if (!token) {
      return res.status(400).send({ message: "Invalid link" });
    }

    await Worker.updateOne({ _id: worker._id }, { emailVerified: true });
    await token.remove();

    return res
      .status(200)
      .send({ message: "Worker email verified seccussfully!" });
  } catch (error) {
    return res.status(500).send({ message: "Internal server error." });
  }
});

const getAllWorkers = asyncHandler(async (req, res) => {
  try {
    const workers = await Worker.find();
    const result = [];

    for (let el of workers) {
      const company = await Company.findById(el.companies[0]),
        department = await Department.findById(el.department),
        manager = await Worker.findById(el.menager);

      const worker = {
        name: el.name,
        surname: el.surname,
        gender: el.gender,
        birthday: el.birthday,
        company: company.name,
        company_id: company._id,
        department: department.name,
        manager: manager?.name + " " + manager?.surname,
        position: el.position,
        phone: el.phone,
        email: el.email,
        image: el.image,
        id: el._id,
        lastOnline: el.lastOnline
      };

      result.push(worker);
    }

    // console.log(result)

    return res.json(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error." });
  }
});

const getAllWorkersByCompany = asyncHandler(async (req, res) => {
  try {
    const headId = req.query.headId,
      companyId = req.query.companyId;

    const workers = await Worker.find({
      head: headId,
      companies: { $in: [companyId] },
    });
    const result = [];

    for (let el of workers) {
      const worker = {
        name: el.name,
        surname: el.surname,
        gender: el.gender,
        birthday: el.birthday,
        companies: el.companies,
        department: el.department,
        manager: el.menager,
        position: el.position,
        phone: el.phone,
        email: el.email,
        image: el.image,
      };

      result.push(worker);
    }

    return res.json(result);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error." });
  }
});

const getWorker = asyncHandler(async (req, res) => {
  try {
    const worker = await Worker.findOne({ _id: req.query.id });
    if (worker) {
      return res.status(200).send({ item: worker });
    } else {
      return res.status(400).send({ message: "No worker like that!" });
    }
  } catch (error) {
    return res.status(500).send({ message: "Internal server error." });
  }
});

const deleteWorker = asyncHandler(async (req, res) => {
  try {
    await Worker.findByIdAndRemove(req.body.id);

    return res.status(200).send({ message: "Delete" });
  } catch (error) {
    return res.status(500).send({ message: "Internal server error." });
  }
});

const onlineWorker = asyncHandler(async (req, res) => {
  try {
    const userId = req.body.id;
    // console.log(userId)
    await Worker.findByIdAndUpdate(userId, { lastOnline: new Date() });

    return res.status(200).send({ message: "ok" });
  } catch (error) {
    return res.status(500).send({ message: "Internal server error." });
  }
});

module.exports = {
  createWorker,
  loginWorker,
  verifyWorker,
  getAllWorkers,
  getWorker,
  deleteWorker,
  onlineWorker,
  getAllWorkersByCompany,
  updateWorker,
};

// Логин через общую форму, фильтрация аккаунта по доп параметру - status [head or worker]
// Невозможно создавать
