# Frontend-Backend API Integration Guide

This guide documents all the API connections between the frontend and backend in the PeerSupportHub application.

## Configuration

### Base URL
- **Frontend Base URL**: `/api` (proxied through Vite)
- **Backend Base URL**: `http://localhost:5000/api`
- **Proxy Configuration**: Located in `frontend/vite.config.js`

### Authentication
All protected routes require a JWT token in the `Authorization` header:
```javascript
Authorization: Bearer <token>
```

The token is automatically added to all requests via axios interceptor in `services/api.js`.

---

## API Endpoints & Frontend Integration

### 1. Authentication (`authAPI`)

#### Register User
```javascript
authAPI.register(userData)
```
- **Backend**: `POST /api/users/register`
- **Payload**: `{ name, email, password, username, userType }`
- **Returns**: User object with JWT token
- **Usage**: [Signup.jsx](frontend/src/pages/Signup.jsx)

#### Login User
```javascript
authAPI.login(email, password)
```
- **Backend**: `POST /api/users/login`
- **Payload**: `{ email, password }`
- **Returns**: User object with JWT token
- **Usage**: [Login.jsx](frontend/src/pages/Login.jsx)

#### Logout User
```javascript
authAPI.logout()
```
- **Action**: Clears localStorage tokens
- **Usage**: [Dashboard.jsx](frontend/src/pages/Dashboard.jsx), [Header.jsx](frontend/src/pages/Header.jsx)

#### Get Current User
```javascript
authAPI.getCurrentUser()
```
- **Action**: Retrieves user data from localStorage
- **Returns**: User object or null

#### Check Authentication
```javascript
authAPI.isAuthenticated()
```
- **Action**: Checks if token exists
- **Returns**: Boolean

---

### 2. Habits Management (`habitsAPI`)

#### Get All User Habits
```javascript
habitsAPI.getHabits()
```
- **Backend**: `GET /api/habits` 🔒
- **Returns**: Array of UserHabit objects with populated template details
- **Usage**: [Dashboard.jsx](frontend/src/pages/Dashboard.jsx)

#### Create New Habit
```javascript
habitsAPI.createHabit(habitData)
```
- **Backend**: `POST /api/habits` 🔒
- **Payload**: `{ name, category, description, dailyWindowStart, dailyWindowEnd, userIntention }`
- **Returns**: Created UserHabit object
- **Note**: Automatically creates a HabitTemplate if it doesn't exist

#### Update Habit
```javascript
habitsAPI.updateHabit(habitId, habitData)
```
- **Backend**: `PUT /api/habits/:id` 🔒
- **Payload**: `{ name, description, category, userIntention, dailyWindowStart, dailyWindowEnd }`
- **Returns**: Updated UserHabit object

#### Delete Habit
```javascript
habitsAPI.deleteHabit(habitId)
```
- **Backend**: `DELETE /api/habits/:id` 🔒
- **Returns**: Success message

---

### 3. Groups Management (`groupsAPI`)

#### Get All Public Groups
```javascript
groupsAPI.getGroups()
```
- **Backend**: `GET /api/groups` 🔒
- **Returns**: Array of Group objects with populated members and moderators
- **Usage**: [Community.jsx](frontend/src/pages/Community.jsx), [Dashboard.jsx](frontend/src/pages/Dashboard.jsx)

#### Get Current User's Groups
```javascript
groupsAPI.getMyGroups()
```
- **Backend**: `GET /api/groups/my` 🔒
- **Returns**: Array of groups where user is a member
- **Usage**: [Dashboard.jsx](frontend/src/pages/Dashboard.jsx)

#### Get Single Group Details
```javascript
groupsAPI.getGroup(groupId)
```
- **Backend**: `GET /api/groups/:id` 🔒
- **Returns**: Single Group object with full details

#### Create New Group
```javascript
groupsAPI.createGroup(groupData)
```
- **Backend**: `POST /api/groups` 🔒
- **Payload**: `{ name, type, topicFocus }`
- **Returns**: Created Group object
- **Note**: Creator automatically becomes first member and moderator

#### Join Group
```javascript
groupsAPI.joinGroup(groupId)
```
- **Backend**: `POST /api/groups/:id/join` 🔒
- **Returns**: Success message and updated group

#### Leave Group
```javascript
groupsAPI.leaveGroup(groupId)
```
- **Backend**: `DELETE /api/groups/:id/leave` 🔒
- **Returns**: Success message

#### Update Group (Moderators Only)
```javascript
groupsAPI.updateGroup(groupId, groupData)
```
- **Backend**: `PUT /api/groups/:id` 🔒
- **Payload**: `{ name, topicFocus, type }`
- **Returns**: Updated Group object

