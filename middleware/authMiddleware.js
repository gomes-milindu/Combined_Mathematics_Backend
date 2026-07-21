import jwt from 'jsonwebtoken';

/**
 * Soft-mode JWT authentication middleware (Compatibility Mode).
 * 
 * Behavior:
 * - If Authorization header is present and valid: sets req.user = decoded payload
 * - If Authorization header is present and INVALID: returns 401 (same as previous behavior)
 * - If Authorization header is ABSENT: sets req.user = null, continues (compatibility mode)
 * 
 * This allows the deployed frontend (which currently sends no tokens) to continue
 * working while supporting authenticated requests when tokens are provided.
 */
export function authenticate(req, res, next) {
  let token = req.header("Authorization");

  if (token) {
    token = token.replace("Bearer ", "");

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      req.log.debug({ userId: decoded.id, role: decoded.role }, "JWT token verified");
    } catch (err) {
      req.log.warn({ error: err.message }, "JWT verification failed");
      return res.status(401).json({ message: "Invalid token" });
    }
  } else {
    req.user = null;
    req.log.debug("No auth token provided, continuing in compatibility mode");
  }

  next();
}

/**
 * Hard-mode authentication enforcement.
 * 
 * Returns 401 if no valid token is present on the request.
 * 
 * ACTIVE: Applied to all protected routes via router-level middleware.
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    req.log.warn("Authorization denied: no authenticated user");
    return res.status(401).json({ message: "Authentication required" });
  }

  next();
}

/**
 * Admin role enforcement middleware.
 * 
 * Returns 403 if the authenticated user does not have the 'admin' role.
 * Must be used AFTER authenticate middleware.
 * 
 * ACTIVE: Applied to admin-only routes via router-level middleware.
 */
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    req.log.warn({ user: req.user }, "Authorization denied: admin role required");
    return res.status(403).json({ message: "Access denied. Admin only" });
  }

  next();
}

/**
 * Generic role-based enforcement middleware factory.
 * 
 * Usage: requireRole('admin', 'moderator')
 * Returns 403 if the user's role is not in the allowed list.
 * Must be used AFTER authenticate middleware.
 * 
 * Available for fine-grained role checks on routes that need specific roles.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      req.log.warn(
        { user: req.user, requiredRoles: roles },
        "Authorization denied: insufficient role"
      );
      return res.status(403).json({ message: "Access denied. Insufficient permissions" });
    }

    next();
  };
}
