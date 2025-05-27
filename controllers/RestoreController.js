const User = require('../models/User.js');
const nodemailer = require("nodemailer");
const path = require('path');
const bcrypt = require('bcrypt');

class RestoreController {
    static transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "4on4on00@gmail.com",
            pass: "gcpb uybr qycg rhqn",
        },
    });

    static restorePasswordForm(req, res) {
        if (req.session.user) return res.redirect('/mainPage');
        res.sendFile(path.join(__dirname, '../views/restorePasswordForm.html'));
    }

    static async remindPassword(req, res) {
        if (req.body.email) {
            try {
                const user = await new User().findByField("email", req.body.email);
                if (!user) return res.status(404).send("Email not found");

                const now = Date.now();
                const last = req.session.lastTimeRemindPassword || 0;
                if (now - last < 30_000) {
                    return res.status(429).send("Please wait before requesting again");
                }

                req.session.restoreCode =
                    Math.floor(100000 + Math.random() * 900000).toString();
                req.session.lastTimeRemindPassword = now;
                req.session.email = req.body.email;

                await RestoreController.transporter.sendMail({
                    from: '"Restore 👾" <4on4on00@gmail.com>',
                    to: req.body.email,
                    subject: "Your restore code",
                    text: `Here is your code: ${req.session.restoreCode}`,
                });

                return res.status(200).send("Code sent");
            } catch (err) {
                console.error(err);
                return res.status(500).send("Server error");
            }
        }

        if (req.body.code && !req.body.password) {
            return req.session.restoreCode === req.body.code ? res.status(200).send("Code valid") : res.status(400).send("Invalid code");
        }

        if (req.body.code && req.body.password) {
            if (req.session.restoreCode !== req.body.code) {
                return res.status(400).send("Invalid code");
            }
            try {
                const user = await new User().findByField("email", req.session.email);
                if (!user) return res.status(404).send("User not found");

                user.password = await bcrypt.hash(req.body.password, 10);
                await user.save();

                delete req.session.restoreCode;
                delete req.session.lastTimeRemindPassword;
                delete req.session.email;

                return res.status(200).send("Password updated");
            } catch (err) {
                console.error(err);
                return res.status(500).send("Server error");
            }
        }

        res.status(400).send("Bad request");
    }
}

module.exports = RestoreController;
