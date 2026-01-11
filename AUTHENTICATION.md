# Authentication System - How It Works

## Overview

Life Trails uses a **client-side authentication system** that stores all user data in the browser's `localStorage`. There is no backend server - everything runs entirely in the browser.

## How Sign-In Works

### 1. **User Storage**
- All users are stored in `localStorage` under the key `'life-trails-users'`
- Each user object contains:
  ```javascript
  {
    id: 'user123',
    email: 'demo@lifetrails.com',
    password: 'demo123',  // Stored in plain text (for demo purposes)
    name: 'Sam',
    dateOfBirth: '02-09-1993',
    placeOfBirth: 'Durgapur'
  }
  ```

### 2. **Sign-In Process**
When a user signs in:

1. **Form Submission**: User enters email and password
2. **Validation**: System checks if `localStorage` has a users array
   - If not, creates a default demo user
3. **Authentication Check**: 
   - Searches the users array for matching email and password
   - If found, creates a session object:
     ```javascript
     {
       userId: 'user123',
       email: 'demo@lifetrails.com',
       name: 'Sam',
       timestamp: 1234567890  // Current time in milliseconds
     }
     ```
4. **Session Storage**: Saves session to `localStorage` under `'life-trails-auth'`
5. **Redirect**: Redirects to `dashboard.html`

### 3. **Session Management**
- **Session Duration**: 24 hours (86400000 milliseconds)
- **Session Check**: On every page load, checks if session exists and is still valid
- **Auto-Logout**: If session is older than 24 hours, automatically signs out

### 4. **Sign-Up Process**
When a new user signs up:

1. **Email Check**: Verifies email doesn't already exist
2. **User Creation**: Creates new user with:
   - Unique ID: `'user' + Date.now()`
   - Email, password, name, DOB, place of birth
3. **Auto Sign-In**: Automatically signs in the new user

### 5. **Sign-Out Process**
- Simply removes the `'life-trails-auth'` key from `localStorage`
- Redirects to landing page

## Data Storage Structure

### User Data
Each user's life events and family data is stored separately:
- Key: `'life-trails-data-' + userId`
- Contains: events, family members, profile info

### Images
- Uploaded images are stored as base64 strings in `localStorage`
- Key format: `'life-trails-image-' + userId + '-' + imageName`

## Security Considerations

⚠️ **Important Notes for Production:**

1. **Passwords are stored in plain text** - This is fine for a demo, but in production you should:
   - Hash passwords (bcrypt, argon2)
   - Use a backend server
   - Implement proper authentication (JWT, OAuth)

2. **No encryption** - All data is stored unencrypted in localStorage

3. **Client-side only** - No server validation means:
   - Users can modify localStorage directly
   - No protection against tampering
   - No secure password recovery

4. **For Production Use:**
   - Implement a backend API
   - Use HTTPS
   - Hash passwords server-side
   - Use secure session tokens (JWT)
   - Implement rate limiting
   - Add CSRF protection

## Code Location

The authentication logic is in:
- **File**: `js/auth.js`
- **Functions**:
  - `signIn(email, password)` - Authenticates user
  - `signUp(...)` - Creates new user
  - `signOut()` - Removes session
  - `getCurrentUser()` - Returns current user or null
  - `isAuthenticated()` - Checks if user is logged in
  - `requireAuth()` - Redirects to sign-in if not authenticated

## Demo Account

For testing purposes, a default account is created:
- **Email**: `demo@lifetrails.com`
- **Password**: `demo123`
- **User ID**: `user123`

This account is automatically created on first load if no users exist.
