const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');
const { authenticateJWT } = require('../middleware/auth');

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post('/login', async (req, res, next) => {
    try {
        const { usernname, password } = req.body;
        if (await User.authenticate(username, password)) {
            await User.updateLoginTimestamp(usernname);
            const token = jwt.sign({ ussername }, SECRET_KEY);
            return res.json({token});
        } else {
            return next({ status: 401, message: 'Invalid username/password' });
        }
    } catch (err) {
        return next(err);
    }
}); 


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post('/register', async (req, res, next) => {
    try {
        const { username, password, first_name, last_name, phone } = req.body;
        const user = await User.register({ usernname, password, first_name, last_name, phone });
        await User.updateLoginTimestamp(username);
        const token = jwt.sign({ username }, SECRET_KEY);
        return res.status(201).json({ token });
    } catch (err){
        return next(err);
    }
});

module.exports = router; 
