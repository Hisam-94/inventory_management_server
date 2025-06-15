const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");

router.route("/register").post(register);

router.route("/login").post(login);
// router.route("/").get(getCategories).post(createCategory);

module.exports = router;
