const { User, validate } = require("../model/user");
const Token = require("../model/token");
const Joi = require("joi");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const asyncHandler = require("express-async-handler");
const generateOTP = require("../utils/generateOTP");

const AES = require("crypto-js/aes");
const Utf8 = require("crypto-js/enc-utf8");

const GreenSMS = require("greensms");
const client = new GreenSMS({ user: "konkin", pass: "Ydh23FsE" });

const config = require("config");
const fs = require("fs");

const File = require("../model/file");
const fileService = require("../services/fileService");

const uuid = require("uuid");

const https = require("https");

const axios = require("axios");

// desc: Auth user by email
// route: POST /api/users/login
const validateAuth = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().label("Email"),
    password: Joi.string().required().label("Password"),
  });

  return schema.validate(data);
};

const getDataRoute = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.query.id);

    return res.status(200).send({ data: user });
  } catch (error) {
    return res.status(400).send({ message: "Invalid email data!" });
  }
});

const updateUserPassword = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.query.id),
          password = req.body.newPass;

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(password, salt);

    user.password = hashPassword;
    await user.save();

    return res.status(200).send({ message: 'Password was changed' });
  } catch (error) {
    return res.status(400).send({ message: "Something went wrong!" });
  }
});


const uploadProfilePhoto = asyncHandler(async (req, res) => {
  // Проверяем, был ли передан файл
  if (!req.files || !req.files.photo) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const photo = req.files.photo; // Получаем загруженный файл
  const userId = req.query.id; // Получаем идентификатор пользователя4
  const user = await User.findById(userId)
  const photoRoute = `uploads/${userId}_${photo.name}`
  
  // Можно сохранить файл в папку 'uploads'
  photo.mv(photoRoute, async (err) => {
    if (err) {
      return res.status(500).json({ message: 'Error uploading file' });
    }

    user.photoUrl = photoRoute;
    await user.save();
    return res.status(200).json({ message: 'File uploaded successfully' });
  });
});

const loginRoute = asyncHandler(async (req, res) => {
  try {
    //Проверяем правельность полученных из формы пользователя данных по правилам валидации JOI
    const { error } = validateAuth(req.body);
    //Если имеются ошибки в данных, возвращаем ответ с сообщением первой ошибки и выходим из запроса
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    const user = await User.findOne({ email: req.body.email });

    if (!user)
      return res.status(401).send({ message: "Invalid Email or Password!" });

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!validPassword)
      return res.status(401).send({ message: "Invalid Email or Password!" });

    // проверяем поле varified при логине
    if (!user.emailVerified) {
      let token = await Token.findOne({ userId: user._id });
      if (!token) {
        token = await new Token({
          userId: user._id,
          token: crypto.randomBytes(32).toString("hex"),
        }).save();

        console.log(token);

        // Ссылка для верификации 'http://localhost:300/user/63c5a7dd04cc19c8e3689533/verify/fedf64a50d67c6'
        const url = `${process.env.BASE_URL}user/${user._id}/verify/${token.token}`;

        const emailContent = `
            <html>
            <head>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                    }
                    .container {
                        width: 100%;
                        max-width: 600px;
                        margin: auto;

                        display: flex;
                        align-=items: center;
                    }
                    img {
                        width: 100%;
                        height: auto;
                        object-fit: cover;
                    }
                    .header {
                        font-size: 20px;
                        font-weight: 700;
                        margin-top: 20px;

                        width: 50%;
                    }
                    .button {
                        display: inline-block;
                        padding: 6px 20px;
                        font-size: 16px;
                        text-align: center;
                        text-decoration: none;
                        background-color: #4CAF50;
                        color: #fff;
                        border-radius: 8px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <img src="https://images.unsplash.com/photo-1552845108-5f775a2ccb9b?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Ymx1ZSUyMG1vdW50YWlufGVufDB8fDB8fHww" alt="Welcome Image" />
                    <div class="header">Добро пожаловать на MeMetrics!</div>
                    <p>Для продолжения подтвердите свою почту, перейдя по ссылке ниже:</p>
                    <a class="button" href="${url}" target="_blank">Подтвердить почту</a>
                </div>
            </body>
            </html>
        `;

        await sendEmail(user.email, "Verify email", emailContent);
        return res
          .status(400)
          .send({ message: "An email sent to your account again..." });
      } else {
        return res.status(400).send({ message: "Check mailbox..." });
      }
    }

    // if(!user.phoneVerified){
    //     return res.status(400).send({message: 'Phone not verifed', id: user._id});
    // }

    const jwt_token = user.generateAuthToken(user);
    return res.status(200).send({
      data: jwt_token,
      email: user.email,
      id: user._id,
      user: user,
      message: "Logged in successfully.",
    });
  } catch (err) {
    res.status(500).send({ message: "Iternal server error!" });
  }
});

