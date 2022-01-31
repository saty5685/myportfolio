const express=require('express')
const router=express.Router()
const Messages=require('../models/Messages')
router.post('/', async (req,res)=>{
    console.log("hello this is request",req.body)
    const newMesage=new Messages({
        name :req.body.name,
        email:req.body.email,
        subject:req.body.subject,
        message:req.body.subject
    })
    try{
        const newmsg=await newMesage.save()
        res.status(201).json(newmsg)
    }
    catch(err){
     res.status(400).json(err)
    }
   
    
})
module.exports=router 