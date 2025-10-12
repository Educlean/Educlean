# Cleaner Module Documentation

## Overview

The Cleaner module is a comprehensive system designed for cleaning staff to manage their daily tasks, schedules, and work tracking. It provides functionality for viewing schedules, managing cleaning requests, and tracking work shifts with location-based verification.

## Architecture

### Core Components

#### 1. Pages
- **Dashboard** (`src/pages/cleaner/DashboardCleaner.tsx`): Main dashboard for cleaners
- **Requests** (`src/pages/cleaner/requests.tsx`): Request management interface
- **Shift Tracking** (`src/pages/cleaner/shift-tracking.tsx`): Clock-in/clock-out functionality

#### 2. API Endpoints
- **Schedules API** (`src/pages/api/schedules/cleaner.ts`): Fetch cleaner schedules
- **Requests API** (`src/pages/api/requests/cleaner.ts`): Manage cleaning requests
- **Clock API** (`src/pages/api/clock/index.ts`): Handle time tracking

#### 3. Components
- **CleanerNav** (`src/components/Reusable/CleanerNav.tsx`): Navigation component

#### 4. Utilities
- **Timezone Utility** (`lib/timezone.ts`): Vancouver timezone handling functions

## Features

### 1. Schedule Management

The cleaner can view their weekly schedules with detailed information about:
- School assignments
- Time slots (start/end times)
- School locations and contact information

**API Endpoint**: `/api/schedules/cleaner`
- **Method**: GET
- **Parameters**: 
  - `employeeID` (required): Employee identifier
  - `date` (optional): Specific date filter (Vancouver timezone)
  - `startDate` & `endDate` (optional): Date range filter (Vancouver timezone)
- **Default**: Returns current week's schedule if no date parameters provided
- **Timezone**: All date filtering uses Vancouver timezone for accurate local time handling

### 2. Request Management

Cleaners can view and manage cleaning requests assigned to their schools:

#### Request Types
- **Status**: `todo`, `in_progress`, `done`
- **Priority**: `urgent`, `normal`
- **Information**: Title, description, room, school details

#### Functionality
- View requests filtered by employee's assigned schools
- Update request status (todo → in_progress → done)
- Real-time status updates
- Tabbed interface for different request states

**API Endpoint**: `/api/requests/cleaner`
- **GET**: Fetch requests
  - Parameters: `employeeID`, optional `schoolId`
  - **Timezone**: Uses Vancouver timezone to determine current day's requests
- **PUT**: Update request status
  - Body: `requestId`, `status`, `employeeID`
  - **Timestamps**: `startedAt` and `completedAt` use Vancouver timezone

### 3. Shift Tracking

Location-based time tracking system with GPS verification:

#### Features
- **Clock In/Out**: Time tracking with location verification
- **GPS Validation**: Ensures cleaners are at the correct location
- **Distance Calculation**: Uses Haversine formula for location accuracy
- **Shift Status**: Tracks `not_started`, `clocked_in`, `completed`

#### Location Verification
- Maximum allowed distance: 100 meters from school location
- Real-time location permission checking
- Automatic location updates during clock operations

**API Endpoint**: `/api/clock`
- **POST**: Clock in/out operations
  - Body: `employeeID`, `schoolId`, `latitude`, `longitude`, `action`
  - **Timezone**: All timestamps use Vancouver timezone
- **Validation**: Location must be within 100m of school coordinates
- **Date Handling**: Uses Vancouver timezone to determine current day for shift records

## Data Models

### Request Interface
```typescript
interface Request {
  _id: string;
  title: string;
  description: string;
  room: string;
  status: "todo" | "in_progress" | "done";
  priority: "urgent" | "normal";
  time: string;
  school: {
    name: string;
    address: string;
  };
  schoolId: string;
}
```

### Clock Record Interface
```typescript
interface ClockRecord {
  _id?: ObjectId;
  employeeID: string;
  schoolId: ObjectId;
  clockInTime?: Date;
  clockOutTime?: Date;
  clockInLocation?: {
    latitude: number;
    longitude: number;
  };
  clockOutLocation?: {
    latitude: number;
    longitude: number;
  };
  date: string; // YYYY-MM-DD format
  status: 'clocked_in' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}
```

## Database Collections

### 1. Schedules Collection
- Stores weekly schedules for cleaners
- Links employees to schools with time slots
- Used for determining cleaner assignments

### 2. Requests Collection
- Contains cleaning tasks and maintenance requests
- Linked to schools via `schoolId`
- Status tracking for task completion

### 3. Clock Collection
- Records time tracking data
- Stores location information for verification
- Maintains daily shift records

### 4. Schools Collection
- School information and coordinates
- Used for location verification
- Contains contact and address details

## Timezone Handling

### Vancouver Timezone Support

