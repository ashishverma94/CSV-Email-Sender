const express = require("express");
const upload = require("../middleware/multer.js");
const User = require("../model/user.js");
const sendMail = require("../utils/sendMail.js");
const csv = require("csvtojson");
const router = express.Router();
const { createObjectCsvStringifier } = require("csv-writer");

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

//  UPLOAD CSV DATA TO MONGODB

router.post(
  "/upload-csv",
  upload.single("file"),
  async (request, response, next) => {
    try {
      let errorsData = [];
      let successCount = 0;
      let errorCount = 0;

      csv()
        .fromFile(request.file.path)
        .then(async (res) => {
          // LOOP THE DATA
          for (let i = 0; i < res.length; i++) {
            let { name, email, city } = res[i];
            if (!city || city === "") {
              city = "empty";
            }
            // CHECK MISSING FIELD
            if (!name || !email) {
              errorsData.push({
                name,
                email,
                city,
                error: "Missing required fields",
              });
              errorCount++;
              continue;
            }

            // CHECK EMAIL IS CORRECT OR NOT
            if (!isValidEmail(email)) {
              errorsData.push({
                name,
                email,
                city,
                error: "Invalid Email",
              });
              errorCount++;
              continue;
            }

            // CHECK DUPLICATE EMAIL
            const existingUser = await User.findOne({ email });
            if (existingUser) {
              errorsData.push({ name, email, city, error: "Duplicate email" });
              errorCount++;
              continue;
            }

            // ADD NEW INSTANCE
            try {
              const newUser = new User({
                name,
                email,
                city,
                isSubscribed:true,
              });
              await newUser.save();
              successCount++;
            } catch (err) {
              errorsData.push({ name, email, city, error: err.message });
              errorCount++;
            }
          }

          // fs.unlinkSync(req.file.path);
          const csvStringifier = createObjectCsvStringifier({
            header: [
              { id: "name", title: "Name" },
              { id: "email", title: "Email" },
              { id: "city", title: "City" },
              { id: "error", title: "Error" },
            ],
          });

          // Create the CSV content
          const header = csvStringifier.getHeaderString();
          const records = csvStringifier.stringifyRecords(errorsData);

          const csvContent = header + records;
          const csvBase64 = Buffer.from(csvContent).toString("base64");

          response.setHeader("Content-Type", "text/csv");
          response.setHeader(
            "Content-Disposition",
            "attachment; filename=errors.csv"
          );
          response.json({
            successCount,
            errorCount,
            errorsData,
            csvFile: csvBase64,
          });
        });
    } catch (error) {
      response.send({
        status: 400,
        success: false,
        message: "Error in uploading data",
      });
    }
  }
);


module.exports = router;
