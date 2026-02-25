const admin = require("../firebaseAdmin");
const User = require("../main/users/models/user");

const rbrAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Authorization token is required" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { phone_number } = decodedToken;

    const mobile = phone_number ? parseInt(phone_number.replace(/^\+91/, ""), 10) : null;

    if (!mobile) {
      return res.status(401).json({ success: false, message: "Invalid token: no phone number found" });
    }

    const user = await User.findOne({ Mobile: mobile });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found. Please register first." });
    }

    req.user = {
      _id: user._id,
      customerId: user.CustomerId,
      name: user.Name,
      mobile: user.Mobile,
    };

    next();
  } catch (error) {
    console.error("RBR Auth Error:", error.message);

    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({ success: false, message: "Token expired. Please re-authenticate." });
    }

    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = rbrAuth;
