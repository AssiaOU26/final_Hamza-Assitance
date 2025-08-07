# Roadside Rescue Application

A complete roadside assistance application with a modern frontend and robust backend API.

## Features

- **User Interface**: Submit emergency roadside assistance requests with photos
- **Admin Dashboard**: Manage incoming requests and assign contacts
- **Super Admin**: Full CRUD operations for contacts, users, and requests
- **Real-time Data**: Persistent storage with SQLite database
- **File Upload**: Image upload support for request documentation
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **File Upload**: Multer
- **Styling**: Glass morphism effects, animations

## Installation

1. **Clone or download the project files**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to:
   ```
   http://localhost:3000
   ```

## API Endpoints

### Requests
- `GET /api/requests` - Get all requests with assignments
- `POST /api/requests` - Create a new request (with photo upload)
- `PUT /api/requests/:id/status` - Update request status
- `DELETE /api/requests/:id` - Delete a request

### Contacts
- `GET /api/contacts` - Get all contacts
- `POST /api/contacts` - Create a new contact
- `PUT /api/contacts/:id` - Update a contact
- `DELETE /api/contacts/:id` - Delete a contact

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user

### Assignments
- `GET /api/assignments` - Get all assignments with details
- `POST /api/assignments` - Create or update an assignment

## Database Schema

### Requests Table
- `id` (PRIMARY KEY)
- `userInfo` (TEXT) - User details, car info, location
- `imageUrl` (TEXT) - Path to uploaded photo
- `status` (TEXT) - Request status (Submitted, In Progress, Completed)
- `createdAt` (DATETIME)
- `updatedAt` (DATETIME)

### Contacts Table
- `id` (PRIMARY KEY)
- `name` (TEXT)
- `phone` (TEXT)
- `email` (TEXT)
- `role` (TEXT) - mechanic, towing, emergency, support
- `createdAt` (DATETIME)

### Users Table
- `id` (PRIMARY KEY)
- `username` (TEXT, UNIQUE)
- `email` (TEXT, UNIQUE)
- `role` (TEXT) - admin, super_admin, operator
- `status` (TEXT) - active, inactive, suspended
- `createdAt` (DATETIME)

### Assignments Table
- `id` (PRIMARY KEY)
- `requestId` (INTEGER, FOREIGN KEY)
- `contactId` (INTEGER, FOREIGN KEY)
- `userId` (INTEGER, FOREIGN KEY)
- `status` (TEXT) - assigned, in_progress, completed
- `createdAt` (DATETIME)

## Usage

### User View
1. Fill in your information (name, car model, phone, location)
2. Upload a photo of the problem
3. Submit the request
4. Wait for admin assignment

### Admin View
1. View incoming requests
2. Assign contacts and users to requests
3. Update request status
4. Manage contacts

### Super Admin View
1. Full CRUD operations for all entities
2. User management
3. Contact management
4. Request oversight
5. Assignment management

## File Structure

```
depannage/
├── server.js              # Main server file
├── test.html              # Frontend application
├── package.json           # Dependencies and scripts
├── README.md              # This file
├── uploads/               # Uploaded images (created automatically)
└── roadside_rescue.db     # SQLite database (created automatically)
```

## Development

### Running in Development Mode
```bash
npm run dev
```
This uses nodemon for automatic server restart on file changes.

### Running in Production
```bash
npm start
```

### Environment Variables
- `PORT` - Server port (default: 3000)

## Sample Data

The application comes with sample data:
- 3 sample contacts (mechanic, towing, emergency)
- 3 sample users (admin, super admin, operator)

## Security Features

- File upload validation (images only)
- File size limits (10MB)
- CORS enabled for cross-origin requests
- Input validation and sanitization
- SQL injection prevention with parameterized queries

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the PORT environment variable
2. **Database errors**: Delete `roadside_rescue.db` and restart the server
3. **Upload errors**: Ensure the `uploads` directory exists and is writable

### Logs
Check the console output for detailed error messages and database connection status.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License 