const express=require('express')
const app=express()
const path = require('path');

//register view engine
app.set('view engine','ejs')
app.use(express.static(path.join(__dirname, 'public')));
app.get('/',(req,res)=>{
    res.render('home')
})

app.listen(3000,()=>{
    console.log("server is running at port 3000")
})