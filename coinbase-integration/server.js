const express = require('express');
const webhookRouter = require('./routes/webhook'); // Імпортуємо ваш маршрутизатор для вебхуків
const chargeRouter = require('./routes/charge'); // Імпортуємо ваш маршрутизатор для charge

const app = express();

// Використовуємо middleware для сирого тіла перед будь-якими іншими
// app.use(express.json());

// Використовуємо маршрутизатор для обробки запитів на /webhook
app.use('/webhook', webhookRouter);

// Використовуємо маршрутизатор для обробки запитів на /charge
app.use('/charge', chargeRouter);

// Запускаємо сервер
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Node.js service running on port ${PORT}`);
});
