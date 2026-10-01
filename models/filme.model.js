const { DataTypes } = require('sequelize');
const sequelize = require('../config/bd');

const Filme = sequelize.define(
  'Filme', 
  {
    nome: {
      type: DataTypes.STRING,
    },
    ano: {
      type: DataTypes.INTEGER,
    }
  },
  {
    tableName: 'Filmes',
    timestamps: true
  }
);

module.exports = Filme;