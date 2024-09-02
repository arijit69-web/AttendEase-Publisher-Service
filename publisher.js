const express = require('express');
const bodyParser = require('body-parser');
const amqp = require('amqplib/callback_api');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3001;

const amqpUrl = process.env.RABBITMQ_URL;
const queueName = 'attendease-queue';
console.log(amqpUrl)

app.use(bodyParser.json());
app.use(cors());

function publishData(channel, queueName, data) {
    const message = `{"userid": ${data.userid},"brand": "${data.brand}", "model": "${data.model}", "osName": "${data.osName}", "osVersion": "${data.osVersion}", "manufacturer": "${data.manufacturer}", "latitude": "${data.latitude}", "longitude": "${data.longitude}"}`;
    channel.sendToQueue(queueName, Buffer.from(message));
    console.log("Sent message:", message);
}

amqp.connect(amqpUrl, (err, connection) => {
    if (err) {
        throw err;
    }
    connection.createChannel((err, channel) => {
        if (err) {
            throw err;
        }
        channel.assertQueue(queueName, { durable: false });

        app.post('/senddata', (req, res) => {
            try {
                const data = req.body;
                publishData(channel, queueName, data);
                res.json({ status: 'Success', message: 'Data sent' });
            } catch (error) {
                console.error('Error publishing data:', error);
                res.status(500).json({ status: 'error', message: 'Failed to publish data' });
            }
        });

        app.listen(port, () => {
            console.log(`Server is listening at http://localhost:${port}`);
        });
    });
});