// desc: Auth user by email
// route: POST /api/users/register
const registerRoute = asyncHandler(async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    let user = await User.findOne({ email: req.body.email });
    if (user) {
      return res
        .status(409)
        .send({ message: "User with given email already exist!" });
    }
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(req.body.password, salt);

    user = await new User({ ...req.body, password: hashPassword }).save();

    const token = await new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    }).save();

    const url = `${process.env.BASE_URL}user/${user._id}/verify/${token.token}`;
    const filePath = `${config.get("filePath")}/${user._id}`;
    fs.mkdirSync(filePath);

    const emailContent = `
        <html>
        <head>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                }
                .container {
                    width: 100%;
                    max-width: 600px;
                    margin: auto;

                    display: flex;
                    align-=items: center;
                }
                img {
                    width: 100%;
                    height: 200px;
                    object-fit: cover;
                    border-radius: 20px;
                }
                .header {
                    font-size: 30px;
                    font-weight: 500;
                    margin-top: 20px;
                    width: 50%;
                }
                .button {
                    display: inline-block;
                    padding: 6px 20px;
                    font-size: 16px;
                    text-align: center;
                    text-decoration: none;
                    background-color: #4CAF50;
                    color: #fff;
                    border-radius: 8px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <img src="https://images.unsplash.com/photo-1552845108-5f775a2ccb9b?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Ymx1ZSUyMG1vdW50YWlufGVufDB8fDB8fHww" alt="Welcome Image" />
                <div class="header">Добро пожаловать на MeMetrics!</div>
                <p>Для продолжения подтвердите свою почту, перейдя по ссылке ниже:</p>
                <a class="button" href="${url}" target="_blank">Подтвердить почту</a>
            </div>
        </body>
        </html>
    `;

    await sendEmail(user.email, "Verify email", emailContent);

    return res
      .status(201)
      .send({ message: "An email sent to your account..." });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "Internal server error." });
  }
});

// @desc: Verify user by email
// @route: Get /api/users/verify?id&token
const verifyRoute = asyncHandler(async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.query.id });
    if (!user) return res.status(400).send({ message: "Invalid link" });

    const token = await Token.findOne({
      userId: user._id,
      token: req.query.token,
    });
    if (!token) return res.status(400).send({ message: "Invalid link" });

    await User.updateOne({ _id: user._id }, { emailVerified: true });
    console.log("data was updated");

    await token.remove();
    console.log("token was removed");

    return res.status(200).send({ message: "Email verified seccussfully!" });
  } catch (error) {
    return res.status(500).send({ message: "Internal server error." });
  }
});

// desc: Auth user by email
// route: POST /api/users/reset_check
const resetRequestRoute = asyncHandler(async (req, res) => {
  try {
    const emailSchema = Joi.object({
      email: Joi.string().email().required().label("Email"),
    });

    const { error } = emailSchema.validate(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });
    let user = await User.findOne({ email: req.body.email });
    if (!user)
      //409 - ошибка отсутствия данных
      return res
        .status(409)
        .send({ message: "User with given email does not exist!" });

    let token = await Token.findOne({ userId: user._id });
    if (!token) {
      token = await new Token({
        userId: user._id,
        token: crypto.randomBytes(32).toString("hex"),
      }).save();
    }

    const url = `${process.env.BASE_URL}password-reset/${user._id}/${token.token}`;
    await sendEmail(user.email, "Password reset", url);

    res
      .status(200)
      .send({ message: "Password reset link sent to your email..." });
  } catch (error) {
    res.status(500).send({ message: "Internal server error!" });
  }
});

