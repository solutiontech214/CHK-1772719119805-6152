const express = require('express');
const authRouter = express.Router();
const authMiddleware=require("../middleware/auth.middleware");
const authController = require('../controller/auth.controller');
authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.get('/get-me',authMiddleware,authController.getMe)
authRouter.put("/change-password", authMiddleware, authController.changePassword);

module.exports = authRouter;