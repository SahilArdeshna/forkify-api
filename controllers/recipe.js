const fs = require('fs');

const ObjectId = require('mongodb').ObjectID;
const { validationResult } = require('express-validator');

const { recipeImageStorage } = require('../utils/uploadImages');
const db = require('../db');

// get recipes
exports.getRecipes = async (req, res, next) => {
    try {
        // Find user
        const user = await db.getDb().db().collection('users').findOne({ _id: new ObjectId(req.user._id) });
        if (!user) {
            throw Error('User not found!');
        }

        // get all recipes
        const recipes = await db.getDb().db().collection("recipes").find({ _id: { $in: user.recipes } }).toArray();

        if (recipes) {
            res.status(200).json(recipes);
        }

    } catch (err) {
        res.status(503).send({ error: err.message });        
    }
};

// get single recipe
exports.getRecipe = async (req, res, next) => {
    const recipeId = req.params.id;
    try {
        // get single recipe by id
        const recipe = await db.getDb().db().collection("recipes").findOne({ _id: new ObjectId(recipeId) });

        if (recipe) {
            res.status(200).json(recipe);
        }

    } catch (err) {
        res.status(503).send({ error: err.message });        
    }
};

// Get liked recipes
exports.getLikedRecipes = async (req, res, next) => {
    try {
        const user = req.user;
        
        // Get liked recipes from recipe collection
        const recipes = await db.getDb().db().collection('recipes').find({ _id: { $in: user.likedRecipes } }).toArray();
        
        res.status(200).json({ result: 'Liked recipes.', status: 200, recipes });

    } catch (err) {
        res.status(503).send({ error: err.message });
    }
};

// add recipe
exports.addRecipe = async (req, res, next) => {
    try {
        // Check for recipe data validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const err = errors.array()[0].msg;
            throw Error(err);
        }

        // Check for recipe image file
        if (!req.file) {
            throw Error('Please provide recipe image file!');
        }

        let image, ingredientLines, totalTime, yield;
        if (req.body.url) {
            image = req.body.image;
            ingredientLines = JSON.parse(req.body.ingredientLines);
            totalTime = req.body.totalTime;
            yield = req.body.yield

        } else {
            let time = new Date().toISOString(); 
            const obj = await comman(req, time);

            image = `images/recipeImages/${time}-${req.file.originalname}`;
            ingredientLines = obj.ingredients;
            totalTime = obj.totalTime;
            yield = obj.yield
        }
        
        const recipeData = {
            label: req.body.label,
            image,
            ingredientLines,
            source: req.body.source,
            totalTime,
            yield
        }; 
    
        // upload recipe into database
        const recipe = await db.getDb().db().collection('recipes').insertOne(recipeData);

        // add recipe id into user recipe list
        await db.getDb().db().collection('users').findOneAndUpdate({ _id: new ObjectId(req.user._id) }, { $set: { 'recipes': req.user.recipes.concat(recipe.ops[0]._id) } });

        res.status(201).send({ result: "Recipe created successfully.", status: 201 });

    } catch (err) {
        res.status(503).send({ error: err.message });
    }
};

exports.addLikedRecipe = async (req, res, next) => {
    try {
        const user = req.user;
            
        const recipeData = {
            label: req.body.label,
            image: req.body.image,
            ingredientLines: JSON.parse(req.body.ingredientLines),
            source: req.body.source,
            totalTime: req.body.totalTime,
            yield: req.body.yield,
            recipeId: req.body.recipeId         
        };

        // save recipe into database
        const recipe = await db.getDb().db().collection('recipes').insertOne(recipeData);

        // save recipe data into user
        await db.getDb().db().collection('users').updateOne({ _id: user._id }, { $set: { likedRecipes: user.likedRecipes.concat( recipe.ops[0]._id) } });
        
        res.status(200).json({ result: 'done', status: 200, recipe: recipe.ops[0] });

    } catch (err) {
        res.status(503).send({ error: err.message });
    }
};  

// Edit recipe
exports.editRecipe = async (req, res, next) => {
    try {
        // Check for recipe data validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const err = errors.array()[0].msg;
            throw Error(err);
        }

        const recipeId = req.params.id;

        // find recipe by id
        const recipe = await db.getDb().db().collection('recipes').findOne({ _id: new ObjectId(recipeId) });

        let time = new Date().toISOString(); 
        const obj = await comman(req, time, recipe.image);
        let imagePath;

        if (req.file === undefined) {
            imagePath = recipe.image;
        } else {
            // remove old image of recipe            
            fs.unlink(recipe.image, err => {
                if (err) {                    
                    throw Error('File not removed.');
                }
            });

            // save new image path
            imagePath = `images/recipeImages/${time}-${req.file.originalname}`
        }

        const recipeData = {
            label: req.body.label,
            image: imagePath, 
            ingredientLines: obj.ingredients,
            source: req.body.source,
            totalTime: obj.totalTime,
            yield: obj.yield
        };

        // upload edited recipe into database
        await db.getDb().db().collection('recipes').updateOne({ _id: new ObjectId(recipeId) }, { $set: recipeData });

        res.status(200).send({ result: 'Recipe updated successfully.', status: 200 });

    } catch (err) {
        res.status(503).send({ error: err.message });
    }
};

const comman = async (req, time) => {
    try {
        // store recipe image in server image file using sharp
        if (req.file) {            
            const result = await recipeImageStorage(req.file, time);
            if (!result) {
                throw Error("File uploading faild.");
            }
        }
    
        const ingredients = req.body.ingredientLines.split(',');
        const totalTime = parseInt(req.body.totalTime);
        const yield = parseInt(req.body.yield); 
    
        const obj = {
            ingredients,
            totalTime,
            yield
        };
        return obj;

    } catch (err) {
        throw Error(err);
    }
};

exports.deleteRecipe = async (req, res, next) => {    
    try {
        const recipeId = req.params.id;

        // remove recipe from database
        const recipe = await db.getDb().db().collection('recipes').findOneAndDelete({ _id: new ObjectId(recipeId) });
        if (!recipe) {            
            throw Error('Recipe not deleted!');
        }

        // remove recipe from user's recipes list
        await db.getDb().db().collection('users').updateOne({ _id: new ObjectId(req.user._id) }, { $pull: { recipes: new ObjectId(recipe.value._id) } });

        // remove image from server
        fs.unlink(recipe.value.image, err => {
            if (err) {
                throw Error(err);
            }
        });

        res.status(200).send({ result: 'Recipe deleted successfully.' });
    } catch (err) {
        res.status(503).send({ error: err.message });
    }
};

exports.deleteLikedRecipe = async (req, res, next) => {
    try {
        const recipeId = req.params.id;

        // remove recipe from database
        const recipe = await db.getDb().db().collection('recipes').findOneAndDelete({ _id: new ObjectId(recipeId) });
        if (!recipe) {            
            throw Error('Recipe not deleted!');
        }

        // remove recipe from user's recipes list
        await db.getDb().db().collection('users').updateOne({ _id: new ObjectId(req.user._id) }, { $pull: { likedRecipes: new ObjectId(recipe.value._id) } });
        
        res.status(200).send({ result: 'Recipe deleted successfully.' });
    } catch (err) {
        res.status(503).send({ error: err.message });
    }
};