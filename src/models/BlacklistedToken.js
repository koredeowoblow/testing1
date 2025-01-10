import { DataTypes } from 'sequelize';
import sequelize from '../config/database'; // Adjust the path to your Sequelize instance

const BlacklistedToken = sequelize.define('BlacklistedToken', {
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,  // Ensures the token is unique in the table
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,  // Automatically set to the current timestamp
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,  // Automatically set to the current timestamp
  },
}, {
  tableName: 'blacklisted_tokens', // Optional, specify the custom table name if necessary
  timestamps: true, // Enable timestamps for createdAt and updatedAt
});

export default BlacklistedToken;
