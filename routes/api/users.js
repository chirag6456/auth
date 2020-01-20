const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const async = require("async");

// Load input validation
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");

// Load models
const User = require("../../models/User");
const Sports = require("../../models/Sports");

router.post("/register", (req, res) => {
  // Form validation
  const { errors, isValid } = validateRegisterInput(req.body);
  // Check validation
    if (!isValid) {
      return res.status(400).json(errors);
    }
  User.findOne({ email: req.body.email }).then(user => {
      if (user) {
        return res.status(400).json({ email: "Email already exists" });
      } else {
        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          password: req.body.password
        });
  // Hash password before saving in database
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser.save().then(user => res.json(user)).catch(err => console.log(err));
          });
        });
      }
    });
  });

router.post("/login", (req, res) => {
  // Form validation
  const { errors, isValid } = validateLoginInput(req.body);
  // Check validation
    if (!isValid) {
      return res.status(400).json(errors);
    }
  const email = req.body.email;
  const password = req.body.password;
  // Find user by email
    User.findOne({ email }).then(user => {
      // Check if user exists
      if (!user) {
        return res.status(404).json({ emailnotfound: "Email not found" });
      }
  // Check password
      bcrypt.compare(password, user.password).then(isMatch => {
        if (isMatch) {
          // User matched
          // Create JWT Payload
          const payload = {
            id: user.id,
            name: user.name
          };
    // Sign token
          jwt.sign(
            payload,
            keys.secretOrKey,
            {
              expiresIn: 31556926
            },
            (err, token) => {
              res.json({
                success: true,
                token: token
              });
            }
          );
        } else {
          return res
            .status(400)
            .json({ passwordincorrect: "Password incorrect" });
        }
      });
    });
  });


  router.post("/get", (req, res) => {
  // Form validation
  const { errors, isValid } = validateLoginInput(req.body);
  // Check validation
    if (!isValid) {
      return res.status(400).json(errors);
    }
  const email = req.body.email;
  const password = req.body.password;
  // Find user by email
    User.findOne({ email }).then(user => {
      // Check if user exists
      if (!user) {
        return res.status(404).json({ emailnotfound: "Email not found" });
      }
  // Check password
      bcrypt.compare(password, user.password).then(isMatch => {
        if (isMatch) {
          // User matched
          const payload = {
            id: user.id,
            name: user.name
          };
    // Sign token
          jwt.sign(
            payload,
            keys.secretOrKey,
            {
              expiresIn: 31556926  //1 year
            }
          );
          Sports.find((err, sports) => {
            res.send(sports);
          })
        } else {
          return res
            .status(400)
            .json({ passwordincorrect: "Password incorrect" });
        }
      });
    });
  });

  router.post('/forgot', (req, res, next) =>
  {
    async.waterfall([
      function(done){
        crypto.randomBytes(30, function(err, buf){
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done){
        User.findOne({ email : req.body.email}, function(err, user) {
          if( !user )
          {
            return res.send("User not found");
          }

          user.resetPasswordToken = token;
          user.resetPasswordDate = Date.now() + 3600000;

          user.save(function(err){
            done(err, token, user);
          });
        });
      },
      function(token, user, done){
        var smtptransport = nodemailer.createTransport(
          {
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                    user: 'kraig96@ethereal.email',
                    pass: 'zzJz6VaAQEPU2x7JPa'
                  }
          }
        );

        var mailOptions = {
          to : user.email,
          from : 'kraig96@ethereal.email',
          subject : 'NodeJS forgot password',
          text : 'Click the link to reset password.' + 'http://' + req.headers.host + '/api/users/reset/' + token 
        };

        smtptransport.sendMail(mailOptions, function(err){
          console.log('mail sent');
          done(err, 'done');
          res.json({message : "Mail sent to your email id"});
        });
      }
    ], function(err) {
      if(err) return next(err);
    });  
  });


  router.post('/reset/:token', function(req, res) {
        
        User.findOne({resetPasswordToken : req.params.token}).then(user => {
          
          if(!user)
            return res.send("Error");
          
          var pass = req.body.password;
          
          bcrypt.genSalt(10, function(err, salt){
            if(err){
              throw err;
            }
            else{
              bcrypt.hash(pass, salt, function(err, hash){
                if(err){
                  throw err;
                }
                else{
                  User.findOneAndUpdate({resetPasswordToken : req.params.token}, { "$set" : { "password" : hash, resetPasswordDate : undefined, resetPasswordToken : undefined}}).exec(function(err, user){
                    if(err) {
                        console.log(err);
                        res.status(500).send(err);
                    } else {
                             res.status(200).json({message : "Password changed successfully."});
                    }
                 });
              }});
            }
          });
          
        
        })
      });

    router.post('/changepass', (req, res) =>{
      const email = req.body.email;
      var password = req.body.password;
      const newpassword = req.body.newpassword;

      const{ errors, isValid} = validateLoginInput(req.body);

      if(!isValid)
        return res.status(404).json(errors);
      User.findOne({email}).then(user => {
        if(!user)
          return res.status(404).json({message : "User not found"});
        bcrypt.compare(password, user.password).then(isMatch =>{
          if(isMatch){
            bcrypt.genSalt(10, function(err, salt){
              if(err){
                throw err;
              }
              else{
                bcrypt.hash(newpassword, salt, function(err, hash){
                  if(err){
                    throw err;
                  }
                  else{
                    User.findOneAndUpdate({email}, { "$set" : {"password" : hash}});
                    res.json({message : "Update Success"});
                  }
                })
              }
            })
          }
          else
            return res.json({message : "Error"});
        }
        
      )
    })});
    module.exports = router;


