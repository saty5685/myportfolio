const express=require('express')
const router=express.Router()
const fs = require('fs'); 
const moment = require('moment-timezone');
const Messages=require('../models/Messages')
router.post('/', async (req,res)=>{
    console.log("hello this is request",req.body)
    const now = moment().tz('Asia/Kolkata'); 
    const formattedDate = now.format('MMMM Do YYYY, h:mm:ss a');
    try {
        const messageData = {
            name: req.body.name,
            email: req.body.email,
            subject: req.body.subject,
            message: req.body.message,
            timeOfMessage:formattedDate
        };

        // Convert to JSON string (if using JSON format)
        const messageString = JSON.stringify(messageData, null, 2); // Human-readable

        // Write data to file (replace 'messages.json' with your desired filename)
        fs.appendFile('clientMessages/messages.txt', messageString+'\n', (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Error appending to file' });
            }
            console.log('Message appended to file successfully!');
            res.status(201).json({ message: 'Message saved' });
        });
    } catch (err) {
        console.error(err);
        res.status(400).json(err);
    }
    
})
module.exports=router 