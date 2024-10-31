const User = require("../models/userSchema");
const Product=require("../models/productSchema")
const Category = require("../models/categorySchema");
const Brand = require("../models/brandSchema");
const env=require("dotenv").config()
const bcrypt=require("bcrypt")
const nodemailer=require("nodemailer")
const securePassword=async(password)=>{
  try{
    const passwordHash =await bcrypt.hash(password,10)
    return passwordHash
  }catch(error){
    console.log("password hash error",error);
    
  }
}
const loadHomepage = async (req, res) => {
  try {
    const user = req.session.user;
    console.log("Session user ID:", user);

    // Fetch products from the database
    const products = await Product.find({ isBlocked: false }); // Adjust the query as needed

    if (user) {
      const userData = await User.findOne({ _id: user });
      console.log("User  data fetched:", userData);
      // Pass both user data and products to the view
      return res.render("Home", { user: userData, products });
    } else {
      // Pass only products to the view if no user is logged in
      return res.render("Home", { products });
    }
  } catch (error) {
    console.log("Home page not found", error);
    res.status(500).send("server error");
  }
};
const pageNotFound = async (req, res) => {
  try {
    res.render("page-404");
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};
const loadSignup = async (req, res) => {
  try {
     const userData = req.session.userData || {};

     // Clear session data after retrieving it
     req.session.userData = null;
     const messages = req.flash("error"); 
     
    res.render("signup", { data: userData });
  } catch (error) {
    console.log("signup page not loading", error);
    res.status(500).send("server error");
  }
};
const loadOtpverify=async(req,res)=>{
  try{
     const userData = req.session.userData;
      if (!userData) {
        return res.redirect("/signup"); // Redirect to signup if data is missing
      }
    res.render("verify-otp",{userData})
  }catch(error){
    console.log("verify otp page not loading",error);
    res.status(500).send("server error");
    
  }
}

function generateOtp(){
  return Math.floor(100000 +Math.random()*900000).toString()

}
async function sendVerificationEmail(email,otp){
  try{
    const transporter=nodemailer.createTransport({
      service:"gmail",
      auth:{
        user:process.env.NODEMAILER_EMAIL,
        pass:process.env.NODEMAILER_PASSWORD
      }
    })

    const info =await transporter.sendMail({
      from:process.env.NODEMAILER_EMAIL,
      to:email,
      subject:"Verify your account",
      text:`your otp is${otp}`,
      html: `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #333333;">Verify Your Account</h2>
        <p style="font-size: 16px; color: #555555;">
          Thank you for registering with us! Please use the OTP below to verify your account:
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

    })
    return info.accepted.length>0
  }catch(error){
    console.log("Error sending email ",error);
    return false;
    

  }
}
const signup =async(req,res)=>{
  try{
    const {name,phone,email,password,cPassword}=req.body;
     console.log("Signup request body:", req.body);
    
    if(password !==cPassword){
         console.log("Passwords do not match");
      
      req.flash("error", "Passwords do not match");
       req.session.userData = { name, phone, email };
       return req.session.save((err) => {
         if (err) console.log("Session save error:", err);
        return res.redirect("/signup"); // Ensure return to prevent further execution
       });
     

    }

     const existingUser = await User.findOne({ email });
      console.log("Existing user:", existingUser);

     if (existingUser) {
       // If the user exists, check if they signed up with Google
       if (existingUser.googleId) {
         console.log("User registered via Google");
         req.flash(
           "error",
           "User  with this email already registered via Google."
         );
         return res.redirect("/signup")
       } else {
          console.log("User already exists");
         req.flash("error", "User  with this email already exists.");
          return res.redirect("/signup");
       }
     
       }
     
    const otp=generateOtp()
    console.log("otp",otp);
     
    
    const emailSent=await sendVerificationEmail(email,otp)
    console.log("email,otp",emailSent);
    
    if (emailSent) {
      const hashedPassword = await securePassword(password);
      // Check if email sent successfully
      req.session.userOtp = otp;
      req.session.userData = { name,phone,email, password:hashedPassword };
     return  res.redirect("/verify-otp");
    } else {
      console.error("Error sending email");
        req.flash("error", "Error sending verification email");
        return req.session.save((err) => {
          if (err) console.log("Session save error:", err);
         return  res.redirect("/signup");
        });
      
    }

  }catch(error){
    console.log("signup error",error);
      req.flash(
        "error",
        "An unexpected error occurred. Please try again later."
      );
    return req.session.save((err) => {
      if (err) console.log("Session save error:", err);
     return res.redirect("/pageNotFound");
    });
    

  }
}
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const sessionOtp = req.session.userOtp;

    if (otp === sessionOtp) {
      // OTP matches, save the user
     

      const user = req.session.userData;
  const newUser = new User({
    name: user.name,
    email: user.email,
    phone:user.phone,
    password: user.password
  });
  await newUser.save();
  req.session.user=newUser._id

  
 

      // Clear session data
      req.session.userOtp = null;
      req.session.userData = null;

      return res.json({ success: true });
    } else {
      return res.json({ success: false, message: "Invalid OTP" });
    }
  } catch (error) {
    console.log("OTP verification error", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
const resendOtp = async (req, res) => {
  try {
    const userData = req.session.userData; // Retrieve the user data from the session
    if (!userData) {
      return res
        .status(400)
        .json({ success: false, message: "User data not found." });
    }

    const newOtp = generateOtp(); // Generate a new OTP
    const emailSent = await sendVerificationEmail(userData.email, newOtp); // Send the new OTP via email

    if (emailSent) {
      req.session.userOtp = newOtp; // Store the new OTP in the session
      return res.json({
        success: true,
        message: "New OTP sent to your email.",
      });
    } else {
      return res
        .status(500)
        .json({ success: false, message: "Error sending email." });
    }
  } catch (error) {
    console.log("Resend OTP error", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
const loadLogin=async(req,res)=>{
  try{
    if(!req.session.user){
      return res.render("login", { data: null });
    }else{
      res.redirect("/")
    }
  }catch(error){
    res.redirect("/pageNotFound")
  }
}
const login=async(req,res)=>{
  try{
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    console.log("Existing user:", existingUser);
    if (!existingUser) {
      req.flash("error", "User not registered.");
      return res.redirect("/login");
    }
    if (existingUser.isBlocked) {
      req.flash("error", "User is blocked by admin.");
      return res.redirect("/login");
    }
    const passwordMatch = await bcrypt.compare(password, existingUser.password);
    if (!passwordMatch) {
      req.flash("error", "Password Incorrect.");
      return res.redirect("/login");
    }
       const sixMonthsAgo = new Date();
       sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
       existingUser.status =
         existingUser.lastLogin >= sixMonthsAgo ? "Active" : "Inactive";

       // Save the updated user details
       await existingUser.save();
    req.session.user = existingUser._id;
    console.log("User logged in:", existingUser._id); // Log the user ID
    res.redirect("/");
  }catch(error){
    console.log("login error",error);
      req.flash("error", "Login Failed.");
      return res.redirect("/login");
    

  }

}
const logout=async(req,res)=>{
  try{
    req.session.destroy((err)=>{
      if(err){
        console.log("session logout error",err);
        return res.redirect("/pageNotFound")
        
      }
      return res.redirect("/")

      })
    

  }catch(error){
console.log("logout error",error);
res.redirect("/pageNotFound")

  }

}

const loadShopPage = async (req, res) => {
  try {
    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }

    // Define pagination variables
    const page = parseInt(req.query.page) || 1;
    const limit = 12; // Number of products per page

    // Fetch filtered and paginated products
    const products = await Product.find({
      isBlocked: false,
      productName: { $regex: ".*" + search + ".*", $options: "i" }, // Case-insensitive search
    })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    // Fetch categories and brands
    const categories = await Category.find();
    const brands = await Brand.find({ isBlocked: false });

    // Gather unique sizes across all products
    const uniqueSizes = [
      ...new Set(products.flatMap((product) => product.size || [])),
    ];

    // Count total matching products for pagination
    const count = await Product.countDocuments({
      isBlocked: false,
      productName: { $regex: ".*" + search + ".*", $options: "i" },
    });
    const userId = req.session.user;
    let userData = null;
    if (userId) {
      userData = await User.findOne({ _id: userId });
    }

    // Render the shop page with pagination data
    return res.render("Shop", {
      user: userData,
      products,
      categories,
      brands,
      uniqueSizes,
      search,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.log("Shop page not found", error);
    res.status(500).send("server error");
  }
};

const loadProductDetails = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId).exec();

    // Check if the product exists
    if (!product) {
      return res.status(404).send("Product not found");
    }

    // Ensure product.color is an array; default to an empty array if not
    if (!Array.isArray(product.color)) {
      product.color = [];
    }

    // Fetch related products from the same brand, excluding the current product
    const relatedProducts = await Product.find({
      brand: product.brand,
      _id: { $ne: productId }, // Exclude the current product
    })
      .limit(4) // Limit to 4 related products
      .exec();

    // Retrieve the session user, if available
    const userId = req.session.user;
    if (userId) {
      const user = await User.findById(userId);
      console.log("User data fetched:", user);

      // Render the view with user data, product, and related products
      return res.render("ProductDetails", {
        user,
        product,
        relatedProducts,
      });
    } else {
      // Render the view without user data
      return res.render("ProductDetails", {
        product,
        relatedProducts,
      });
    }
  } catch (error) {
    console.error("Error loading product details:", error);
    res.status(500).send("Server error");
  }
};
module.exports = {
  loadHomepage,
  pageNotFound,
  loadSignup,
  signup,
  loadOtpverify,
  verifyOtp,
  resendOtp,
  loadLogin,
  login,
  logout,
  loadShopPage,
  loadProductDetails
};
