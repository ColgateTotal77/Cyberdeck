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
        res.sendFile(__dirname + "/views/mainPage.html");
    };
    
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