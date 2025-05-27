const User = require('../models/User.js');
const bcrypt = require('bcrypt');
const path = require('path');

class RegisterController {
    
    static registerForm(req, res) {
        if (req.session.user) {
            res.redirect('/mainPage');
            return;
        }
        res.sendFile(path.join(__dirname, '../views/registerForm.html'));
    }

    static async register(req, res) {
        try {
            const user = new User(req.body);
            user.password = await bcrypt.hash(user.password, 10);
            await user.save();
            res.status(200).send(("User registered successfully!"));
        } 
        catch (err) {
            switch (err.code) {
                case 'ER_DUP_ENTRY':
                    if (err.sqlMessage.includes('login')) {
                        res.status(409).send("Login already exists");
                    } else if (err.sqlMessage.includes('email')) {
                        res.status(409).send("Email already exists");
                    } else {
                        res.status(409).send("Duplicate entry");
                    }
                    break;
                default:
                    console.error(err);
                    res.status(500).send("Server error");
                    break;
            }
        }
    }
}

module.exports = RegisterController;