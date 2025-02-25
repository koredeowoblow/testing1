import express from 'express';
import { transferToUserBank} from '../controllers/transferController.js';
import { protectUser } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /transfers/user:
 *   post:
 *     summary: Transfer to user's bank account
 *     tags: [Transfers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bankCode:
 *                 type: string
 *                 description: Bank code
 *                 example: "044"
 *               acct_number:
 *                 type: string
 *                 description: Account number
 *                 example: "1234567890"
 *               amount:
 *                 type: number
 *                 description: Amount to transfer
 *                 example: 1000
 *               recipientName:
 *                 type: string
 *                 description: Recipient name
 *                 example: "John Doe"
 *               useVtu:
 *                 type: boolean
 *                 description: Use VTU Africa for transfer
 *                 example: false
 *     responses:
 *       200:
 *         description: Transfer handled successfully
 *       400:
 *         description: Invalid input parameters
 *       500:
 *         description: Internal server error
 */
router.post('/user', protectUser, transferToUserBank);



export default router;