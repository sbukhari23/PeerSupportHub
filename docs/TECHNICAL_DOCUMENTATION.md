# PeerSupportHub - Technical Documentation

## Overview

PeerSupportHub is a comprehensive web application following MIT 6.102 Software Construction principles. It helps students and early professionals build consistent habits through structured peer support, mentor guidance, and digital wellness tools.

## Architecture

### Design Principles

1. **Mobile-First Design**: All interfaces start with mobile (320px) and scale up
2. **Progressive Enhancement**: Core functionality works without JavaScript
3. **Accessibility First**: WCAG 2.1 AA compliance throughout
4. **Type Safety**: Full TypeScript implementation with strict typing
5. **Testing Coverage**: Unit, integration, and end-to-end tests

### MIT 6.102 Compliance

#### 1. Static Checking (Reading 1)
- **TypeScript**: Strict type checking for all JavaScript code
- **ESLint**: Code quality and consistency rules
- **Prettier**: Automatic code formatting
- **HTML/CSS Validation**: W3C compliance checking

#### 2. Testing (Reading 2)
- **Unit Tests**: Jest for individual function testing
- **Integration Tests**: API endpoint and service testing
- **E2E Tests**: Cypress for user workflow testing
- **Test Coverage**: Minimum 80% code coverage required

#### 3. Code Review (Reading 3)
- **Pull Request Process**: All changes require review
- **Review Checklist**: Standardized review criteria
- **Automated Checks**: CI/CD pipeline with quality gates

#### 4. Specifications (Reading 4-5)
- **Function Contracts**: Preconditions, postconditions for all public methods
- **API Documentation**: OpenAPI/Swagger specifications
- **Component Interfaces**: Clear input/output specifications

#### 5. Abstract Data Types (Reading 6-7)
- **Service Classes**: AuthService, HabitService, NotificationService
- **Type Definitions**: Comprehensive TypeScript interfaces
- **Encapsulation**: Private methods and data protection

## Core Features Implementation

### 1. User Registration and Secure Login

**Location**: `src/scripts/auth.ts`, `src/pages/register.html`, `src/pages/login.html`

**Specifications**:
```typescript
/**
 * Authenticates a user with email and password
 * @param credentials - login credentials containing email and password
 * @requires credentials.email is a valid email format
 * @requires credentials.password.length >= 8
 * @ensures if successful, currentUser is set and authToken is stored
 * @ensures if failed, currentUser remains null
 */
async login(credentials: LoginCredentials): Promise<AuthResponse>
```

**Security Features**:
- Password strength validation
- Rate limiting on login attempts
- Session timeout management
- Secure token storage
- Two-factor authentication support

**Testing**:
```bash
npm test -- auth.test.ts
```

### 2. Profile Creation with Habit/Goals Setup

**Location**: `src/pages/profile.html`, `src/scripts/profile.ts`

**User Flow**:
1. Complete registration
2. Set user type (student/professional)
3. Define initial habits and goals
4. Configure privacy settings
5. Optional mentor matching preferences

**Validation**:
- Required field validation
- Goal specificity requirements
- Habit feasibility checks

### 3. Daily Habit Logging with Time Limits

**Location**: `src/scripts/habits.ts`, `src/pages/habits.html`

**Specifications**:
```typescript
/**
 * Logs completion of a habit
 * @param habitId - ID of the habit to log
 * @param duration - actual time spent (in minutes)
 * @param mood - user's mood rating (1-5)
 * @requires this.habits.has(habitId)
 * @requires duration > 0 && duration <= 1440
 * @requires no existing log for this habit on the same day
 * @ensures habit log is recorded with current timestamp
 * @ensures streak data is updated accordingly
 */
async logHabit(habitId: string, duration: number, mood: MoodRating): Promise<ApiResponse<HabitLog>>
```

**Features**:
- Time tracking with limits
- Mood correlation tracking
- Streak calculation
- Progress visualization
- Habit analytics

### 4. Peer Group Spaces for Interaction and Accountability

