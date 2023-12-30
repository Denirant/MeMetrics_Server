const nodemailer = require('nodemailer');

module.exports = async(email, subject, url) => {
    try{

        // имполниель отправления письма
        const transporter = nodemailer.createTransport({
            host: "smtp.mail.ru",
            port: 465,
            secure: true,
            auth: {
                user: "mailertest2023@mail.ru",
                pass: "WkqHvZ4EVsE2xxuptcj4"
            }
        });

        await transporter.sendMail({
            from: "mailertest2023@mail.ru",
            to: email,
            subject: subject,
            text: url
        }) 

        console.log('Email send seccessfullly!')

    }catch(error){
        console.log("Email wasn't send");
        console.log(error)
    }
}