The system implements comprehensive Vancouver timezone handling to ensure accurate date and time operations for local users.

#### Key Features
- **Consistent Local Time**: All date calculations use Vancouver timezone (America/Vancouver)
- **Daylight Saving Time**: Automatic handling of DST transitions
- **Accurate "Today" Detection**: Correctly identifies current day in local timezone
- **Date Boundary Calculations**: Proper start/end of day and week calculations

#### Utility Functions (`lib/timezone.ts`)
- `getVancouverDateString()`: Get current date in Vancouver timezone (YYYY-MM-DD format)
- `getVancouverDateTime()`: Get current date/time in Vancouver timezone
- `convertToVancouverTime(date)`: Convert any date to Vancouver timezone
- `getVancouverDayBounds(date)`: Get start and end of day boundaries
- `getVancouverWeekBounds()`: Get start and end of current week
- `isToday(date)`: Check if a date is today in Vancouver timezone
- `formatVancouverDate(date)`: Format date for display in local timezone
- `formatVancouverTime(date)`: Format time for display in local timezone

#### Implementation Areas
1. **Schedule Filtering**: Date ranges use Vancouver timezone boundaries
2. **Request Management**: "Today's" requests determined by Vancouver time
3. **Shift Tracking**: Clock records use Vancouver date for daily grouping
4. **Dashboard Display**: Today's schedule identified using local timezone

#### Problem Solved
Previously, the system used UTC timezone which caused issues:
- Shifts would disappear at 10 PM (when UTC date changed)
- Requests would become invisible before midnight local time
- Schedule filtering was inaccurate during evening hours

The new timezone handling ensures all operations respect Vancouver local time, providing a consistent user experience regardless of the time of day.

## Security Features

### Location Verification
- GPS coordinates validation
- Distance calculation using Haversine formula
- 100-meter radius enforcement for clock operations

### Data Validation
- Employee ID verification
- School assignment validation
- Request ownership verification

## Error Handling

### Common Error Scenarios
1. **Location Permission Denied**: Graceful handling with user prompts
2. **GPS Accuracy Issues**: Distance validation with clear error messages
3. **Network Connectivity**: Retry mechanisms and offline indicators
4. **Invalid Requests**: Proper validation and user feedback

### API Error Responses
- Standardized error messages
- HTTP status codes
- Detailed error descriptions for debugging

## Usage Flow

### Daily Workflow
1. **Login**: Cleaner logs in with employee credentials
2. **Dashboard**: View today's schedule and assignments
3. **Navigate to School**: Travel to assigned location
4. **Clock In**: Use shift tracking to clock in at school location
5. **View Requests**: Check cleaning tasks for the school
6. **Complete Tasks**: Update request statuses as work progresses
7. **Clock Out**: End shift with location verification

### Request Management Flow
1. **View Requests**: Browse tasks by status (todo/in_progress/done)
2. **Start Task**: Update status from 'todo' to 'in_progress'
3. **Complete Task**: Update status to 'done' when finished
4. **Real-time Updates**: Changes reflect immediately in the interface

## Technical Implementation

### Frontend Technologies
- **React**: Component-based UI
- **TypeScript**: Type safety and better development experience
- **Next.js**: Server-side rendering and API routes

### Backend Technologies
- **MongoDB**: Document database for flexible data storage
- **Node.js**: Server-side JavaScript runtime
- **Geolocation API**: Browser-based location services

### Key Libraries
- **Lucide React**: Icon components
- **MongoDB Driver**: Database connectivity
- **Geolocation Service**: Custom location handling utility
- **Timezone Utilities**: Custom Vancouver timezone handling functions

## Future Enhancements

### Potential Improvements
1. **Offline Support**: Cache data for offline functionality
2. **Push Notifications**: Real-time task assignments
3. **Photo Documentation**: Image capture for completed tasks
4. **Route Optimization**: Efficient travel planning between schools
5. **Performance Analytics**: Time tracking and productivity metrics
6. **Mobile App**: Native mobile application for better user experience

### Scalability Considerations
- Database indexing for performance
- Caching strategies for frequently accessed data
- Load balancing for high-traffic scenarios
- API rate limiting and throttling

## Troubleshooting

### Common Issues
1. **Location Not Working**: Check browser permissions and GPS settings
2. **Requests Not Loading**: Verify employee ID and network connection
3. **Clock In/Out Fails**: Ensure location accuracy and proximity to school
4. **Schedule Not Showing**: Confirm employee has assigned schedules
5. **Shifts Disappearing Early**: Timezone handling now fixed - shifts remain visible until midnight Vancouver time
6. **Requests Not Visible**: All date filtering now uses Vancouver timezone for accurate local time display

### Debug Information
- Browser console logs for client-side issues
- API response inspection for server-side problems
- Network tab monitoring for connectivity issues