**Location**: `src/pages/peers.html`, `src/scripts/peer-matching.ts`

**Peer Matching Algorithm**:
```typescript
interface MatchCriteria {
  commonGoals: string[];
  userType: UserType;
  timezone: string;
  activityLevel: 'low' | 'medium' | 'high';
}

/**
 * Matches users based on compatibility score
 * @param userId - user to find matches for
 * @param criteria - matching criteria
 * @requires user exists and is active
 * @ensures returned matches have compatibility score > 0.7
 * @returns array of potential peer matches
 */
async findPeerMatches(userId: string, criteria: MatchCriteria): Promise<PeerMatch[]>
```

**Group Features**:
- Topic-based groups (study, fitness, productivity)
- Moderated discussions
- Anonymous support options
- Group challenges
- Progress sharing

### 5. Buddy/Partner Matching System

**Matching Factors**:
- Similar goals and habits
- Compatible time zones
- User type alignment
- Activity levels
- Personality compatibility (optional quiz)

**Accountability Features**:
- Daily check-ins
- Weekly goal reviews
- Mutual progress visibility
- Encouragement messaging
- Challenge competitions

### 6. Mentor Access (Q&A, Guidance Sessions)

**Location**: `src/pages/mentors.html`, `src/scripts/mentoring.ts`

**Mentor Verification Process**:
1. Application with credentials
2. Background verification
3. Skill assessment
4. Trial mentoring sessions
5. Community feedback review

**Session Types**:
- **Q&A Sessions**: Group Q&A on specific topics
- **1:1 Guidance**: Personal mentoring sessions
- **Workshops**: Skill-building group sessions
- **Office Hours**: Drop-in help sessions

### 7. Progress Tracking Dashboard (Streaks, Reviews)

**Location**: `src/pages/dashboard.html`, `src/scripts/analytics.ts`

**Metrics Tracked**:
- Habit completion rates
- Streak lengths and consistency
- Peer interaction frequency
- Goal achievement progress
- Time spent on habits
- Mood correlations

**Visualizations**:
- Weekly/monthly heat maps
- Streak calendars
- Progress charts
- Peer comparison (opt-in)
- Goal milestone tracking

### 8. Daily/Weekly Reminders and Notifications

**Location**: `src/scripts/notifications.ts`

**Notification Types**:
```typescript
type NotificationType = 
  | 'habit-reminder' 
  | 'peer-message' 
  | 'mentor-session' 
  | 'achievement' 
  | 'group-activity' 
  | 'system-update';
```

**Delivery Channels**:
- In-app notifications
- Email reminders
- Push notifications (PWA)
- SMS (premium feature)

**Smart Scheduling**:
- User timezone awareness
- Optimal reminder timing
- Frequency preferences
- Do-not-disturb settings

### 9. Screen-time Usage Limits and Digital Discipline Tools

**Location**: `src/pages/focus.html`, `src/scripts/digital-wellness.ts`

**Focus Tools**:
```typescript
interface FocusSession {
  plannedDuration: number;
  blockedApps: string[];
  allowedBreaks: number;
  productivity: ProductivityRating;
}

/**
 * Starts a focused work session
 * @param session - focus session configuration
 * @requires session.plannedDuration > 0
 * @ensures blocked apps are inaccessible during session
 * @ensures productivity tracking is active
 */
async startFocusSession(session: FocusSession): Promise<void>
```

**Features**:
- Website/app blocking
- Pomodoro timer
- Focus session analytics
- Screen time limits
- Digital detox challenges
- Mindful browsing prompts

### 10. Safe Space for Moderated Discussions

**Moderation System**:
- AI-powered content filtering
- Human moderator review
- Community reporting
- Escalation procedures
- Appeals process

**Safety Features**:
- Anonymous posting options
- Trigger warning system
- Mental health resources
- Crisis intervention protocols
- Professional counselor access

### 11. Content Creation and Sharing

**Content Types**:
- Success stories
- Habit tips and tricks
- Reflection posts
- Challenge updates
- Resource recommendations
- Motivational content

