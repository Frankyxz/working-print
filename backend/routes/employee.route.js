const router = require("express").Router();
const { where, Op } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const MasterList = require("../db/models/masterlist.model");
const PDFDocument = require("pdfkit");


router.route("/getUser").get(async (req, res) => {
  try {
    const { transacID } = req.query;
    console.log(transacID);
    const data = await MasterList.findOne({
      where: {
        col_id: transacID,
      },
    });

    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json("Error");
  }
});

//Create Student
router.route("/create").post(async (req, res) => {
  try {
    console.log(req.body.UserName);
    const newData = await MasterList.create({
      col_name: req.body.UserName,
    });

      res.status(200).json(newData);

  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
});

module.exports = router;
