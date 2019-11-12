const express = require("express");
const { body } = require('express-validator');
const multer = require("multer");

const recipeController = require("../controllers/recipe");
const { fileFilter } = require("../utils/uploadImages");
const auth = require('../middleware/auth');

const routes = express.Router(); 

// Get recipes route
routes.get("/getRecipes", auth, recipeController.getRecipes);

// Get single recipe route
routes.get("/getRecipe/:id", auth, recipeController.getRecipe);

// Get liked recipe
routes.get('/getLikedRecipes', auth, recipeController.getLikedRecipes);

// Post recipe route with data validation
routes.post("/addRecipe", auth, multer({ fileFilter }).single('image'), [
    body('label')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Please provide recipe title!'),
    body('ingredientLines')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Please provide recipe ingredients!'),
    body('source')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Please provide author name!'),
    body('totalTime')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Please provide recipe making time!'),
    body('yield')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Please provide total number of servings!')
], recipeController.addRecipe);

// Add liked recipe into database
routes.post('/addLikedRecipe', auth, multer({ fileFilter }).single('image'), recipeController.addLikedRecipe);

// Update recipe route with data validation
routes.post('/editRecipe/:id', auth, multer({ fileFilter }).single('image'), [
    body('label')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Please provide recipe title!'),
    body('ingredientLines')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Please provide recipe ingredients!'),
    body('source')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Please provide author name!'),
    body('totalTime')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Please provide recipe making time!'),
    body('yield')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Please provide total number of servings!')
], recipeController.editRecipe);

// Delete recipe route
routes.delete('/deleteRecipe/:id', auth, recipeController.deleteRecipe);

// Delete liked recipe
routes.delete('/deleteLikedRecipe/:id', auth, recipeController.deleteLikedRecipe);

module.exports = routes;
