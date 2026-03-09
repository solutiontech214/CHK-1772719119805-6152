const mongoose = require("mongoose");
const certificationSchema = new mongoose.Schema({
    description:{
        type:String
    },
    url:String
    })
    const certificationModel=mongoose.model("certifications",certificationSchema)

    const marksheetSchema = new mongoose.Schema({
    description:{
        type:String
    },
    url:String
    })
    const marksheetModel=mongoose.model("marksheets",marksheetSchema)

    const impDocSchema = new mongoose.Schema({
    description:{
        type:String
    },
    url:String
    })
    const impDocModel=mongoose.model("ImpDocuments",impDocSchema)
    
    module.exports={certificationModel,marksheetModel, impDocModel};