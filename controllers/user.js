const User = require('../models/user');
const Order = require('../models/order');
const Useraccess = require('../models/useraccess');
const jwt = require("jsonwebtoken");
require("dotenv").config();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const mailgunTransport = require('nodemailer-mailgun-transport');
const Razorpay = require("razorpay");

// //Mailgun transporter configuration
// const mailgunOptions = {
//     auth: {
//         api_key: process.env.MAILGUN_API_KEY,
//         domain: process.env.MAILGUN_DOMAIN
//     }
// };

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL, // Your email
        pass: process.env.EMAIL_PASSWORD // Your email password or app-specific password
    }
});

// Razorpay configuration
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  
  exports.createRazorpayOrder = async (req, res) => {
      const { amount, currency } = req.body;
  
      const options = {
          amount: amount*100, // Amount in paise (smallest currency unit)
          receipt: "courierhub7188@gmail.com",
          currency,
      };
  
      try {
          const response = await razorpay.orders.create(options);
          res.json(response);
      } catch (error) {
          res.status(500).send(error);
      }
  };

// Endpoint to handle Razorpay webhook callbacks (for test mode, no signature verification)
exports.handleRazorpayWebhook = async (req, res) => {
    const body = req.body;

    // Log the webhook payload
    console.log('Received Razorpay webhook:', body);

    // Handle different types of events from Razorpay
    const { event, payload } = body;

    try {
        switch (event) {
            case 'payment.authorized':
            case 'payment.captured':
                // Update order status in your database based on payment success
                const orderId = payload.payment.entity.order_id;
                const paymentId = payload.payment.entity.id;

                // Example logic to update order status
                const updatedOrder = await Order.findOneAndUpdate(
                    { TrackingID: orderId },
                    { $set: { PaymentStatus: 'paid', OrderStatus: 'Order placed' } },
                    { new: true }
                );

                if (!updatedOrder) {
                    return res.status(404).send('Order not found');
                }

                // Respond with a success message
                res.json({ status: 'success', message: 'Payment received and order updated' });
                break;

            case 'payment.failed':
                // Handle failed payments
                res.json({ status: 'failed', message: 'Payment failed' });
                break;

            default:
                res.json({ status: 'unknown', message: 'Unhandled event from Razorpay' });
        }
    } catch (error) {
        console.error('Error handling Razorpay webhook:', error);
        res.status(500).send('Internal server error');
    }
};

exports.register = async (req, res) => {

    console.log("Registration request received");
    console.log("Request body:", req.body);

    const { userType, email } = req.body;

    console.log("Checking Useraccess for:", { userType, email });

    const useraccessExist = await Useraccess.findOne({
        userType: userType,
        email: email,
    });

    // Log the result of the query
    console.log("Useraccess exists:", useraccessExist);


    // Check if user already exists
    const usernameExists = await User.findOne({
        username: req.body.username, userType: req.body.userType
    });
    const emailExists = await User.findOne({
        email: req.body.email, userType: req.body.userType
    });
    const useraccessExists = await Useraccess.findOne({
        userType: req.body.userType, email: req.body.email,
    });
    
    if (!useraccessExists) {
        return res.status(403).json({
            error: "User doesn't have access to create required account",
        });
    }

    if (usernameExists) {
        return res.status(403).json({
            error: "Username is taken, choose a different username",
        });
    }
    if (emailExists) {
        return res.status(403).json({
            error: "Email is taken, use this email to login or use another email to signup",
        });
    }

    // If new user, let's create the user
    const user = new User(req.body);
    await user.save();

    transporter.sendMail({
        to: user.email,
        from: "courierHub@gmail.com",
        subject: "Signup Successful",
        html: "<h1>Welcome to courierHub</h1>"
    }, (err, info) => {
        if (err) {
            console.error('Error sending email:', err);
            return res.status(500).json({
                error: "Failed to send signup email"
            });
        } else {
            res.status(201).json({
                message: "You have successfully signed up. You can login to proceed",
            });
        }
    });
};

exports.login = async (req, res) => {
    // Find the user by email
    const { userType, email, password, otp } = req.body;

    if (otp) {
        await User.findOne({ userType: userType, email: email }).exec((err, user) => {
            if (err || !user) {
                return res.status(401).json({
                    error: "Invalid Credentials",
                });
            }

            if (!user.authenticate(password)) {
                return res.status(401).json({
                    error: "Invalid email or password",
                });
            }

            const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
                expiresIn: "24h",
            });

            res.cookie("jwt", token, { expire: new Date() + 9999, httpOnly: true });

            const { email, userType, username } = user;
            return res.status(200).json({
                message: "You have successfully logged in",
                email,
                username,
                userType,
            });
        });
    } else {
        const { userType, email } = req.body;

        var enroute_otp = Math.floor(Math.random() * 1000000);

        await User.findOne({ email: email, userType: userType })
            .then(user => {
                if (!user) {
                    return res.status(422).json({
                        error: "User doesn't exist with that email/user type"
                    });
                }
                user.otp = enroute_otp;
                user.expireotp = Date.now() + 1200000;
                user.save().then((result) => {
                    transporter.sendMail({
                        to: user.email,
                        from: "Delivery.courierHub@gmail.com",
                        subject: "OTP to log into courierHub",
                        html: `<h4>Your OTP for logging into courierHub is: ${enroute_otp}</h4><p>Use this OTP to complete the verification process.</p>`
                    }, (err, info) => {
                        if (err) {
                            console.error('Error sending email:', err);
                            return res.status(500).json({
                                error: "Failed to send OTP email"
                            });
                        } else {
                            res.json({ message: "Check email to find your OTP" });
                        }
                    });
                });
            });
    }
};

