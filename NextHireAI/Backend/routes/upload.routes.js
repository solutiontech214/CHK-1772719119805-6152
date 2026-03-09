const express=require("express")
const authMiddleware=require("../middleware/auth.middleware")
const {uploadCertificate,uploadMarksheet,uploadDocs}=require("../controller/upload.controller")
const multer = require("multer");
const uploadRouter=express.Router()

const storage = multer.memoryStorage();

const upload = multer({ storage });
uploadRouter.post("/uploadCertificate",upload.single("file"),authMiddleware,uploadCertificate);
uploadRouter.post("/uploadMarksheets",upload.single("file"),authMiddleware,uploadMarksheet);
uploadRouter.post("/uploadDocs",upload.single("file"),authMiddleware,uploadDocs);


module.exports=uploadRouter