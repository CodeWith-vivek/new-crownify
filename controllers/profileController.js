const User=require("../models/userSchema")
const nodemailer =require("nodemailer")
const bcrypt =require("bcrypt")
const env= require("dotenv").config();
const session =require("express-session")
function generateOtp(){
     return Math.floor(100000 + Math.random() * 900000).toString();
}

const getForgotPassPage=async(req,res)=>{
    try {
        res.render("forgot-password")

        
    } catch (error) {
        
    }
}

const sendVerificationEmail =async (email,otp)=>{
    try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.NODEMAILER_EMAIL,
            pass: process.env.NODEMAILER_PASSWORD,
          },
        });

        const mailOptions = {
          from: process.env.NODEMAILER_EMAIL,
          to: email,
          subject: "Your OTP for password reset",
          text: `your otp is${otp}`,
          html: `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #333333;">Your OTP for password reset</h2>
        <p style="font-size: 16px; color: #555555;">
         Please use the OTP below to reset your password:
        </p>
        <div style="margin: 20px 0; font-size: 24px; font-weight: bold; background-color: #007BFF; color: white; padding: 10px; border-radius: 5px;">
          ${otp}
        </div>
        <p style="font-size: 14px; color: #777777;">
          If you did not request this, please ignore this email.
        </p>
        <p style="font-size: 12px; color: #999999;">
          &copy; ${new Date().getFullYear()} CROWNIFY. All rights reserved.
        </p>
      </div>
    </div>
  `,
        };

        const info =await transporter.sendMail(mailOptions)
        console.log("Email sent:",info.messageId);
        return true;
        
    } catch (error) {
        console.log("error sending password resest email",error);
        return false
        
        
    }
}










const forgotEmailValid = async (req, res) => {
  try {
    const { email } = req.body;
    const findUser = await User.findOne({ email: email });

    if (findUser) {
      const otp = generateOtp();
      const emailSent = await sendVerificationEmail(email, otp);

      if (emailSent) {
        req.session.userOtp = otp; // Store the OTP in session
        req.session.email = email; // Store the email in session
        return res.render("forgetPass-otp", { userData: findUser });
      } else {
        res.json({
          success: false,
          message: "Failed to send OTP. Please try again.",
        });
      }
    } else {
      res.redirect("/forget-password");
    }
  } catch (error) {
    console.log("Page not loaded", error);
    res.redirect("/pageNotFound");
  }
};

const verifyOtpForgot=async(req,res)=>{

  try {
    const { otp } = req.body;
    const sessionOtp = req.session.userOtp; // Assuming OTP is stored in session

    if (otp === sessionOtp) {
      // OTP is valid
      return res.json({ success: true ,redirectUrl:"/reset-password"});
    } else {
      // OTP is invalid
      return res.json({ success: false, message: "Invalid OTP" });
    }
    
  } catch (error) {
    console.log("OTP verification error", error);
    return res.status(500).json({ success: false, message: "Server error" });
    
  }

  

}

const resendOtpForgot = async (req, res) => {
  try {
    const userEmail = req.session.email; // Get the user's email from the session

    if (!userEmail) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required ." });
    }

    const otp = generateOtp(); // Generate a new OTP
    const emailSent = await sendVerificationEmail(userEmail, otp);

    if (emailSent) {
      req.session.userOtp = otp; // Update the OTP in session
      return res.json({ success: true, message: "OTP resent successfully." });
    } else {
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to resend OTP. Please try again.",
        });
    }
  } catch (error) {
    console.error("Error resending OTP:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while resending the OTP.",
      });
  }
};

module.exports={
    getForgotPassPage,
    forgotEmailValid,
    verifyOtpForgot,
    resendOtpForgot,
    
}