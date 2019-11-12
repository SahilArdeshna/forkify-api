const express = require('express');
const { body } = require('express-validator');
const multer = require("multer");

const auth = require('../middleware/auth');
const userController = require('../controllers/user');
const { fileFilter } = require("../utils/uploadImages");

const routes = express.Router();

// signup route with validation
routes.post('/signup', [
    body('firstName')
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please enter valid first name!"),
    body('lastName')
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please enter valid last name!"),
    body('email')
        .trim()
        .isEmail()
        .withMessage("Please enter valid email!")
        .normalizeEmail(),
    body('password')
        .trim()
        .isLength({ min: 6 })
        .withMessage("Password atleast have 6 characters!")
], userController.createUser);

// signin route with validation
routes.post('/login', [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please enter valid email!')
        .normalizeEmail(),
    body('password')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Password must be long enough!')
], userController.loginUser);

// user data route
routes.get('/userData', auth, userController.getUserData);

// update user routes with validation
routes.post('/updateUser', auth, multer({ fileFilter }).single('image'), [
    body('firstName')
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please enter valid first name!"),
    body('lastName')
        .trim()
        .not()
        .isEmpty()
        .withMessage("Please enter valid last name!"),
    body('oldPassword')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Old password must be long enough!')
], userController.updateUserData);

// logout user routes
routes.post('/logout', auth, userController.logoutUser);

module.exports = routes;