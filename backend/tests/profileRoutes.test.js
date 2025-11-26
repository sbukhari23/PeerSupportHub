const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const BuddyRequest = require('../models/BuddyRequest');
const jwt = require('jsonwebtoken');

// Load env vars
require('dotenv').config();

/*
 * Testing Strategy for Profile Routes
 * 
 * Partitioning the Input Space:
 * 1. Authentication:
 *    - Valid Token
 *    - Invalid/Missing Token
 * 
 * 2. User Identity:
 *    - Self (Current User)
 *    - Other User (Existing)
 *    - Non-existent User
 * 
 * 3. Buddy Request State:
 *    - No Request
 *    - Pending Request (Sent by Self)
 *    - Pending Request (Received from Other)
 *    - Accepted Request
 *    - Rejected Request
 * 
 * 4. API Endpoints (Operations):
 *    - GET /me (Profile Retrieval)
 *    - PUT / (Profile Update)
 *    - GET /stats (Statistics)
 *    - GET /buddy/:userId (Public Profile)
 *    - POST /buddy/request/:userId (Send Request)
 *    - GET /buddy/requests (View Requests)
 *    - PUT /buddy/accept/:requestId (Accept)
 *    - PUT /buddy/reject/:requestId (Reject)
 */

describe('Profile Routes Integration Tests', () => {
  let userA, userB, tokenA, tokenB;

  // Helper to create a user and return token
  const createUserAndToken = async (name, email, username) => {
    const user = await User.create({
      name,
      email,
      username,
      password: 'password123',
    });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
    return { user, token };
  };

  beforeAll(async () => {
    // Connect to a test database or the main one (be careful with data!)
    // Ideally use process.env.MONGO_URI_TEST
    const dbUri = process.env.MONGO_URI_TEST || process.env.MONGO_URI;
    await mongoose.connect(dbUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear database before each test to ensure isolation
    await User.deleteMany({});
    await BuddyRequest.deleteMany({});

    // Setup User A (Faisal)
    const setupA = await createUserAndToken('Faisal', 'faisal@test.com', 'faisal');
    userA = setupA.user;
    tokenA = setupA.token;

    // Setup User B (Muneeb)
    const setupB = await createUserAndToken('Muneeb', 'muneeb@test.com', 'muneeb');
    userB = setupB.user;
    tokenB = setupB.token;
  });

  // --- 1. GET /api/profile/me ---
  describe('GET /api/profile/me', () => {
    it('should return current user profile when authenticated', async () => {
      const res = await request(app)
        .get('/api/profile/me')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('email', 'faisal@test.com');
      expect(res.body).not.toHaveProperty('password'); // Security check
    });

    it('should return 401 if no token provided', async () => {
      const res = await request(app).get('/api/profile/me');
      expect(res.statusCode).toBe(401);
    });
  });

  // --- 2. PUT /api/profile ---
  describe('PUT /api/profile', () => {
    it('should update user settings and return updated profile', async () => {
      const updates = {
        settings: { reminders: false, language: 'fr' },
        onboardingIntent: 'Testing',
      };

      const res = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(updates);

      expect(res.statusCode).toBe(200);
      expect(res.body.settings.language).toBe('fr');
      expect(res.body.onboardingIntent).toBe('Testing');
    });
  });

  // --- 3. GET /api/profile/stats ---
  describe('GET /api/profile/stats', () => {
    it('should return user statistics structure', async () => {
      const res = await request(app)
        .get('/api/profile/stats')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('activeHabits');
      expect(res.body).toHaveProperty('longestStreak');
      expect(res.body).toHaveProperty('completionRate');
      expect(res.body).toHaveProperty('currentProgressScore');
    });
  });

  // --- 4. GET /api/profile/buddy/:userId ---
  describe('GET /api/profile/buddy/:userId', () => {
    it('should return public profile of another user', async () => {
      const res = await request(app)
        .get(`/api/profile/buddy/${userB._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('username', 'muneeb');
      expect(res.body).not.toHaveProperty('email'); // Privacy check
      expect(res.body).not.toHaveProperty('settings'); // Privacy check
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/profile/buddy/${fakeId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(404);
    });
  });

  // --- 5. POST /api/profile/buddy/request/:userId ---
  describe('POST /api/profile/buddy/request/:userId', () => {
    it('should send a buddy request successfully', async () => {
      const res = await request(app)
        .post(`/api/profile/buddy/request/${userB._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.msg).toBe('Buddy request sent');

      // Verify in DB
      const requestDoc = await BuddyRequest.findOne({
        sender: userA._id,
        recipient: userB._id,
      });
      expect(requestDoc).toBeTruthy();
      expect(requestDoc.status).toBe('Pending');
    });

    it('should prevent sending request to self', async () => {
      const res = await request(app)
        .post(`/api/profile/buddy/request/${userA._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(400);
    });

    it('should prevent duplicate requests', async () => {
      // Send first request
      await request(app)
        .post(`/api/profile/buddy/request/${userB._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      // Send second request
      const res = await request(app)
        .post(`/api/profile/buddy/request/${userB._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.msg).toBe('Request already sent');
    });
  });

  // --- 6. GET /api/profile/buddy/requests ---
  describe('GET /api/profile/buddy/requests', () => {
    it('should list pending requests for the recipient', async () => {
      // User A sends request to User B
      await BuddyRequest.create({
        sender: userA._id,
        recipient: userB._id,
        status: 'Pending',
      });

      // User B checks requests
      const res = await request(app)
        .get('/api/profile/buddy/requests')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].sender._id).toBe(userA._id.toString());
    });
  });

  // --- 7. PUT /api/profile/buddy/accept/:requestId ---
  describe('PUT /api/profile/buddy/accept/:requestId', () => {
    it('should accept a pending request and update users', async () => {
      // Create a pending request from A to B
      const buddyReq = await BuddyRequest.create({
        sender: userA._id,
        recipient: userB._id,
        status: 'Pending',
      });

      // User B accepts
      const res = await request(app)
        .put(`/api/profile/buddy/accept/${buddyReq._id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.msg).toBe('Buddy request accepted');

      // Verify DB updates
      const updatedReq = await BuddyRequest.findById(buddyReq._id);
      expect(updatedReq.status).toBe('Accepted');

      const updatedUserA = await User.findById(userA._id);
      const updatedUserB = await User.findById(userB._id);
      expect(updatedUserA.buddyId.toString()).toBe(userB._id.toString());
      expect(updatedUserB.buddyId.toString()).toBe(userA._id.toString());
    });

    it('should return 401 if user tries to accept request not meant for them', async () => {
      // Request from A to B
      const buddyReq = await BuddyRequest.create({
        sender: userA._id,
        recipient: userB._id,
        status: 'Pending',
      });

      // User A tries to accept it (should fail)
      const res = await request(app)
        .put(`/api/profile/buddy/accept/${buddyReq._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.statusCode).toBe(401);
    });
  });

  // --- 8. PUT /api/profile/buddy/reject/:requestId ---
  describe('PUT /api/profile/buddy/reject/:requestId', () => {
    it('should reject a pending request', async () => {
      const buddyReq = await BuddyRequest.create({
        sender: userA._id,
        recipient: userB._id,
        status: 'Pending',
      });

      const res = await request(app)
        .put(`/api/profile/buddy/reject/${buddyReq._id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.msg).toBe('Buddy request rejected');

      const updatedReq = await BuddyRequest.findById(buddyReq._id);
      expect(updatedReq.status).toBe('Rejected');
    });
  });
});