exports.logout = (req, res) => {
    res.clearCookie("jwt");
    return res.json({
        message: "You have successfully logged out"
    });
};

exports.getLoggedInUser = (req, res) => {
    const { userType, username, _id, email } = req.user;
    return res.status(200).json({
        message: "User is still logged in",
        userType,
        username,
        _id,
        email
    });
};

exports.resetpassword = (req, res) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
        }
        const token_rs = buffer.toString("hex");
        User.findOne({ userType: req.body.userType, email: req.body.email })
            .then(user => {
                if (!user) {
                    return res.status(422).json({
                        error: "User doesn't exist with that email/usertype"
                    });
                }
                user.resetToken = token_rs;
                user.expireToken = Date.now() + 3600000;
                user.save().then((result) => {
                    const baseUrl = process.env.DEPLOY_URL || process.env.DEFAULT_BASE_URL;
                    const resetUrl = `${baseUrl}/newpassword/${token_rs}`;

                    transporter.sendMail({
                        to: user.email,
                        from: "Delivery.courierHub7188@gmail.com",
                        subject: "Reset Password",
                        html: `
                        <p>You requested a password reset</p>
                        <h5>Click on this <a href="${resetUrl}">link</a> to reset your password</h5>
                        `
                    }, (err, info) => {
                        if (err) {
                            console.error('Error sending email:', err);
                            return res.status(500).json({
                                error: "Failed to send password reset email"
                            });
                        } else {
                            res.json({ message: "Check your email for the link to reset your password" });
                        }
                    });
                });
            });
    });
};



exports.newpasswordForm = (req, res) => {
    const token_rs = req.params.token_rs;
    console.log("FRONTEND_URL:", process.env.FRONTEND_URL);  // Debug line
    console.log("Token:", token_rs);  // Debug line
    if (token_rs) {
        res.redirect(`${process.env.FRONTEND_URL}/newpassword/${token_rs}`);
    } else {
        res.status(404).json({ error: "Invalid token" });
    }
};




exports.newpassword = async (req, res) => {
    const newpassword = req.body.password;
    const sentToken = req.body.token_rs;

    User.findOne({ resetToken: sentToken, expireToken: { $gt: Date.now() } })
        .then(user => {
            if (!user) {
                return res.status(422).json({ error: "Password reset session expired" });
            }
            user.hashedPassword = crypto.createHmac("sha256", user.salt).update(newpassword).digest("hex");
            user.resetToken = undefined;
            user.expireToken = undefined;
            user.save().then((saveduser) => {
                res.json({ message: "Password updated successfully" });
            });

            transporter.sendMail({
                to: user.email,
                from: "Delivery.courierHub7188@gmail.com",
                subject: "Password reset successful",
                html: "<h1>Your password has been successfully reset</h1>"
            }, (err, info) => {
                if (err) {
                    console.error('Error sending email:', err);
                }
            });
        });
};
exports.order = async (req, res) => {
    const order = new Order(req.body);
    console.log(order.PriorityStatus, order.TrackingID);
    await order.save();
    res.status(201).json({
        message: "You have successfully saved the order",
    });
};

exports.orderemail = async (req, res) => {
    try {
        const { email, Cost, TrackingID } = req.body;

        await transporter.sendMail({
            to: email,
            from: "Delivery.courierHub7188@gmail.com",
            subject: "courierHub Payment Invoice",
            html: `<h2>Thank you for the recent payment that you made for the amount ₹ ${Cost}.
                This is a confirmation that the amount has been received successfully.
                Your tracking ID is ${TrackingID}.</h2>`
        });

        res.status(200).json({
            message: "Email sent successfully"
        });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({
            error: "Failed to send email"
        });
    }
};


exports.readusers = async (req, res) => {
    const page = req.query.page || 1;
    const perPage = req.query.perPage || 5;
    const userType = req.query.userType;

    try {
        const count = await User.countDocuments({ userType: userType });

        const users = await User.find({ userType: userType })
            .sort({ userType: 1, email: 1 })
            .skip((page - 1) * parseInt(perPage))
            .limit(parseInt(perPage));

        res.status(200).json({
            count,
            users,
        });
    } catch (error) {
        res.status(400).json({
            error: `Error getting data: ${error.message}`,
        });
    }
};

