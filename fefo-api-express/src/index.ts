import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeFirebase } from './config/firebase.js';
import productRoutes from './routes/products.js';
import inventoryRoutes from './routes/inventory.js';
import returnsRoutes from './routes/returns.js';
import tasksRoutes from './routes/tasks.js';
import usersRoutes from './routes/users.js';
import providersRoutes from './routes/providers.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Firebase
try {
    initializeFirebase();
    // Start listeners
    import('./services/notificationService.js').then(({ startDiscrepancyListener }) => {
        startDiscrepancyListener();
    }).catch(err => console.error('Failed to start listeners:', err));
} catch (error) {
    console.error('Failed to initialize Firebase:', error);
}

// Routes
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/providers', providersRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
        error: err.message || 'Internal Server Error',
        status: 500
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 API running on http://localhost:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
});
