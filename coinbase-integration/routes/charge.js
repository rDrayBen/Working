const express = require('express');
const { Client, resources } = require('coinbase-commerce-node');
const { Charge } = resources;

const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

Client.init(process.env.COINBASE_API_KEY);

router.use(express.json());

router.post('/create', async (req, res) => {
    const { name, description, amount, currency } = req.body;
    try {
        const chargeData = {
            name: name,
            description: description,
            pricing_type: 'fixed_price',
            local_price: {
                amount: amount,
                currency: currency
            }, metadata: {
                user: 'asaprocky',
            },
        };

        const charge = await Charge.create(chargeData);
        res.status(200).json({ success: true, hosted_url: charge.hosted_url });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
