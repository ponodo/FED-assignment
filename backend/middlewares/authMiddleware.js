const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      error: "No token provided. Please log in.",
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired token. Please log in again.",
    });
  }
}

// Use after verifyToken to restrict routes to specific roles
// Example:
// router.delete("/:id", verifyToken, requireRole("vendor"), controller.remove)
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "You do not have permission to perform this action.",
      });
    }

    return next();
  };
}

module.exports = {
  verifyToken,
  requireRole,
};