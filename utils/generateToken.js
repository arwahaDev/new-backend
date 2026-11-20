const jwt = require("jsonwebtoken");
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,  //security key
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",  //valid how much time 
    }
  );
};
module.exports = generateToken;