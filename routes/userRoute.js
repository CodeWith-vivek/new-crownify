const express=require("express")
const router=express.Router()
const userController =require("../controllers/userController");
const passport = require("passport");


router.get("/pageNotFound", userController.pageNotFound);

router.get("/",userController.loadHomepage)
router.get("/signup",userController.loadSignup)
router.post("/signup", userController.signup);
router.get("/verify-otp",userController.loadOtpverify)
router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);
router.get("/auth/google",passport.authenticate("google",{scope:["profile","email"]}))

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/signup",
    failureFlash:
      "Google account already exists. Please use a different account or log in.",
  }),
  async (req, res) => {
    try {
      // User is authenticated, so log in and redirect to the homepage
      req.session.user = req.user._id; // Save user ID in session
      return res.redirect("/"); // Redirect to homepage or logged-in dashboard
    } catch (error) {
      console.log("Error during Google login:", error);
      req.flash("error", "Something went wrong. Please try again.");
      return res.redirect("/login");
    }
  }
);
router.get("/login",userController.loadLogin)
router.post("/login",userController.login)
router.get("/logout",userController.logout)
router.get("/shop", userController.loadShopPage);

router.get("/product/:id", userController.loadProductDetails);

module.exports=router