// desc: Auth user by email
// route: GET /api/users/reset?id&token
const resetCheckRoute = asyncHandler(async (req, res) => {
  try {
    console.log(req.query);
    const user = await User.findOne({ _id: req.query.id });
    if (!user) return res.status(400).send({ message: "Invalid link" });

    const token = await Token.findOne({
      userId: user._id,
      token: req.query.token,
    });
    if (!token) return res.status(400).send({ message: "Invalid link" });

    res.status(200).send({ message: "Valid url!" });
  } catch (error) {
    res.status(500).send({ message: "Internal server error!" });
  }
});

// desc: Auth user by email
// route: POST /api/users/reset?id&token
const resetChangeRoute = asyncHandler(async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.query.id });
    if (!user) return res.status(400).send({ message: "Invalid link" });

    const token = await Token.findOne({
      userId: user._id,
      token: req.query.token,
    });
    if (!token) return res.status(400).send({ message: "Invalid link" });

    if (!user.verified) user.verified = true;

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(req.body.password, salt);

    user.password = hashPassword;
    await user.save();
    await token.remove();

    res.status(200).send({ message: "Password reset successfully!" });
  } catch (error) {
    res.status(500).send({ message: "Internal server error!" });
  }
});

function timeSince(timestamp) {
  let time = Date.parse(timestamp);
  let now = Date.now();
  let secondsPast = (now - time) / 1000;

  return secondsPast;
}

const encryptAES = (text, passphrase = process.env.phoneCodeSalt) => {
  return AES.encrypt(text, passphrase).toString();
};

const decryptAES = (ciphertext, passphrase = process.env.phoneCodeSalt) => {
  const bytes = AES.decrypt(ciphertext, passphrase);
  const originalText = bytes.toString(Utf8);
  return originalText;
};

const OTPtest = asyncHandler(async (req, res) => {
  try {
    const code = generateOTP();
    return res.status(200).send({ code: code });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error!" });
  }
});

const OTPRoute = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.query.id);

    let token = await Token.findOne({ userId: user._id }),
      code = undefined;

    if (!token || timeSince(token.createdAt) > 180) {
      await token?.remove();

      code = generateOTP();
      console.log(code);
      token = await new Token({
        userId: user._id,
        token: encryptAES(code),
        createdAt: Date.now(),
      }).save();

      await client.sms
        .send({
          to: "7" + user.phone,
          txt: `Ваш код подтверждения: ${code}`,
          from: "MeMetrics",
        })
        .then((response) => console.log(response.request_id));

      return res.status(200).send({ message: "We send you new code" });
    }

    console.log(decryptAES(token.token));

    console.log(`Time left: ${180 - timeSince(token.createdAt)}`);

    return res
      .status(200)
      .send({ message: "We have already send code your phone" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal server error!" });
  }
});

