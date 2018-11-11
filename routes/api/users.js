const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const key = require("../../config/keys").secret;
const passport = require("passport");

// Load User Model
const User = require("../../models/User");

// @route POST /api/users/
// @desc Register the user
// @access Public
router.post("/register", (req, res) => {
  User.findOne({ email: req.body.email }).then(user => {
    if (user) return res.status(400).json({ email: "Email already exists" });
    else {
      avatar = gravatar.url(req.body.email, {
        s: "200",
        r: "pg",
        d: "mm"
      });
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        avatar,
        password: req.body.password
      });

      // Hash password
      bcrypt.genSalt(10, (err, salt) => {
        if (err) throw err;
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err));
        });
      });
    }
  });
});

// @route POST /api/users
// @desc Login user
// @access Public
router.post("/login", (req, res) => {
  User.findOne({ email: req.body.email }).then(user => {
    // Check user email
    if (!user) return res.status(404).json({ email: "User not found" });

    // Compare password
    bcrypt.compare(req.body.password, user.password).then(isMatch => {
      if (isMatch) {
        // User is matched
        const payload = {
          id: user.id,
          name: user.name,
          avatar: user.avatar
        };

        jwt.sign(payload, key, { expiresIn: 3600 }, (err, token) => {
          if (err) throw err;
          res.json({
            success: true,
            token: "Bearer " + token
          });
        });
      } else return res.status(400).json({ password: "Password incorrect" });
    });
  });
});

router.get(
  "/test",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json(req.user);
  }
);

module.exports = router;
