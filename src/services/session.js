import dotenv from 'dotenv';
dotenv.config(); // Ensure you load .env variables

const createSession = async (token, userId) => {
    try {
        // Validate input data
        if (!userId || !token) {
            return {
                status: "error",
                message: "userId and token are required.",
            };
        }

        // Verify the token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return {
                status: "error",
                message: "Invalid or expired token.",
            };
        }

        // Check if the token belongs to the correct user
        if (decoded.id !== userId) {
            return {
                status: "error",
                message: "Token does not match the user.",
            };
        }

        // Check if the session already exists
        const existingSession = await Session.findOne({
            where: { userId, token },
        });

        if (existingSession) {
            return {
                status: "error",
                message: "This token has already been used.",
            };
        }

        // Parse JWT_EXPIRATION from .env
        const jwtExpiration = process.env.JWT_EXPIRATION || "1h"; // Default to 1 hour if not set
        const timeLimit = calculateExpiration(jwtExpiration);

        // Create a new session in the database
        const newSession = await Session.create({
            userId,
            token,
            timeLimit,
            status: "active",
        });

        return {
            status: "success",
            message: "Session created successfully.",
            session: newSession,
        };
    } catch (error) {
        console.error("Error creating session:", error);
        return {
            status: "error",
            message: "An error occurred while creating the session.",
        };
    }
};

// Helper function to calculate expiration time
const calculateExpiration = (expiration) => {
    const timeLimit = new Date();
    const value = parseInt(expiration.slice(0, -1), 10); // Extract the numeric part
    const unit = expiration.slice(-1); // Extract the unit (h, m, d)

    switch (unit) {
        case 'h':
            timeLimit.setHours(timeLimit.getHours() + value);
            break;
        case 'm':
            timeLimit.setMinutes(timeLimit.getMinutes() + value);
            break;
        case 'd':
            timeLimit.setDate(timeLimit.getDate() + value);
            break;
        default:
            throw new Error("Unsupported JWT_EXPIRATION unit. Use 'h', 'm', or 'd'.");
    }

    return timeLimit;
};
