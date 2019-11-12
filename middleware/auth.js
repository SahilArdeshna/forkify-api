const jwt = require('jsonwebtoken');
const ObjectId = require('mongodb').ObjectId;

const db = require('../db');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await db.getDb().db().collection('users').findOne({ _id: new ObjectId(decoded._id), 'tokens.token': token });
        
        if (!user) {
            throw Error();        
        }
    
        req.token = token;
        req.user = user;
        next();

    } catch (err) {
        res.status(401).send({ error: "Please authenticate" });        
    }
};

module.exports = auth;