const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept only images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Database file path
const dbFile = path.join(__dirname, 'database.json');

// Initialize database
function initializeDatabase() {
    if (!fs.existsSync(dbFile)) {
        const initialData = {
            requests: [],
            contacts: [
                { id: 1, name: 'Ahmed Mechanic', phone: '0612345678', email: 'ahmed@roadside.com', role: 'mechanic', createdAt: new Date().toISOString() },
                { id: 2, name: 'Fatima Towing', phone: '0623456789', email: 'fatima@roadside.com', role: 'towing', createdAt: new Date().toISOString() },
                { id: 3, name: 'Karim Emergency', phone: '0634567890', email: 'karim@roadside.com', role: 'emergency', createdAt: new Date().toISOString() }
            ],
            users: [
                { id: 1, username: 'admin1', email: 'admin1@roadside.com', role: 'admin', status: 'active', createdAt: new Date().toISOString() },
                { id: 2, username: 'superadmin', email: 'super@roadside.com', role: 'super_admin', status: 'active', createdAt: new Date().toISOString() },
                { id: 3, username: 'operator1', email: 'op1@roadside.com', role: 'operator', status: 'active', createdAt: new Date().toISOString() }
            ],
            admins: [
                { id: 1, name: 'John Admin', username: 'admin1', email: 'admin1@roadside.com', phone: '0612345678', level: 'admin', status: 'active', createdAt: new Date().toISOString() },
                { id: 2, name: 'Sarah Super', username: 'superadmin', email: 'super@roadside.com', phone: '0623456789', level: 'super_admin', status: 'active', createdAt: new Date().toISOString() }
            ],
            assignments: []
        };
        fs.writeFileSync(dbFile, JSON.stringify(initialData, null, 2));
        console.log('Database initialized with sample data.');
    }
}

// Database helper functions
function readDatabase() {
    try {
        const data = fs.readFileSync(dbFile, 'utf8');
        const db = JSON.parse(data);
        
        // Ensure all required arrays exist
        if (!db.admins) db.admins = [];
        if (!db.contacts) db.contacts = db.operators || []; // Handle legacy operators field
        if (!db.requests) db.requests = [];
        if (!db.users) db.users = [];
        if (!db.assignments) db.assignments = [];
        
        return db;
    } catch (error) {
        console.error('Error reading database:', error);
        return { requests: [], contacts: [], users: [], admins: [], assignments: [] };
    }
}

function writeDatabase(data) {
    try {
        fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing database:', error);
        return false;
    }
}

function getNextId(collection) {
    const db = readDatabase();
    if (db[collection].length === 0) return 1;
    return Math.max(...db[collection].map(item => item.id)) + 1;
}

// Initialize database on startup
initializeDatabase();

// Routes

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// API Routes