exports.readorders = async (req, res) => {
    const page = req.query.page || 1;
    const perPage = req.query.perPage || 5;

    try {
        const count = await Order.countDocuments({});

        const users = await Order.find({})
            .sort({ TrackingID: 1 })
            .skip((page - 1) * parseInt(perPage))
            .limit(parseInt(perPage));

        res.status(200).json({
            count,
            users,
        });
    } catch (error) {
        res.status(400).json({
            error: `Error getting data: ${error.message}`,
        });
    }
};

    exports.readuserorders = async (req, res) => {
        const page = req.query.page || 1;
        const perPage = req.query.perPage || 5;
        const userType = req.query.userType;
        if(userType == 10){
            const Customer = req.query.email;
            try {
                const count = await Order.countDocuments({Customer: Customer});
        
                const users = await Order.find({Customer: Customer})
                    .sort({ TrackingID: 1})
                    .skip((page - 1) * parseInt(perPage))
                    .limit(parseInt(perPage));
                // success
                res.status(200).json({
                    count,
                    users,
                });
            } catch (error) {
                res.status(400).json({
                    error: `Error getting data: ${error.message}`,
                });
            }
        } else if(userType == 20){
            const Driver = req.query.email;
            try {
                const count = await Order.countDocuments({Driver: Driver});
        
                const users = await Order.find({Driver: Driver})
                    .sort({ TrackingID: 1})
                    .skip((page - 1) * parseInt(perPage))
                    .limit(parseInt(perPage));
                // success
                res.status(200).json({
                    count,
                    users,
                });
            } catch (error) {
                res.status(400).json({
                    error: `Error getting data: ${error.message}`,
                });
            }
        }
    
    };
    
    exports.orderupdate = async (req, res) => {
        const trackingID = req.body.TrackingID_u;
        const Driver = req.body.Driver_u;
        const OrderStatus = req.body.OrderStatus_u;
        const Location = req.body.Location_u;
        
        let order = await Order.findOne({TrackingID: trackingID}).exec();
        if(!order){
        return res.status(422).json({error: "TrackingID not found!"})}
        if(!Driver && !Location){
            order.OrderStatus = OrderStatus;
            await order.save();
            res.status(201).json({message: "Order status updated",});
        } else if(!OrderStatus && !Location){
            order.Driver = Driver;
            await order.save();
            res.status(201).json({message: "Driver details updated",});
        } else if(!OrderStatus && !Driver){
            order.Location = Location;
            await order.save();
            res.status(201).json({message: "Order location updated",});
        } else if (!Location){
            order.Driver = Driver;
            order.OrderStatus = OrderStatus;
            await order.save();
            res.status(201).json({message: "Driver and Order status updated",});
        } else if (!Driver){
            order.Location = Location;
            order.OrderStatus = OrderStatus;
            await order.save();
            res.status(201).json({message: "Order status and location updated",});
        } else if (!OrderStatus){
            order.Location = Location;
            order.Driver = Driver;
            await order.save();
            res.status(201).json({message: "Driver and location updated",});
        } else {
            order.Location = Location;
            order.OrderStatus = OrderStatus;
            order.Driver = Driver;
            await order.save();
            res.status(201).json({message: "Drive, Order status and location updated",});
        }
        };

    exports.orderstatus = async (req, res) => {
        const TrackingID = req.query.TrackingID;
        try {
            const order = await Order.findOne({TrackingID: TrackingID}).exec();
            const Carrier = order.Carrier;
            const OrderStatus = order.OrderStatus;
            const Address_f = order.Address_f;
            const Address_t = order.Address_t;
            const Location = order.Location;
            res.status(200).json({
                message: "Order details fetched",
                Carrier,
                OrderStatus,
                Address_f,
                Address_t,
                Location
            });
        } catch (error) {
            res.status(400).json({
                error: `Tracking ID not found`,
            });
        }
    };

    exports.adduseraccess = async (req, res) => {
        // check if user already exists
        const useraccessExists =  await Useraccess.findOne({
            userType: req.body.userType, email: req.body.email,
        });
    
        if (useraccessExists) {
            return res.status(403).json({
                error: "User has been already given access",
            });
        }
    
        // if new useraccess, let's create the useraccess
        const useraccess = new Useraccess(req.body);
        await useraccess.save();

        res.status(201).json({
            message: "User has been successfully granted access",
        });
    };

    exports.allUsers = async (req, res) => {
      
        const keyword = req.query.search
        
        ? {
            $or: [
              { username: { $regex: req.query.search, $options: "i" } },
              { email: { $regex: req.query.search, $options: "i" } },
            ],
          }
        : {};
        
      const users = await User.find(keyword).find({ _id: { $ne: req.user._id } } );
      
      
      res.send(users);
    }