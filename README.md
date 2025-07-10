# members-only

A secret chat application where users can join an exclusive club, earn admin privileges, and participate in authenticated conversations. Built with Node.js, Express, and PostgreSQL.

## Features

### User Authentication

- **Registration**: Create new accounts with validation
- **Login/Logout**: Secure session-based authentication using Passport.js
- **Profile Management**: View user status and permissions

### Chat

- **Member-only Chat**: Only verified members can post messages
- **Message Management**: Admins can delete any message
- **User Identification**: See who posted each message with timestamps

### Security

- **Input Validation**: Server-side validation with express-validator
- **Password Hashing**: Secure password storage with bcrypt
- **Session Management**: Persistent login sessions

## Live Demo

[View Live Application](https://your-render-url.onrender.com)

## 🛠 Technology Stack

- **Backend**: Node.js, Express.js
- **Authentication**: Passport.js (Local Strategy)
- **Database**: PostgreSQL
- **Templating**: EJS
- **Styling**: Custom CSS
- **Validation**: Express-validator
- **Security**: bcrypt, express-session
