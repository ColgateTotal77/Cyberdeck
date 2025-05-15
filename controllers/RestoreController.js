const User = require('../models/user.js');
const nodemailer = require("nodemailer");
const path = require('path');

class RestoreController {
    static transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "4on4on00@gmail.com",
            pass: "gcpb uybr qycg rhqn",
        },
    });

    static restorePasswordForm(req, res) {
        if (req.session.user) {
            res.redirect('/mainPage');
            return;
        }
        res.sendFile(path.join(__dirname, '../views/restorePasswordForm.html'));
    }

    static async remindPassword(req, res) {
        if(req.body.email) {
            try {
                const user = await new User().findByField("email" ,req.body.email);

                if (!user) {
                    res.status(404).send("Email not found");
                } 
                else {
                    if(!req.session.lastTimeRemindPassword) {
                        req.session.lastTimeRemindPassword = 0;
                    }
                    const lastTime = req.session.lastTimeRemindPassword ? parseInt(req.session.lastTimeRemindPassword): 0;

                    const now = new Date();

                    if (now - lastTime > 50000) {
                        req.session.restoreCode = Math.floor(100000 + Math.random() * 900000).toString();
                        await RestoreController.transporter.sendMail({
                            from: '<4on4on00@gmail.com>',
                            to: `${user.email}`,
                            subject: "Your code for restore password",
                            text: `Here is code for restore password: ${req.session.restoreCode}`,
                        });
                        req.session.email = req.body.email;

                        res.cookie('lastTimeRemindPassword', now.toString(), { httpOnly: true });
                        res.status(200).send("Code sent");
                    } 
                    else {
                        res.status(429).send("Please wait 30 secund before requesting again");
                    }
                }
            } 
            catch (err) {
                console.error(err);
                res.status(500).send("Server error");
            }
        }
        else {
            try {
                if(req.session.restoreCode === req.body.code) {
                    const newPassword = generatePassword();
                        await RestoreController.transporter.sendMail({
                            from: '<4on4on00@gmail.com>',
                            to: `${req.session.email}`,
                            subject: "Your new password",
                            text: `Here is your new password: ${newPassword}`,
                        });
                        const user = await new User().findByField("email" ,req.session.email);
                        const hashedPassword = await bcrypt.hash(newPassword, 10);
                        user.password = hashedPassword;
                        user.save();
                        res.status(200).send("New password sent");
                    }
                else {
                    res.status(429).send("Code is incorrect!");
                }
            } 
            catch (err) {
                console.error(err);
                res.status(500).send("Server error");
            }
        }

    };
}

function generatePassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars[Math.floor(Math.random() * chars.length)];
    }
    return password;
}

module.exports = RestoreController;