const User = require('./models/user.js');
const bcrypt = require('bcrypt');

class AuthController {
    
    static loginForm(req, res) {
        if (req.session.user) {
            res.redirect('/mainPage');
            return;
        }

        res.sendFile(__dirname + "/views/loginForm.html");
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
                    fullName: user.fullName,
                    isAdmin: user.isAdmin,
                    email: user.email
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