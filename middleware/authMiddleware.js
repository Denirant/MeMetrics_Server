const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const {User} = require("../model/user");

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            //Get token from headers

            token = req.headers.authorization.split(" ")[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);
            req.user = await User.findById(decoded.id).select("-password");

            next();
        } catch (error) {
            console.log(error);

            res.status(401);
            throw new Error("Not auth!");
        }
    }

    if (!token) {
        req.status(401);
        throw new Error("Not auth, no token");
    }
});

module.exports = { protect };