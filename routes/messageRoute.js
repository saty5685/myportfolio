const express = require('express');
const router = express.Router();
const fs = require('fs');
const moment = require('moment-timezone');
const validator = require('validator');

const NTFY_TOPIC = process.env.NTFY_TOPIC;

function sendPushNotification(data) {
    const body = `From: ${data.name}\nEmail: ${data.email}\nTime: ${data.timeOfMessage}\n\n${data.message}`;

    return fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
        method: 'POST',
        headers: {
            'Title': `Portfolio: ${data.subject}`,
            'Priority': '4',
            'Tags': 'email,portfolio',
            'Click': `mailto:${data.email}`,
            'Actions': `view, Reply via Email, mailto:${data.email}`
        },
        body
    });
}

router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: 'Invalid email address' });
        }

        const sanitizedData = {
            name: validator.escape(validator.trim(name)),
            email: validator.normalizeEmail(validator.trim(email)),
            subject: validator.escape(validator.trim(subject)),
            message: validator.escape(validator.trim(message)),
            timeOfMessage: moment().tz('Asia/Kolkata').format('MMMM Do YYYY, h:mm:ss a')
        };

        const messageString = JSON.stringify(sanitizedData, null, 2);

        fs.appendFile('clientMessages/messages.txt', messageString + '\n', (err) => {
            if (err) console.error('File write error:', err);
        });

        if (NTFY_TOPIC) {
            await sendPushNotification(sanitizedData);
        }

        res.status(201).json({ message: 'Message sent successfully' });
    } catch (err) {
        console.error('Message route error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