const OTPVerifyRoute = asyncHandler(async (req, res) => {
  try {
    let { id, code } = req.query,
      user = await User.findById(id);

    if (!user) return res.status(400).send({ message: "Invalid user!" });

    let token = await Token.findOne({ userId: user._id });

    console.log(token);

    if (!token) {
      code = generateOTP();
      token = await new Token({
        userId: user._id,
        token: encryptAES(code),
        createdAt: Date.now(),
      });

      // client.sms.send({to: '7' + user.phone, txt: `Ваш код подтверждения: ${code}`}).then((response) => console.log(response.request_id))

      return res.status(400).send({ message: "We send you new code" });
    }

    let decryptToken = decryptAES(token.token);

    if (timeSince(token.createdAt) <= 180) {
      if (code === decryptToken) {
        await User.updateOne({ _id: user._id }, { phoneVerified: true });
        await token.remove();

        return res
          .status(200)
          .send({ message: "Hello, " + user.firstName + "!" });
      } else {
        return res.status(400).send({ message: "Incorrect code!" });
      }
    } else {
      return res.status(400).send({ message: "Your time was ended!" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal server error!" });
  }
});

// desc: Auth user by email
// route: POST /api/users/register
const googleAuthRoute = asyncHandler(async (req, res) => {
  console.log("Google");
  console.log(req.body);
  console.log(validate(req.body));
  try {
    const { error } = validate(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    let user = await User.findOne({ email: req.body.email });

    if (user) {
      console.log({ id: user._id });

      const jwt_token = user.generateAuthToken(user);
      return res.status(200).send({
        data: jwt_token,
        id: user._id,
        message: "Logged in successfully.",
      });
    }
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(req.body.password, salt);

    // let resPhone = '';

    // for(let i = 0; i < req.body.phone.length; i++){
    //     if(!' +-()'.includes(req.body.phone[i])){
    //         resPhone += req.body.phone[i];
    //     }
    // }

    // resPhone = resPhone.slice(1);

    // console.log(resPhone);

    user = await new User({
      ...req.body,
      emailVerified: true,
      password: hashPassword,
    }).save();

    const jwt_token = user.generateAuthToken(user);

    return res.status(200).send({
      data: jwt_token,
      id: user._id,
      message: "Logged in successfully.",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "Internal server error." });
  }
});

const AddNotification = asyncHandler(async (req, res) => {
  try {
    const { notification } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(400).json({ message: "Invalid user data!" });
    }

    if (user.notifications.length >= 50) {
      user.notifications.shift();
    }

    const uniqueId = uuid.v4();
    notification.id = uniqueId;

    user.notifications.push(notification);
    await user.save();

    return res.status(200).json({ message: "Notification was added" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

const DeleteNotification = asyncHandler(async (req, res) => {
  try {
    const notificationId = req.query.id;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(400).json({ message: "Invalid user data!" });
    }

    const notificationIndex = user.notifications.findIndex(
      (notification) => notification.id === notificationId
    );

    if (notificationIndex === -1) {
      return res.status(404).json({ message: "Cant find notification" });
    }

    user.notifications.splice(notificationIndex, 1);
    await user.save();

    return res.status(200).json({ message: "Notification was deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

const authRoute = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id),
    jwt_token = user.generateAuthToken(user);

  console.log("Token update");

  res.json({ token: jwt_token });
});


const getAllTags = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'No user data' });
    }

    const tags = user.tags || [];
    res.status(200).json({ tags });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const addTag = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, color } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required for a tag' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'No user data' });
    }

    const newTag = { title, color: '#' + color || '#000' };
    user.tags = [...user.tags, newTag];
    await user.save();

    res.status(200).json({ newTag });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const removeTag = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required for a tag' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'No user data' });
    }

    user.tags = user.tags.filter(existingTag => existingTag.title !== title);
    await user.save();

    res.status(200).json({ tags: user.tags });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};







module.exports = {
  loginRoute,
  registerRoute,
  verifyRoute,
  resetRequestRoute,
  resetCheckRoute,
  resetChangeRoute,
  OTPRoute,
  OTPVerifyRoute,
  OTPtest,
  googleAuthRoute,
  AddNotification,
  DeleteNotification,
  authRoute,
  getDataRoute,
  updateUserPassword,
  uploadProfilePhoto,
  getAllTags,
  removeTag,
  addTag
};

// openssl req -config /Users/daniil/Downloads/openssl.cnf -key name.key -new -sha256 -out name.csr

// openssl req -utf8 -config /Users/daniil/Downloads/openssl.cnf -key MeMetrics.key -new -sha256 -out MeMetrics.csr

// openssl req -config /Users/daniil/Downloads/openssl.cnf -key MeMetrics.key -new -sha256 -out MeMetrics.csr

// openssl genrsa -out MeMetrics.key 2048



