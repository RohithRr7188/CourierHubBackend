const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    let accessToken = req.cookies.jwt;

    // if there is no token in cookies, request is unauthorized
    if (!accessToken) {
        return res.status(403).json({
            message: "You need to login in",
        });
    }

    let payload;
    try {
        // verify the token using jwt.verify. throws error if token has expired or has an ivalid signature
        payload = jwt.verify(accessToken, process.env.JWT_SECRET);
        req._id = payload._id;

        next();
    } catch(e) {
        // return req unauthorized error
        return res.status(403).json({
            message: "Unauthorized",
        });
    }
}