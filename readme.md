# Quran Memorization Scheduler

A full-stack web application to create, manage, and track personalized Quran memorization and revision schedules. The app helps users balance new memorization with revision, optimizing retention based on the user's current memorization status for each surah (by page).

## Features

### 🎯 Core Features
- **Surah/Page Status Management**: Track memorization progress for all 114 surahs with page-level precision
- **Intelligent Schedule Generation**: Creates daily schedules with optimal balance of revision and new material
- **Progress Tracking**: Dashboard showing statistics and today's assignments
- **Arabic/English Support**: Toggle between Arabic and English surah names

### 📊 Scheduling Algorithm
- **60%** - Revision of perfectly memorized pages
- **15%** - Revision of medium-level pages  
- **10-20%** - New memorization material
- **Special** - Al-Kahf every Friday (Sunnah)
- **Smart Rotation** - Finishes all memorized content in 10-day cycles

### 🎨 User Interface
- Responsive design (mobile-friendly)
- Professional navigation with Arabic branding
- Interactive surah management with expandable pages
- Progress visualization with color-coded status indicators
- Intuitive schedule creation form

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** for data persistence
- **Mongoose** ODM
- RESTful API architecture

### Frontend  
- **React.js** with React Router
- **Axios** for API communication
- Responsive CSS with Flexbox/Grid
- Arabic font support

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Quran_scheduler
```

### 2. Backend Setup
```bash
# Install backend dependencies
npm install

# Create environment file
cp .env.example .env

# Start MongoDB service (varies by OS)
# macOS with Homebrew: brew services start mongodb-community
# Ubuntu: sudo systemctl start mongod
# Windows: net start MongoDB

# Start backend development server
npm run dev
```
The backend will run on `http://localhost:5000`

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Start frontend development server
npm start
```
The frontend will run on `http://localhost:3000`

### 4. Database Initialization
When you first access the application, it will automatically:
- Initialize the database with all 114 surahs
- Create the necessary collections
- Set up indexes for optimal performance

## Usage Guide

### 1. Set Your Memorization Status
1. Navigate to **Surahs** page
2. Click on any surah to expand its pages
3. Set the memorization status for each page:
   - **Perfect**: Completely memorized
   - **Medium**: Partially memorized, needs occasional review
   - **Needs Review**: Memorized but requires frequent practice
   - **Not Memorized**: Not yet learned

### 2. Create a Schedule
1. Go to **Create Schedule** page
2. Fill in the form:
   - **Schedule Name**: Give your schedule a meaningful name
   - **Start Date**: When to begin the schedule
   - **Duration**: How many days the schedule should run
   - **Daily New Pages**: How many new pages to memorize daily (0.5-5 pages)
3. Click **Create Schedule**

### 3. Track Your Progress
- **Dashboard**: View daily statistics and today's assignments
- **Schedules**: Manage your active and completed schedules
- Mark assignments as completed by checking the boxes

## API Endpoints

### Surah Management
- `GET /api/surahs` - Get all surahs
- `GET /api/surahs/:number` - Get specific surah
- `GET /api/surahs/status/all` - Get memorization status
- `PUT /api/surahs/status` - Update memorization status

### Schedule Management  
- `POST /api/schedules/generate` - Create new schedule
- `GET /api/schedules` - Get all schedules
- `GET /api/schedules/today` - Get today's assignments
- `PUT /api/schedules/assignment/complete` - Mark assignment complete

### Progress Tracking
- `GET /api/progress/stats` - Get progress statistics
- `GET /api/progress/recent` - Get recent activity

## Data Models

### Surah
- Complete metadata for all 114 surahs
- Accurate page numbers based on standard Medinan Mushaf
- Arabic and English names

### MemorizationStatus
- User's memorization level per surah/page
- Four status levels: perfect, medium, bad, not_memorized
- Timestamps for tracking changes

### Schedule
- Generated daily schedules with assignments
- Tracks completion status
- Implements complex scheduling algorithm

## Development

### Project Structure
```
Quran_scheduler/
├── backend/
│   ├── controllers/     # Business logic
│   ├── models/         # Database schemas
│   ├── routes/         # API endpoints
│   └── data/           # Initial data (surahs)
├── frontend/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   └── services/   # API service layer
│   └── public/         # Static assets
└── README.md
```

### Available Scripts

#### Backend
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server

#### Frontend
- `npm start` - Start development server
- `npm run build` - Create production build
- `npm test` - Run tests

### Environment Variables
Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/quran_scheduler
PORT=5000
NODE_ENV=development
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Quran page numbers based on standard Medinan Mushaf
- Arabic font support for proper text rendering
- Islamic principles integrated into the scheduling algorithm

---

**May Allah make this application beneficial for those seeking to memorize His Holy Book.**
