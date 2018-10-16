
module.exports.isAuthorized = function(req, email) {

};

module.exports = function(app, db) {
  this.isAuthorized = function(req, email) {
    if (req.cookies["token"] != undefined && email != undefined) {
      if (db.get("users").filter({"token": req.cookies["token"], "email": email})
          .size().value()==1) {
        const time = (new Date()).getTime();
        const user = db.get("users").find({"email": email}).value();
        return user["token_valid_until"] >= time;
      }
    }
    return false;
  };

  app.post("/api/register-user", function(req, res) {
    user = req.body;
    user["token"] = "";
    user["token_valid_until"] = "";
    user["library"] = [];
    db.get("users").push(user).write();
    res.send("okay");
  });

  app.post("/api/login-user", function(req, res) {
    const loginReq = req.body;
    if (loginReq["email"] == undefined || loginReq["password"] == undefined) {
      res.send("not okay");
    } else if (db.get("users").filter(loginReq).size().value() == 1) {
      const token = Math.random().toString(36).substring(2, 15) + Math.random()
          .toString(36).substring(2, 15);
      const tokenValidUntil = (new Date()).getTime() + 1000*60*60*3;
      db.get("users").find(loginReq).assign({"token": token}).write();
      db.get("users").find(loginReq).assign({"token_valid_until": tokenValidUntil}).write();
      db.write();
      res.cookie("token", token).cookie("email", loginReq["email"]).send("okay");
    } else {
      res.send("not okay");
    }
  });

  return this;
};