// Requests
app.get('/api/requests', (req, res) => {
    try {
        const db = readDatabase();
        const requests = db.requests.map(req => {
            const assignment = db.assignments.find(a => a.requestId === req.id);
            const contact = assignment ? db.contacts.find(c => c.id === assignment.contactId) : null;
            const user = assignment ? db.users.find(u => u.id === assignment.userId) : null;
            
            return {
                ...req,
                contactName: contact ? contact.name : null,
                contactRole: contact ? contact.role : null,
                userName: user ? user.username : null
            };
        });
        
        // Sort by creation date (newest first)
        requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/requests', upload.single('photo'), (req, res) => {
    try {
        const { userInfo } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
        
        const db = readDatabase();
        const newRequest = {
            id: getNextId('requests'),
            userInfo,
            imageUrl,
            status: 'Submitted',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        db.requests.push(newRequest);
        writeDatabase(db);
        
        res.json({ 
            ...newRequest,
            message: 'Request created successfully' 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/requests/:id/status', (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const db = readDatabase();
        const requestIndex = db.requests.findIndex(r => r.id === parseInt(id));
        
        if (requestIndex === -1) {
            res.status(404).json({ error: 'Request not found' });
            return;
        }
        
        db.requests[requestIndex].status = status;
        db.requests[requestIndex].updatedAt = new Date().toISOString();
        writeDatabase(db);
        
        res.json({ message: 'Request status updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/requests/:id', (req, res) => {
    try {
        const { id } = req.params;
        
        const db = readDatabase();
        
        // Remove assignments for this request
        db.assignments = db.assignments.filter(a => a.requestId !== parseInt(id));
        
        // Remove the request
        const requestIndex = db.requests.findIndex(r => r.id === parseInt(id));
        if (requestIndex === -1) {
            res.status(404).json({ error: 'Request not found' });
            return;
        }
        
        db.requests.splice(requestIndex, 1);
        writeDatabase(db);
        
        res.json({ message: 'Request deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Contacts
app.get('/api/contacts', (req, res) => {
    try {
        const db = readDatabase();
        const contacts = db.contacts.sort((a, b) => a.name.localeCompare(b.name));
        res.json(contacts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/contacts', (req, res) => {
    try {
        const { name, phone, email, role } = req.body;
        
        const db = readDatabase();
        const newContact = {
            id: getNextId('contacts'),
            name,
            phone,
            email,
            role,
            createdAt: new Date().toISOString()
        };
        
        db.contacts.push(newContact);
        writeDatabase(db);
        
        res.json({ 
            ...newContact,
            message: 'Contact created successfully' 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/contacts/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, role } = req.body;
        
        const db = readDatabase();
        const contactIndex = db.contacts.findIndex(c => c.id === parseInt(id));
        
        if (contactIndex === -1) {
            res.status(404).json({ error: 'Contact not found' });
            return;
        }
        
        db.contacts[contactIndex] = { ...db.contacts[contactIndex], name, phone, email, role };
        writeDatabase(db);
        
        res.json({ message: 'Contact updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/contacts/:id', (req, res) => {
    try {
        const { id } = req.params;
        
        const db = readDatabase();
        
        // Remove assignments that reference this contact
        db.assignments = db.assignments.filter(a => a.contactId !== parseInt(id));
        
        // Remove the contact
        const contactIndex = db.contacts.findIndex(c => c.id === parseInt(id));
        if (contactIndex === -1) {
            res.status(404).json({ error: 'Contact not found' });
            return;
        }
        
        db.contacts.splice(contactIndex, 1);
        writeDatabase(db);
        
        res.json({ message: 'Contact deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Users
app.get('/api/users', (req, res) => {
    try {
        const db = readDatabase();
        const users = db.users.sort((a, b) => a.username.localeCompare(b.username));
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users', (req, res) => {
    try {
        const { username, email, role, status } = req.body;
        
        const db = readDatabase();
        const newUser = {
            id: getNextId('users'),
            username,
            email,
            role,
            status,
            createdAt: new Date().toISOString()
        };
        
        db.users.push(newUser);
        writeDatabase(db);
        
        res.json({ 
            ...newUser,
            message: 'User created successfully' 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/users/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, role, status } = req.body;
        
        const db = readDatabase();
        const userIndex = db.users.findIndex(u => u.id === parseInt(id));
        
        if (userIndex === -1) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        
        db.users[userIndex] = { ...db.users[userIndex], username, email, role, status };
        writeDatabase(db);
        
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/users/:id', (req, res) => {
    try {
        const { id } = req.params;
        
        const db = readDatabase();
        
        // Remove assignments that reference this user
        db.assignments = db.assignments.filter(a => a.userId !== parseInt(id));
        
        // Remove the user
        const userIndex = db.users.findIndex(u => u.id === parseInt(id));
        if (userIndex === -1) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        
        db.users.splice(userIndex, 1);
        writeDatabase(db);
        
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admins
app.get('/api/admins', (req, res) => {
    try {
        const db = readDatabase();
        const admins = db.admins.sort((a, b) => a.name.localeCompare(b.name));
        res.json(admins);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admins', (req, res) => {
    try {
        const { name, username, email, phone, level, status } = req.body;
        
        const db = readDatabase();
        const newAdmin = {
            id: getNextId('admins'),
            name,
            username,
            email,
            phone,
            level,
            status,
            createdAt: new Date().toISOString()
        };
        
        db.admins.push(newAdmin);
        writeDatabase(db);
        
        res.json({ 
            ...newAdmin,
            message: 'Admin created successfully' 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admins/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, username, email, phone, level, status } = req.body;
        
        const db = readDatabase();
        const adminIndex = db.admins.findIndex(a => a.id === parseInt(id));
        
        if (adminIndex === -1) {
            res.status(404).json({ error: 'Admin not found' });
            return;
        }
        
        db.admins[adminIndex] = { ...db.admins[adminIndex], name, username, email, phone, level, status };
        writeDatabase(db);
        
        res.json({ message: 'Admin updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admins/:id', (req, res) => {
    try {
        const { id } = req.params;
        
        const db = readDatabase();
        
        // Remove the admin
        const adminIndex = db.admins.findIndex(a => a.id === parseInt(id));
        if (adminIndex === -1) {
            res.status(404).json({ error: 'Admin not found' });
            return;
        }
        
        db.admins.splice(adminIndex, 1);
        writeDatabase(db);
        
        res.json({ message: 'Admin deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Assignments
app.get('/api/assignments', (req, res) => {
    try {
        const db = readDatabase();
        const assignments = db.assignments.map(assignment => {
            const request = db.requests.find(r => r.id === assignment.requestId);
            const contact = db.contacts.find(c => c.id === assignment.contactId);
            const user = db.users.find(u => u.id === assignment.userId);
            
            return {
                ...assignment,
                userInfo: request ? request.userInfo : null,
                imageUrl: request ? request.imageUrl : null,
                requestStatus: request ? request.status : null,
                contactName: contact ? contact.name : null,
                contactRole: contact ? contact.role : null,
                userName: user ? user.username : null
            };
        });
        
        // Sort by creation date (newest first)
        assignments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/assignments', (req, res) => {
    try {
        const { requestId, contactId, userId, status } = req.body;
        
        const db = readDatabase();
        
        // Check if assignment already exists for this request
        const existingAssignmentIndex = db.assignments.findIndex(a => a.requestId === parseInt(requestId));
        
        if (existingAssignmentIndex !== -1) {
            // Update existing assignment
            db.assignments[existingAssignmentIndex] = {
                ...db.assignments[existingAssignmentIndex],
                contactId: parseInt(contactId),
                userId: parseInt(userId),
                status
            };
        } else {
            // Create new assignment
            const newAssignment = {
                id: getNextId('assignments'),
                requestId: parseInt(requestId),
                contactId: parseInt(contactId),
                userId: parseInt(userId),
                status,
                createdAt: new Date().toISOString()
            };
            db.assignments.push(newAssignment);
        }
        
        // Update request status to 'In Progress'
        const requestIndex = db.requests.findIndex(r => r.id === parseInt(requestId));
        if (requestIndex !== -1) {
            db.requests[requestIndex].status = 'In Progress';
            db.requests[requestIndex].updatedAt = new Date().toISOString();
        }
        
        writeDatabase(db);
        
        res.json({ message: 'Assignment created/updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Database file:', dbFile);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    process.exit(0);
}); 