const getForgotPassPage=async(req,res)=>{
    try {
        res.render("forgot-password")

        
    } catch (error) {
        
    }
}

module.exports={
    getForgotPassPage,
}