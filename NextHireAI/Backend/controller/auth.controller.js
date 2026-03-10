const userModel = require('../models/user.model');
const sendEmail = require("../service/email.service");


const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

const register = async (req, res) => {

    const { email, password, name } = req.body;

    // Enhanced validation
    if (!email || !password || !name) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            message: "Please enter a valid email address"
        });
    }

    // Password validation
    if (password.length < 6) {
        return res.status(400).json({
            message: "Password must be at least 6 characters long"
        });
    }

    // Name validation
    if (name.trim().length < 2) {
        return res.status(400).json({
            message: "Name must be at least 2 characters long"
        });
    }

    try {

        const existingUser = await userModel.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists with this email"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12); // Increased rounds for better security

        const newUser = await userModel.create({
            email: email.toLowerCase(),
            password: hashedPassword,
            name: name.trim()
        });

        // Send welcome email (non-blocking)
        try {
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
        } catch (emailError) {
            console.error('Welcome email failed:', emailError);
            // Don't fail registration if email fails
        }

        const token = jwt.sign(
            { id: newUser._id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" } // Extended to 7 days
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            message: "Server error during registration"
        });
    }
};
const login = async (req, res) => {

    const { email, password } = req.body;

    // Enhanced validation
    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            message: "Please enter a valid email address"
        });
    }

    try {

        const user = await userModel.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" } // Extended to 7 days
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            message: "Server error during login"
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
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                bio: user.bio,
                targetRole: user.targetRole,
                phone: user.phone,
                stats: user.stats,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({
            message: "Server error"
        });
    }
};

const refreshToken = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const newToken = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message: "Token refreshed",
            token: newToken
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        return res.status(500).json({
            message: "Server error"
        });
    }
};

const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            message: "Current password and new password are required"
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            message: "New password must be at least 6 characters long"
        });
    }

    try {
        const user = await userModel.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isCurrentPasswordValid) {
            return res.status(401).json({
                message: "Current password is incorrect"
            });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedNewPassword;
        await user.save();

        return res.status(200).json({
            message: "Password changed successfully"
        });

    } catch (error) {
        console.error('Change password error:', error);
        return res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    register,
    login,
    getMe,
    refreshToken,
    changePassword
};