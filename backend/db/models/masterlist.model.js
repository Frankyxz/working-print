const sequelize = require("../config/sequelize.config");
const { DataTypes } = require("sequelize");

const MasterList = sequelize.define("masterlist", {
  col_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    primaryKey: true,
    autoIncrement: true,
  },
  col_name: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: false,
  },
});

module.exports = MasterList;
