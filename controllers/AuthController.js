const User = require('../models/User.js');
const bcrypt = require('bcrypt');
const path = require('path');

class AuthController {
    
    static loginForm(req, res) {
        if (req.session.user) {
            res.redirect('/mainPage');
            return;
        }

        res.sendFile(path.join(__dirname, '../views/loginForm.html'));
    };

    static async login(req, res) {
        try {
            const user = await new User().findByField("login" ,req.body.login);
            if (!user) {
                res.status(404).send("User not found");
            } 
            else if (await bcrypt.compare(req.body.password, user.password)) {
                req.session.user = {
                    id: user.id,
                    login: user.login,
                    email: user.email,
                    rating: user.rating
                };
                res.redirect("/mainPage");
            } 
            else {
                res.status(401).send("Password is wrong");
            }
        } 
        catch (err) {
            console.error(err);
            res.status(500).send("Server error");
        }
    }
}

module.exports = AuthController;