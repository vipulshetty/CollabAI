"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = require("dotenv");
const socket_io_1 = require("socket.io");
const http_1 = require("http");
// Load environment variables
(0, dotenv_1.config)();
// Type guard for environment variables
function assertEnvVar(value, name) {
    if (!value) {
        throw new Error(`Missing environment variable: ${name}`);
    }
    return value;
}
// Get and validate environment variables
const supabaseUrl = assertEnvVar(process.env.SUPABASE_URL, 'SUPABASE_URL');
const supabaseKey = assertEnvVar(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY');
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const port = process.env.PORT || 3001;
// Initialize Express app
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Initialize Supabase client
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
// Configure CORS
app.use((0, cors_1.default)({
    origin: frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true
}));
// Parse JSON bodies
app.use(express_1.default.json());
// Add Supabase to request
app.use((req, _res, next) => {
    req.supabase = supabase;
    next();
});
// Error handling middleware
app.use((err, _req, res, _next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
// Initialize Socket.IO
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: frontendUrl,
        methods: ['GET', 'POST'],
        credentials: true
    }
});
// Socket connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});
// Start server
httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Frontend URL: ${frontendUrl}`);
});
