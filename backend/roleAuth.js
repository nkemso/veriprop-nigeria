const rolePermissions = {
  SEEKER: ["USER_PORTFOLIO", "MARKET_ANALYTICS"],
  USER: ["USER_PORTFOLIO", "MARKET_ANALYTICS"],
  LANDLORD: ["USER_PORTFOLIO", "MARKET_ANALYTICS"],
  AGENT: ["AGENT_DASHBOARD", "USER_PORTFOLIO", "MARKET_ANALYTICS", "AGENT_ADVISOR"],
  INVESTOR: ["INVESTOR_DASHBOARD", "USER_PORTFOLIO", "MARKET_ANALYTICS"],
  LEGAL: ["LEGAL_DASHBOARD", "MARKET_ANALYTICS"],
  ADMIN: [
    "AGENT_DASHBOARD",
    "INVESTOR_DASHBOARD",
    "LEGAL_DASHBOARD",
    "USER_PORTFOLIO",
    "MARKET_ANALYTICS",
    "AGENT_ADVISOR",
    "ADMIN_FRAUD_HUB",
  ],
};

export function authorize(permission) {
  return (req, res, next) => {
    const role = String(req.auth?.role ?? req.headers["x-user-role"] ?? "USER").toUpperCase();
    const allowed = rolePermissions[role] ?? [];
    if (!allowed.includes(permission)) {
      res.status(403).json({
        message: "Forbidden for this role",
        role,
        permission,
      });
      return;
    }
    req.userRole = role;
    next();
  };
}
