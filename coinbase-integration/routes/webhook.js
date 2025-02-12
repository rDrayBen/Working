const express = require('express');
const { Webhook } = require('coinbase-commerce-node');
const dotenv = require('dotenv');
const crypto = require('crypto');
const { createTransaction, updateTransaction } = require('../helpers/transactions');

dotenv.config();

const router = express.Router();
const webhookSecret = process.env.COINBASE_WEBHOOK_SECRET;

const generateWebhookSignature = (body, secret) => {
    return crypto.createHmac('sha256', secret).update(body).digest('hex');
};

// Middleware для збереження сирого тіла
router.use((req, res, next) => {
    if (req.headers['content-type'] === 'application/json') {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });
        req.on('end', () => {
            req.rawBody = data; // Зберігаємо сире тіло
            try {
                req.body = JSON.parse(data); // Парсимо JSON і зберігаємо в req.body
            } catch (error) {
                console.error('Invalid JSON format:', error.message);
                return res.status(400).send('Invalid JSON format');
            }
            next();
        });
    } else {
        next();
    }
});

// Обробник POST-запитів
router.post('/', async (req, res) => {
    try {
        console.log('Headers:', req.headers);
        const signature = req.headers['x-cc-webhook-signature'];
        console.log('Webhook Signature (Received):', signature);

        if (!req.rawBody) {
            console.error('Raw body is undefined');
            return res.status(400).send('Raw body is missing');
        }

        const expectedSignature = generateWebhookSignature(req.rawBody, webhookSecret);
        console.log('Expected Signature:', expectedSignature);

        if (signature !== expectedSignature) {
            console.error('Invalid signature');
            return res.status(400).send('Invalid signature');
        }

        const event = Webhook.verifyEventBody(req.rawBody, signature, webhookSecret);
        console.dir(event, { depth: null });
        const charge = event.data;
        const user = charge.metadata.user;
        const transaction_id = charge.id;
        const transaction_date = charge.created_at;
        const update_date = charge.timeline.at(-1).time;
        const amount = charge.pricing.local.amount;
        const currency = charge.pricing.local.currency;
        const payment_method = charge.name;
        const fee = charge.web3_data.network_fee_paid_local;
        const status = event.type;
        
        if (event.type === 'charge:confirmed') {
            await updateTransaction(user, transaction_id, update_date, status);
            console.log(`Payment for user ${user} has status: ${status}`);
        } else if (event.type === 'charge:failed') {
            await updateTransaction(user, transaction_id, update_date, status);
            console.log(`Payment for user ${user} failed with status: ${status}`);
        } else if (event.type === 'charge:pending') {
            await updateTransaction(user, transaction_id, update_date, status);
            console.log(`Payment for user ${user} with status: ${status}`);
        } else if (event.type === 'charge:expired') {
            await updateTransaction(user, transaction_id, update_date, status);
            console.log(`Payment for user ${user} failed with status: ${status}`);
        } else if (event.type === 'charge:canceled') {
            await updateTransaction(user, transaction_id, update_date, status);
            console.log(`Payment for user ${user} failed with status: ${status}`);
        } else if (event.type === 'charge:created') {
            console.log(`Payment for user ${user} has status: ${status}`);
            await createTransaction(user, transaction_date, update_date, amount, currency, payment_method, status, fee);
        }

        res.status(200).send('Webhook processed successfully');
    } catch (error) {
        console.error('Error verifying webhook:', error.message);
        res.status(400).send('Error processing webhook');
    }
});

module.exports = router;
