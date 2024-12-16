const express = require("express");
const router = express.Router();

// import controllers
const {register, login, logout, getLoggedInUser, resetpassword, newpassword, order,orderemail,readusers,readorders,orderupdate,orderstatus,adduseraccess,readuserorders,allUsers,createRazorpayOrder,handleRazorpayWebhook,newpasswordForm} = require("../controllers/user");


// import middlewares
const {userRegisterValidator, userById} = require('../middlewares/user');
const {verifyToken} = require('../middlewares/auth');


// api routes
router.post("/register",userRegisterValidator, register);
router.post("/login", login);
router.get("/logout", logout);

router.get('/user', verifyToken, userById, getLoggedInUser);

router.post("/resetpassword", resetpassword);

router.post("/newpassword", newpassword);

router.get("/newpassword/:token_rs", newpasswordForm);

router.post("/order", order);

router.post("/orderemail", orderemail);

router.get("/users", readusers);

router.get("/orders", readorders);

router.get("/userorders", readuserorders);

router.post("/orderupdate", orderupdate);

router.get("/orderstatus", orderstatus);

router.post("/adduseraccess", adduseraccess);

router.get('/alluser',verifyToken,userById, allUsers );

// Razorpay routes
router.post("/create-razorpay-order", createRazorpayOrder);
router.post("/handle-razorpay-webhook", handleRazorpayWebhook);

module.exports = router;