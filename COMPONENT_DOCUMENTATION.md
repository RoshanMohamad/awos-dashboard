# AWOS Dashboard - Complete Component and Page Documentation

## 🌦️ AWOS Dashboard Overview

The Automatic Weather Observation System (AWOS) Dashboard is a comprehensive web application designed for monitoring weather conditions at Colombo International Airport. Built with Next.js 15, it provides real-time weather data visualization, historical analysis, and system management capabilities.

## 🚀 Live Application

Your AWOS Dashboard is running at: **http://localhost:3000**

## 🔐 Authentication Status

✅ **Google OAuth Authentication Fully Implemented**

- Secure login with Google accounts
- Session management with NextAuth.js
- Protected routes and user profiles
- Automatic logout functionality

## 📱 Available Pages

### 1. Main Dashboard (`/`)

**Primary Interface - Weather Monitoring**

- **Components Used**: `Dashboard`, `LiveDashboard`, `ForecastHistory`, `Sidebar`
- **Features**:
  - Real-time weather data display
  - Interactive wind compass with 360° direction
  - Barometric pressure gauge with aviation scales
  - Temperature, humidity, and dew point monitoring
  - Power system status (CEB/Battery)
  - Live alerts and notifications
  - Runway switching (02/04 ends)
  - Toggle between Live and Forecast views

### 2. Login Page (`/login`)

**Authentication Interface**

- **Components Used**: `LoginPage`
- **Features**:
  - Google OAuth 2.0 integration
  - Professional aviation-themed UI
  - Loading states and error handling
  - Automatic redirect after authentication

### 3. Reports Page (`/reports`)

**Data Export and Analysis**

- **Features**:
  - Generate weather reports (Daily/Weekly/Monthly/Custom)
  - Multiple export formats (CSV, Excel, PDF, JSON)
  - Interactive date range selection
  - Historical report management
  - Export statistics and analytics

### 4. Settings Page (`/settings`)

**System Configuration**

- **Features**:
  - User profile management
  - Notification preferences (Email/Sound alerts)
  - Display settings (Auto-refresh, Dark mode)
  - ESP32 endpoint configuration
  - System health monitoring
  - Connection status indicators

### 5. System Monitor (`/system`)

**Real-time System Health**

- **Components Used**: `SystemStatus`
- **Features**:
  - ESP32 connection monitoring
  - Sensor health status
  - Database and API status
  - System uptime tracking
  - Real-time clock synchronization
  - Performance metrics

### 6. About Page (`/about`)

**System Information**

- **Features**:
  - AWOS system overview
  - Technical specifications
  - Location and coverage details
  - Organization information (AASL)
  - Security and privacy details

### 7. Admin Panel (`/admin`)

**System Administration**

- **Features**:
  - Complete system overview
  - Page and component inventory
  - System statistics
  - Quick administrative actions
  - Navigation to all system areas

## 🧩 Core Components

### Weather Display Components

#### `LiveDashboard`

**Location**: `components/live-dashboard.tsx`

- **Purpose**: Primary weather monitoring interface
- **Features**:
  - 360° wind compass with aviation markings
  - Barometric pressure gauge (980-1040 hPa)
  - Temperature, humidity, dew point displays
  - Power system monitoring
  - Real-time data updates
  - Alert notifications

#### `ForecastHistory`

**Location**: `components/forecast-history.tsx`

- **Purpose**: Historical data analysis and forecasting
- **Features**:
  - 30-day historical trend charts
  - Wind forecast visualization
  - Data export functionality
  - Historical alerts display
  - Multi-parameter trend analysis

#### `WindForecastChart`

**Location**: `components/wind-forecast-chart.tsx`

- **Purpose**: Wind forecasting visualization
- **Features**: Interactive wind prediction charts

### System Components

#### `SystemStatus`

**Location**: `components/system-status.tsx`

- **Purpose**: Real-time system health monitoring
- **Features**:
  - Connection status indicators
  - Sensor health monitoring
  - System metrics display
  - Real-time clock
  - Performance tracking

#### `Dashboard`

**Location**: `components/dashboard.tsx`

- **Purpose**: Main dashboard container with navigation
- **Features**:
  - User profile dropdown
  - Navigation integration
  - Session management
  - Logout functionality

#### `DashboardSidebar`

**Location**: `components/dashboard-sidebar.tsx`

- **Purpose**: Navigation and runway selection
- **Features**:
  - Collapsible runway sections
  - Page navigation
  - AASL branding
  - Mobile-responsive design

### Authentication Components

#### `LoginPage`

**Location**: `components/login-page.tsx`

- **Purpose**: User authentication interface
- **Features**:
  - Google OAuth integration
  - Loading states
  - Error handling
  - Aviation-themed design

#### `NextAuthProvider`

**Location**: `components/providers/next-auth-provider.tsx`

- **Purpose**: Session provider wrapper
- **Features**: NextAuth.js session management

## 🛠️ Technical Architecture

### Frontend Framework

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Professional UI component library

### Authentication

- **NextAuth.js** - Authentication framework
- **Google OAuth 2.0** - Secure authentication provider
- **JWT Tokens** - Session management
- **Middleware Protection** - Route security

