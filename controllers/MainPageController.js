const path = require('path');
const User = require('../models/User.js');

class MainPageController {
    
    static userData(req, res) {
        if (req.session.user) {
            res.json(req.session.user);
        } 
        else {
            res.status(401).json({ error: "Unauthorized" });
        }
    };

    static mainPage(req, res) {
        if (!req.session.user) {
            res.redirect('/loginForm');
            return;
        }
        res.sendFile(path.join(__dirname, "../views/mainPage.html"));
    };
    
static async uploadAvatar(req, res) {
    try {
        const user = req.session?.user;
        if (!user || !req.file) {
            return res.status(400).json({ error: 'Missing user session or file' });
        }

        const avatarPath = '/avatars/' + req.file.filename;

        const userData = new User();
        await userData.find(user.id);

        userData.avatar_path = avatarPath;
        await userData.save();

        console.log("Avatar uploaded successfully!");
        return res.status(200).json({ avatarPath: avatarPath });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error while uploading avatar' });
    }
}


    static logOut(req, res) {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).send("Logout error");
            }
            res.clearCookie('connect.sid');
            res.redirect('/loginForm');
        });
    };
}

module.exports = MainPageController;