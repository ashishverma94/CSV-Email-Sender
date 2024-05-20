const express = require("express");
const User = require("../model/user.js");
const sendMail = require("../utils/sendMail.js");
const router = express.Router();

// SEND EMAIL TO EVERY USER
const getEmailTemplate = (user, unsubscribeLink) => `
<!DOCTYPE html>
<html>
  <head>
    <style>
      .unsubscribe-button {
        background-color: #f44336; 
        border: none;
        font-weight:600;
        color: white; 
        padding: 10px 20px; 
        text-align: center; 
        text-decoration: none; 
        display: inline-block; 
        margin: 4px 2px; 
        cursor: pointer; 
        border-radius: 16px; 
      }
    </style>
  </head>
  <body>
    <p>Hey ${user.name}!</p>
    <p>Thank you for signing up with your email ${user.email}. We have received your city as ${user.city}.</p>
    <p>Team MathonGo.</p>
    <a href="${unsubscribeLink}" class="unsubscribe-button">Unsubscribe</a>
  </body>
</html>
`;

router.post("/send", async (request, response, next) => {
  try {
    const users = await User.find();
    const validPersons = users.map((person) => person.email);

    const subjectEmail = "Good morning!!!";
    for (let i = 0; i < users.length; i++) {
      const unsubscribeLink = `http://localhost:8000/api/v1/email/unsubscribe?email=${users[i].email}`;
      const options = {
        email: users[i].email,
        subject: subjectEmail,
        message: getEmailTemplate(users[i], unsubscribeLink),
      };
      if (users[i].isSubscribed) {
        await sendMail(options);
      }
    }

    response.json({
      success: true,
      message: "Email send successfully!",
      validPersons,
    });
  } catch (err) {
    response.status(500).json({ success: false, message: "Server Error" });
  }
});

router.delete("/unsubscribe/:email", async (req, res) => {
  const { email } = req.query;
  console.log(email);
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.isSubscribed = false;
    await user.save();

    res.json({ success: true, message: `Unsubscribed ${email} successfully` });
  } catch (error) {
    console.error("Error unsubscribing user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
