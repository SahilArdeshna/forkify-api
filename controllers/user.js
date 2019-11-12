const fs = require('fs');

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ObjectId = require('mongodb').ObjectId;
const { validationResult } = require('express-validator');

const db = require("../db");
const { profileImageStorage } = require('../utils/uploadImages');

exports.createUser = async (req, res, next) => {
  try {
    // Check for data validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = errors.array()[0].msg;
      throw Error(err);
    }

    // Check for duplicate email
    const userEmail = await db.getDb().db().collection('users').findOne({ email: req.body.email });
    if (userEmail) {
      throw new Error('Email adress already registered.');
    }

    // Check for valid password info
    if (!req.body.password.length > 6) {
      throw Error('Password need to have more than 6 characters');
    }

    // Hash password
    const hashPassword = await bcrypt.hash(req.body.password, 10);
    if (!hashPassword) {
      throw new Error("Password creation failed.");
    }

    const userData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      image: '',
      email: req.body.email,      
      password: hashPassword,
      recipes: [],
      likedRecipes: []
    };

    // Insert new User into user database
    const user = await db.getDb().db().collection('users').insertOne(userData);
    if (!user) {
      throw new Error("User creation failed.");
    }    
    
    // Create token
    const token = jwt.sign({ _id: user.ops[0]._id }, process.env.JWT_SECRET);
    await db.getDb().db().collection('users').updateOne({ _id: user.ops[0]._id }, { $set: { tokens: [{ token }] } });
    
    res.status(201).send({ result: "User Created.", user: user.ops[0], token });

  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};

exports.loginUser = async (req, res, next) => {
  try {
    // Check for data validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = errors.array()[0].msg;
      throw Error(err);
    }

    // Get user by email
    const user = await db.getDb().db().collection('users').findOne({ email: req.body.email });
    if (!user) {
      throw Error('User not found with this email.');
    }

    // Check for password
    const passMatched = await bcrypt.compare(req.body.password, user.password);
    if (!passMatched) {
      throw Error('Password not matched.');
    }

    // Create token
    const token = jwt.sign({ _id: user._id}, process.env.JWT_SECRET);
    await db.getDb().db().collection('users').updateOne({ _id: user._id }, { $set: { "tokens": user.tokens.concat({ token }) } });

    res.status(200).send({ result: "Login successfully.", user, token });

  } catch (err) {
    res.status(400).send({ error: err.message });
  }
};

exports.getUserData = async (req, res, next) => {
  try {    
    // find user
    const user = await db.getDb().db().collection('users').findOne({ _id: new ObjectId(req.user._id) });
    if (!user) {
      throw Error('User not found!');
    }

    const userData = {
      firstName: user.firstName,
      lastName: user.lastName,
      image: user.image,
      email: user.email
    };

    res.status(200).json({ status: 200, result: 'User found.', user: userData });

  } catch (err) {
    res.status(503).send({ error: err.message });
  }
};

exports.updateUserData = async (req, res, next) => {
  try {
    // Check for data validation error
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = errors.array()[0].msg;
      throw Error(err);
    }

    const newPassword = req.body.newPassword.trim();
    // Check for valid new password
    if (newPassword != '' && newPassword.length < 6) {
      throw Error("New password atleast have 6 characters!");      
    }

    // Get user by id
    const user = await db.getDb().db().collection('users').findOne({ _id: new ObjectId(req.user._id) });

    // Match old password to update user info
    const matchedOldPass = await bcrypt.compare(req.body.oldPassword, user.password);
    if (!matchedOldPass) {
      throw Error('Old password not matched.');
    }    

    let password;
    if (req.body.newPassword.length >= 6) {
      // Create new password
      password = await bcrypt.hash(req.body.newPassword, 10);
      if (!password) {
        throw Error('New password creation failed.');
      }
    } else {
      password = user.password;
    }

    let imageUrl;
    if (req.file === undefined) {
      imageUrl = user.image;

    } else {
      // remove old image of user
      if (user.image) {
        fs.unlink(user.image, err => {
          if (err) {
            throw Error('User profile image is not removed.');
          }
        });
      }

      // upload image
      let time = new Date().toISOString();
      const result = profileImageStorage(req.file, time);
      if (!result) {
        throw Error('Profile image not uploaded!');
      }

      imageUrl = `images/profileImages/${time}-${req.file.originalname}`
    }

    const userData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      image: imageUrl,
      email: user.email,
      password,
      recipes: user.recipes,
      tokens: user.tokens
    };

    // update user data
    await db.getDb().db().collection('users').updateOne({ _id: new ObjectId(req.user._id) }, { $set: userData });

    res.status(200).json({ result: 'User updated successfully.', status: 200 });

  } catch (err) {
    res.status(503).json({ error: err.message });
  }
};

exports.logoutUser = async (req, res, next) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => {
      return token.token != req.token;
    });

    // remove token from database
    await db.getDb().db().collection('users').updateOne({ _id: req.user._id }, { $set: { tokens: req.user.tokens } })

    res.status(200).send({ result: "Logout successfully." });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

