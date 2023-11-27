const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const { authenticateJWT, ensureCorrectUser } = require('../middleware/auth');

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', authenticateJWT, async (req, res, next) => {
    try {
        const message = await Message.get(req.params.id);
        // ensure the currently logged-in user is either the sender or recipient
        if (message.from_user === req.user.username || message.to_user === req.user.username) {
            return res.json({ message });
        } else {
            return next({ status: 401, message: 'Unauthorized' });
        }
    } catch (err) {
        return next(err);
    }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', authenticateJWT, async (req, res, next) => {
    try {
        const { to_username, body } = req.body;
        const message = await Message.create(req.user.username, to_username, body);
        return res.status(201).json({ message });
    } catch (err) {
        return next(err);
    }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', authenticateJWT, async (req, res, next) => {
    try {
        const message = await Message.get(req.params.id);
        //ensure the currently logged-in user is the recipient of the message
        if (message.to_user === req.user.username) {
            const readMessage = await Message.markAsRead(req.params.id);
            return res.json({ message: readMessage });
        } else {
            return next({ status: 401, message: 'Unauthorized' });
        }
    } catch (err) {
        return next(err);
    }
});

module.exports = router; 
