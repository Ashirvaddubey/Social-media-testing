const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const fetchuser = (req, res, next) => {
  // Get the token from header
  const token = req.header("authtoken");
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: "Please authenticate using a valid token" 
    });
  }

  try {
    // Verify the token
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data.user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      error: "Invalid token" 
    });
  }
};

module.exports = fetchuser;