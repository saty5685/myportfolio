const mongoose =require('mongoose')
const { Schema } =mongoose
const { isEmail }=require('validator')
const messageSchema=new Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        validate:[isEmail,'invalid email']
    },
    subject:{
        type:String
    },
    message:{
        type:String,
        required:true        
    },
    date:{
        type :Date,
        default:Date.now
    }

})

module.exports=mongoose.model('Messages',messageSchema)