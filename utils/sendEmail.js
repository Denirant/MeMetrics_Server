const nodemailer = require('nodemailer');

module.exports = async(email, subject, htmlContent) => {
    try{

        // имполниель отправления письма
        const transporter = nodemailer.createTransport({
            host: "smtp.mail.ru",
            port: 465,
            secure: true,
            auth: {
                user: "mailertest2023@mail.ru",
                pass: "yUXXVwM4em65stM35GjW"
            }
        });

        await transporter.sendMail({
            from: "mailertest2023@mail.ru",
            to: email,
            subject: subject,
            html: htmlContent
        }) 

        console.log('Email send seccessfullly!')

    }catch(error){
        console.log("Email wasn't send");
        console.log(error)
    }
}

// new mail pass: dOyra3-0ispodnie-bukinist