#### Delete Group (Moderators Only)
```javascript
groupsAPI.deleteGroup(groupId)
```
- **Backend**: `DELETE /api/groups/:id` 🔒
- **Returns**: Success message

---

### 4. Profile Management (`profileAPI`)

#### Get Current User's Profile
```javascript
profileAPI.getProfile()
```
- **Backend**: `GET /api/profile/me` 🔒
- **Returns**: User object without password
- **Usage**: For profile settings page

#### Update User Profile
```javascript
profileAPI.updateProfile(profileData)
```
- **Backend**: `PUT /api/profile` 🔒
- **Payload**: `{ name, username, gender, onboardingIntent, settings }`
- **Returns**: Updated User object
- **Usage**: [Onboarding.jsx](frontend/src/pages/Onboarding.jsx)

#### Get User Stats
```javascript
profileAPI.getStats()
```
- **Backend**: `GET /api/profile/stats` 🔒
- **Returns**: Object with:
  - `totalActiveHabits`: Number
  - `longestStreak`: Number
  - `completionRate`: String (percentage)
  - `completionRateRaw`: Number
  - `totalDaysLogged`: Number
  - `currentProgressScore`: Number
- **Usage**: [Dashboard.jsx](frontend/src/pages/Dashboard.jsx) for displaying statistics

#### Get Another User's Public Profile
```javascript
profileAPI.getUserProfile(userId)
```
- **Backend**: `GET /api/profile/:userId` 🔒
- **Returns**: Public user info (name, username, onboardingIntent)

#### Get All Buddies
```javascript
profileAPI.getBuddies()
```
- **Backend**: `GET /api/profile/buddies` 🔒
- **Returns**: Array of buddy User objects
- **Usage**: [Dashboard.jsx](frontend/src/pages/Dashboard.jsx), buddy list feature

#### Get Specific Buddy's Profile
```javascript
profileAPI.getBuddyProfile(userId)
```
- **Backend**: `GET /api/profile/buddy/:userId` 🔒
- **Returns**: Buddy's public profile (validates buddy relationship)

#### Get Pending Buddy Requests
```javascript
profileAPI.getBuddyRequests()
```
- **Backend**: `GET /api/profile/buddy/requests` 🔒
- **Returns**: Array of pending BuddyRequest objects with populated sender info

#### Send Buddy Request
```javascript
profileAPI.sendBuddyRequest(userId)
```
- **Backend**: `POST /api/profile/buddy/request/:userId` 🔒
- **Returns**: Success message

#### Accept Buddy Request
```javascript
profileAPI.acceptBuddyRequest(requestId)
```
- **Backend**: `PUT /api/profile/buddy/accept/:requestId` 🔒
- **Returns**: Success message
- **Note**: Adds both users to each other's buddies array

#### Reject Buddy Request
```javascript
profileAPI.rejectBuddyRequest(requestId)
```
- **Backend**: `PUT /api/profile/buddy/reject/:requestId` 🔒
- **Returns**: Success message

---

### 5. Habit Logs (`habitLogsAPI`)

#### Create Habit Log
```javascript
habitLogsAPI.createLog(habitId, logData)
```
- **Backend**: `POST /api/logs/:habitId` 🔒
- **Payload**: `{ completionStatus, reflectionNote }`
- **Completion Status Options**: 'Completed', 'Failed', 'Paused'
- **Returns**: Created DailyLog object
- **Note**: Updates streak automatically, enforces time windows

#### Get All Logs for a Habit
```javascript
habitLogsAPI.getHabitLogs(habitId)
```
- **Backend**: `GET /api/logs/user/:habitId` 🔒
- **Returns**: Array of DailyLog objects sorted by date (newest first)
- **Usage**: Habit history/progress view

#### Update Log
```javascript
habitLogsAPI.updateLog(logId, logData)
```
- **Backend**: `PUT /api/logs/:logId` 🔒
- **Payload**: `{ reflectionNote }`
- **Returns**: Updated DailyLog object
- **Note**: Cannot change completion status, recalculates streak

#### Delete Log
```javascript
habitLogsAPI.deleteLog(logId)
```
- **Backend**: `DELETE /api/logs/:logId` 🔒
- **Returns**: Success message and new streak
- **Note**: Only allows deletion of today's log, recalculates streak

#### Get Current Streak
```javascript
habitLogsAPI.getStreak(habitId)
```
- **Backend**: `GET /api/logs/streak/:habitId` 🔒
- **Returns**: `{ streak: Number }`
- **Note**: Calculates and syncs streak with stored value

