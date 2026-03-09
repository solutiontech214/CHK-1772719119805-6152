const userModel = require('../models/user.model');
const sendEmail = require("../service/email.service");


const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

const register = async (req, res) => {

    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    try {

        const existingUser = await userModel.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await userModel.create({
            email,
            password: hashedPassword,
            name
        });
await sendEmail(
email,
"Welcome to NextHireAI",
name,
 `
    <div style="font-family:Arial;max-width:600px;margin:auto;border:1px solid #000;padding:20px">
        <h2 style="color:black;">Welcome to NextHireAI</h2>
        <p>Hello <b>${name}</b>,</p>
        <p>Your account has been successfully created on our AI Interview Preparation Platform.</p>
        <p>You can now start practicing interviews and analyzing your resume.</p>
        <br>
        <p><b>NextHireAI Team</b></p>
    </div>
    `
);
        const token = jwt.sign(
            { id: newUser._id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.cookie("token", token, {
            httpOnly: true
        });

        return res.status(201).json({
            message: "User registered successfully",
            token
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};
const login = async (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    try {

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.cookie("token", token, {
            httpOnly: true
        });

        return res.status(200).json({
            message: "Login successful",
            token
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};
const getMe = async (req, res) => {

    try {

        const user = await userModel
            .findById(req.user.id)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            user
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};


const changePassword = async (req, res) => {

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    try {

        const user = await userModel.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const isPasswordValid = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Current password is incorrect"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;

        await user.save();

        // 📧 Send confirmation email
        const htmlTemplate=
        await sendEmail(
            user.email,
            "Password Changed - NextHireAI",
            user.name,
 `
<div style="font-family:Arial;max-width:600px;margin:auto;border:1px solid #000;padding:20px">

<h2 style="color:black;">NextHireAI</h2>

<p>Hello <b>${user.name}</b>,</p>

<p>Your password has been <b>successfully updated</b>.</p>

<p>If you made this change, no further action is required.</p>

<p>If you did <b>not</b> change your password, please reset your password immediately.</p>

<br>

<p><b>NextHireAI Security Team</b></p>

</div>
`
        );

        return res.status(200).json({
            message: "Password changed successfully"
        });

    } catch (error) {

        console.log(error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};
module.exports = { register, login ,getMe , changePassword};