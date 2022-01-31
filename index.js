require('dotenv').config()
const express=require('express')
const app=express()
const path = require('path');
const messageRouter=require('./routes/messageRoute')
const mongoose=require("mongoose");
const bodyParser=require("body-parser");
mongoose.connect(process.env.DATABASE_URL)
const db=mongoose.connection
db.once('open',()=>console.log("connected "))
db.on('error1',(error)=>console.error(error))
//register view engine
app.set('view engine','ejs')
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended:true}));
//app.use(express.static(__dirname + '/public'));
app.get('/',(req,res)=>{
    res.render('home')
})
app.use('/sendMessage',messageRouter)

app.listen(3000,()=>{
    console.log("server is running at port 3000")
})