**Moderation Process**:
1. Automated content scanning
2. Community flagging system
3. Moderator review queue
4. Content approval/rejection
5. Appeals and revisions

## Technical Stack

### Frontend
- **HTML5**: Semantic markup with accessibility
- **CSS3**: Custom properties, Grid, Flexbox
- **TypeScript**: Strict type checking
- **Vanilla JS**: No framework dependencies for core functionality
- **PWA**: Service workers, offline capability

### Backend (Future Implementation)
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: Document database
- **JWT**: Authentication tokens
- **Socket.io**: Real-time communication

### Development Tools
- **Vite**: Build tool and development server
- **Jest**: Testing framework
- **Cypress**: End-to-end testing
- **ESLint**: Code linting
- **Prettier**: Code formatting

### Deployment
- **GitHub Pages**: Static site hosting
- **Vercel/Netlify**: JAMstack deployment
- **CI/CD**: GitHub Actions
- **CDN**: Global content delivery

## Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/habit-tracking

# Make changes with TDD approach
npm run test:watch

# Run type checking
npm run type-check

# Format and lint code
npm run format
npm run lint:fix

# Build and test
npm run build
npm run test:e2e
```

### 2. Code Review Process
1. Create pull request with description
2. Automated checks (tests, linting, type checking)
3. Peer code review using checklist
4. Address feedback and re-review
5. Merge after approval

### 3. Testing Strategy
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

## Performance Standards

### Core Web Vitals
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

### Accessibility
- **WCAG 2.1 AA**: Full compliance
- **Screen Reader**: Complete functionality
- **Keyboard Navigation**: All features accessible
- **Color Contrast**: Minimum 4.5:1 ratio

### Mobile Performance
- **Page Load**: < 3s on 3G connection
- **Interactive**: < 5s on slow devices
- **Bundle Size**: < 200KB initial load
- **Offline**: Core features work offline

## Security Considerations

### Data Protection
- **Encryption**: All sensitive data encrypted
- **HTTPS**: TLS 1.3 everywhere
- **GDPR**: Full compliance with data regulations
- **Privacy**: User data minimization

### Authentication
- **Secure Sessions**: HttpOnly, Secure cookies
- **Rate Limiting**: Brute force protection
- **2FA**: Optional two-factor authentication
- **Password**: Strong password requirements

## Deployment Guide

### Prerequisites
```bash
# Install dependencies
npm install

# Environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Development
```bash
# Start development server
npm run dev

# Run tests in watch mode
npm run test:watch
```

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

### Environment Configuration
```env
# .env file
VITE_API_BASE_URL=https://api.peersupporthub.com
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=true
VITE_SENTRY_DSN=your-sentry-dsn
```

## Contributing Guidelines

### Code Standards
- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier configuration
- **Linting**: ESLint rules enforced
- **Testing**: 80% minimum coverage

### Git Workflow
- **Feature Branches**: All development in feature branches
- **Commit Messages**: Conventional commits format
- **Pull Requests**: Required for all changes
- **Code Review**: Mandatory peer review

### Documentation
- **Code Comments**: JSDoc for all public methods
- **README**: Up-to-date setup instructions
- **API Docs**: OpenAPI specifications
- **Architecture**: Decision records (ADRs)

## Monitoring and Analytics

### Application Monitoring
- **Error Tracking**: Sentry integration
- **Performance**: Core Web Vitals monitoring
- **User Analytics**: Privacy-focused analytics
- **Uptime**: Service availability monitoring

### User Metrics
- **Habit Completion**: Success rates and trends
- **User Engagement**: Session duration and frequency
- **Feature Usage**: Most/least used features
- **Peer Interactions**: Community health metrics

---

**Team**: The NextStep
- Syed Muneeb ur Rehman Bukhari (Team Lead)
- Hassan Shahid
- Faisal Iqbal

**Course**: 344 - Web Engineering
**Institution**: [University Name]
**Semester**: Spring 2025