### Data Visualization

- **Recharts** - Chart library for data visualization
- **Lucide React** - Modern icon library
- **Custom SVG Components** - Weather instrument displays

### State Management

- **React Hooks** - Component state management
- **NextAuth Session** - User authentication state
- **Local Storage** - Settings persistence

## 🔧 API Integration

### ESP32 Integration

**Location**: `lib/esp32ApiClient.ts`

- Real-time weather data fetching
- Historical data retrieval
- System health monitoring
- WebSocket connections for live updates

### Backend API

**Location**: `lib/backendApi.ts`

- Data persistence
- Report generation
- User management
- System configuration

## 📊 Data Flow

1. **ESP32 Weather Station** → Raw sensor data
2. **API Client** → Data processing and formatting
3. **React Components** → Data visualization
4. **User Interface** → Interactive displays
5. **Database** → Historical data storage

## 🎨 UI/UX Features

### Design System

- **Aviation Theme** - Professional airport environment styling
- **Responsive Design** - Mobile and desktop compatibility
- **Accessibility** - WCAG compliant components
- **Loading States** - Smooth user experience
- **Error Handling** - User-friendly error messages

### Color Scheme

- **Primary Blue** (#3b82f6) - Navigation and accents
- **Success Green** (#10b981) - Operational status
- **Warning Amber** (#f59e0b) - Alerts and cautions
- **Error Red** (#ef4444) - Critical alerts
- **Gray Scale** - Text and backgrounds

## 🔒 Security Features

- **OAuth 2.0 Authentication** - Secure Google login
- **Session Management** - Encrypted user sessions
- **Route Protection** - Middleware-based access control
- **CSRF Protection** - Built-in security measures
- **Environment Variables** - Secure configuration management

## 📱 Mobile Responsiveness

All components are fully responsive and work seamlessly on:

- **Desktop** (1920px+) - Full feature set
- **Tablet** (768px - 1919px) - Optimized layout
- **Mobile** (< 768px) - Touch-friendly interface

## 🚀 Performance Optimizations

- **Next.js App Router** - Optimized routing and loading
- **Component Code Splitting** - Lazy loading
- **Image Optimization** - Automatic image processing
- **Caching Strategies** - Efficient data retrieval
- **Bundle Analysis** - Optimized build size

## 🔄 Real-time Updates

- **WebSocket Integration** - Live data streaming
- **Auto-refresh** - Configurable update intervals
- **Push Notifications** - Critical alert delivery
- **Offline Support** - Graceful degradation

## 📈 Monitoring & Analytics

- **System Health Checks** - Continuous monitoring
- **Performance Metrics** - Response time tracking
- **Error Logging** - Comprehensive error tracking
- **Usage Analytics** - User interaction insights

## 🎯 Getting Started

1. **Authentication**: Visit http://localhost:3000 and sign in with Google
2. **Main Dashboard**: Monitor real-time weather conditions
3. **Runway Selection**: Switch between Runway 02 and 04 ends
4. **Data Views**: Toggle between Live Dashboard and Forecast & History
5. **Reports**: Generate and export weather data reports
6. **Settings**: Configure system preferences and notifications
7. **System Monitor**: Check system health and connectivity

## 🔍 Navigation Guide

### Main Navigation

- **Sidebar** - Primary navigation with runway selection
- **User Menu** - Profile, Settings, Reports, Logout
- **Breadcrumbs** - Clear navigation path
- **Back Buttons** - Easy page navigation

### Quick Access

- **Dashboard** - Weather monitoring
- **Reports** - Data export and analysis
- **Settings** - System configuration
- **System Monitor** - Health status
- **About** - System information
- **Admin** - Complete system overview

## ✅ Component Status

| Component       | Status      | Features                             | Responsive |
| --------------- | ----------- | ------------------------------------ | ---------- |
| LiveDashboard   | ✅ Complete | Wind compass, Pressure gauge, Alerts | ✅         |
| ForecastHistory | ✅ Complete | Historical trends, Export, Charts    | ✅         |
| SystemStatus    | ✅ Complete | Health monitoring, Metrics           | ✅         |
| LoginPage       | ✅ Complete | Google OAuth, Error handling         | ✅         |
| Dashboard       | ✅ Complete | Navigation, User menu                | ✅         |
| Sidebar         | ✅ Complete | Runway selection, Page nav           | ✅         |
| Settings Page   | ✅ Complete | Configuration, Preferences           | ✅         |
| Reports Page    | ✅ Complete | Export, Analysis                     | ✅         |
| About Page      | ✅ Complete | Information, Documentation           | ✅         |
| Admin Panel     | ✅ Complete | System overview                      | ✅         |

## 🎉 Ready to Use!

Your AWOS Dashboard is completely set up with:

- ✅ Google OAuth authentication
- ✅ Real-time weather monitoring
- ✅ Historical data analysis
- ✅ Report generation
- ✅ System health monitoring
- ✅ Mobile responsive design
- ✅ Professional aviation interface
- ✅ Comprehensive documentation

Visit **http://localhost:3000** to start using your complete weather monitoring system!