---

## Error Handling

### Response Interceptor
The API service includes an automatic error handler in `services/api.js`:

- **401 Unauthorized**: Automatically logs out user and redirects to login (only for token-related errors)
- **404 Not Found**: Returns error to component for handling
- **500 Server Error**: Returns error to component for handling

### Usage in Components
```javascript
try {
  const habits = await habitsAPI.getHabits();
  setHabits(habits);
} catch (error) {
  console.error('Error fetching habits:', error);
  toast.error(error.response?.data?.msg || 'Failed to fetch habits');
}
```

---

## Data Models

### User
```javascript
{
  _id: String,
  name: String,
  email: String,
  username: String,
  userType: String, // 'User', 'Mentor', 'Admin'
  gender: String,
  onboardingIntent: String,
  currentProgressScore: Number,
  buddies: [ObjectId],
  pods: [ObjectId],
  settings: Object,
  token: String // Only in auth responses
}
```

### UserHabit
```javascript
{
  _id: String,
  userId: ObjectId,
  templateId: {
    _id: String,
    name: String,
    description: String,
    category: String
  },
  userIntention: String,
  dailyWindowStart: String, // "HH:MM"
  dailyWindowEnd: String, // "HH:MM"
  streak: Number,
  compassionatePauseCount: Number,
  isActive: Boolean
}
```

### Group
```javascript
{
  _id: String,
  name: String,
  type: String, // 'FocusedSpace', 'VentZone', etc.
  topicFocus: String,
  members: [ObjectId],
  moderators: [ObjectId],
  createdAt: Date
}
```

### DailyLog
```javascript
{
  _id: String,
  userHabitId: ObjectId,
  logDate: Date,
  completionStatus: String, // 'Completed', 'Failed', 'Paused'
  loggedAt: Date,
  reflectionNote: String,
  progressScoreImpact: Number
}
```

### BuddyRequest
```javascript
{
  _id: String,
  sender: ObjectId,
  recipient: ObjectId,
  status: String, // 'Pending', 'Accepted', 'Rejected'
  createdAt: Date
}
```

---

## Import Examples

### In React Components
```javascript
import { 
  authAPI, 
  habitsAPI, 
  groupsAPI, 
  profileAPI, 
  habitLogsAPI,
  setLogoutCallback 
} from '../services/api';

// Set logout callback for automatic redirect on 401
useEffect(() => {
  setLogoutCallback(onNavigate);
}, [onNavigate]);

// Use the APIs
const handleLogin = async (email, password) => {
  try {
    const userData = await authAPI.login(email, password);
    console.log('Logged in:', userData);
    onNavigate('dashboard');
  } catch (error) {
    toast.error(error.response?.data?.msg || 'Login failed');
  }
};
```

---

## Testing Endpoints

You can test all endpoints using the provided test script:
```bash
cd backend/backend
node test-api-endpoints.js
```

See [TEST-API-README.md](../backend/backend/TEST-API-README.md) for details.

---

## Legend
- 🔒 = Protected route (requires authentication)
- All dates are in ISO 8601 format
- All times are in "HH:MM" 24-hour format

---

## Next Steps for Integration

### Dashboard Page
- ✅ Already using `habitsAPI.getHabits()` and `groupsAPI.getGroups()`
- 🔲 Add `profileAPI.getStats()` for user statistics
- 🔲 Add `habitLogsAPI.createLog()` for habit check-ins
- 🔲 Add `profileAPI.getBuddies()` for buddy list

### Community Page
- ✅ Static content ready
- 🔲 Replace static data with `groupsAPI.getGroups()`
- 🔲 Add `groupsAPI.joinGroup()` functionality
- 🔲 Add `profileAPI.sendBuddyRequest()` for connecting with users

### Onboarding Page
- ✅ Collecting user preferences
- 🔲 Add `profileAPI.updateProfile()` to save onboarding data
- 🔲 Add `habitsAPI.createHabit()` for selected starter habits

---

## Notes

1. **No Backend Changes**: All backend routes are already implemented and working. Only frontend integration was needed.

2. **Proxy Setup**: The Vite development server automatically forwards `/api/*` requests to `http://localhost:5000/api/*`.

3. **Production Setup**: In production, you'll need to configure your server to serve the frontend and backend on the same domain, or configure CORS properly.

4. **Token Storage**: JWT tokens are stored in localStorage and automatically included in all requests.

5. **Rate Limiting**: Some endpoints have rate limiting (login, register, create operations). Handle 429 errors appropriately.
