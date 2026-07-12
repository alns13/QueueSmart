import express from 'express';

const app = express();
const PORT = 8000;

app.get('/', (req, res) => {
    res.send('QueueSmart Backend is running');
});

app.listen(PORT, () => {
    console.log(`Backend is running at http://localhost:${PORT}`);
});