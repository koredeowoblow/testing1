import Session from "../models/Session.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const createSession = async (data, res) => {
    try {
        const { userId, token } = data;

        // Validate input data
        if (!userId || !token) {
            return res.status(400).json({
                status: "error",
                message: "userId and token are required.",
            });
        }

        // Verify the token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(401).json({
                status: "error",
                message: "Invalid or expired token.",
            });
        }

        // Check if the token belongs to the correct user
        if (decoded.id !== userId) {
            return res.status(401).json({
                status: "error",
                message: "Token does not match the user.",
            });
        }

        // Check if the session already exists
        const existingSession = await Session.findOne({
            where: { userId, token },
        });

        if (existingSession) {
            return res.status(401).json({
                status: "error",
                message: "This token has already been used.",
            });
        }

        // Calculate time limit for the session from the token's expiration
        const expirationInMilliseconds = decoded.exp * 1000; // Expiration is in seconds, converting to milliseconds
        const timeLimit = new Date(expirationInMilliseconds);

        // Create a new session in the database
        const newSession = await Session.create({
            userId,
            token,
            timeLimit,
            status: "active",
        });

        return res.status(201).json({
            status: "success",
            message: "Session created successfully.",
            session: newSession,
        });
    } catch (error) {
        console.error("Error creating session:", error);
        return res.status(500).json({
            status: "error",
            message: "An error occurred while creating the session.",
        });
    }
};

export default createSession;
