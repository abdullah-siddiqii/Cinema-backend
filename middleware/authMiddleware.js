const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || ""; // "Bearer <token>"
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization header missing or invalid" });
    }

    const token = authHeader.split(" ")[1]; // extract token
    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, iat, exp }

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = authMiddleware;
