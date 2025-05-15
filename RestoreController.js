const User = require('./models/user.js');
const nodemailer = require("nodemailer");

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
        res.sendFile(__dirname + '/views/restorePasswordForm.html');
    }

    static async remindPassword(req, res) {
        try {
            const user = await new User().findByField("email" ,req.body.email);

            if (!user) {
                res.status(404).send("Email not found");
            } 
            else {
                if(!req.cookies.lastTimeRemindPassword) {
                    req.cookies.lastTimeRemindPassword = 0;
                }

                const lastTime = req.cookies.lastTimeRemindPassword ? parseInt(req.cookies.lastTimeRemindPassword): 0;

                const now = new Date();

                if (now - lastTime > 100000) {
                    // const newPassword = 
                    // user.password = newPassword

                    await RestoreController.transporter.sendMail({
                        from: 'Sprint09 task3 <4on4on00@gmail.com>',
                        to: `${user.email}`,
                        subject: "Your password",
                        text: `Here is your password: ${user.password}`,
                    });

                    res.cookie('lastTimeRemindPassword', now.toString(), { httpOnly: true });
                    res.status(200).send("Password sent");
                } 
                else {
                    res.status(429).send("Please wait 1 minute before requesting again");
                }
            }
        } 
        catch (err) {
            console.error(err);
            res.status(500).send("Server error");
        }
    };
}

module.exports = RestoreController;