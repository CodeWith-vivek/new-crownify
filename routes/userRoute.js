const express=require("express")
const router=express.Router()
const userController =require("../controllers/userController");
const passport = require("passport");
const profileController =require("../controllers/profileController")


router.get("/pageNotFound", userController.pageNotFound);

//user signup managing

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
     
      req.session.user = req.user._id; 
      return res.redirect("/"); 
    } catch (error) {
      console.log("Error during Google login:", error);
      req.flash("error", "Something went wrong. Please try again.");
      return res.redirect("/login");
    }
  }
);

//user login managing

router.get("/login",userController.loadLogin)
router.post("/login",userController.login)

//shop & home logout management

router.get("/logout",userController.logout)
router.get("/shop", userController.loadShopPage);

router.get("/product/:id", userController.loadProductDetails);

// user profile management

router.get("/forget-password")

module.exports=router

