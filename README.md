# Arthur View - Bitcoin Mining Asset Management Platform

A comprehensive web application for managing Bitcoin mining operations, built with React, TypeScript, and Firebase.

## Overview

Arthur View is a production-ready asset management platform designed specifically for Bitcoin mining operations. It provides a hierarchical view of mining infrastructure, ticket management for maintenance issues, and comprehensive cost tracking.

## Features

### 🏗️ Asset Management
- **Hierarchical Infrastructure**: Organize assets in a Site → Container → Rack → ASIC structure
- **Real-time Status Tracking**: Monitor ASIC status (online, offline, maintenance, error)
- **Asset Search**: Global search functionality across all ASICs by serial number, MAC address, IP, or location
- **Asset Details**: Comprehensive ASIC information including specifications, location, and performance metrics

### 🎫 Ticket Management
- **Issue Tracking**: Create and manage maintenance tickets for equipment issues
- **Priority System**: Low, medium, and high priority classification
- **Status Workflow**: Open → In Progress → Waiting Parts → Resolved → Closed
- **Assignment System**: Assign tickets to specific technicians
- **Comments System**: Collaborative commenting on tickets

### 💰 Cost Management
- **Cost Tracking**: Track maintenance costs by category (parts, labor, other)
- **Multi-currency Support**: USD and BRL currency support
- **Cost Estimates**: Operator estimates vs. admin confirmed costs
- **Visibility Controls**: Admin control over cost visibility to clients

### 👥 User Management & Security
- **Role-based Access**: Admin, Operator, and Client roles
- **Site-based Permissions**: Users can only access assigned mining sites
- **Secure Authentication**: Firebase Authentication integration
- **Audit Trail**: Complete audit log of all system changes

### 📊 Dashboard & Analytics
- **Real-time Metrics**: Live dashboard with key performance indicators
- **Asset Health**: Visual status overview of all mining equipment
- **Recent Activity**: Timeline of recent tickets and system events
- **Quick Actions**: Fast access to common operations

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React
- **Backend**: Firebase (Firestore + Authentication)
- **Routing**: React Router v7
- **State Management**: React Context API
- **Build Tool**: Vite
- **Deployment**: Bolt Hosting

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── asic/            # ASIC-specific components
│   ├── assets/          # Asset management components
│   ├── auth/            # Authentication components
│   ├── dashboard/       # Dashboard components
│   ├── layout/          # Layout and navigation
│   ├── tickets/         # Ticket management components
│   └── ui/              # Generic UI components
├── contexts/            # React Context providers
├── lib/                 # Utility libraries and services
├── pages/               # Main page components
├── types/               # TypeScript type definitions
└── styles/              # Global styles
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase project with Firestore and Authentication enabled

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd arthur-view
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

4. Start the development server:
```bash
npm run dev
```

## Firebase Setup

### 1. Firestore Security Rules
Deploy the security rules from `firestore.rules` to your Firebase project:
```bash
firebase deploy --only firestore:rules
```

### 2. Firestore Indexes
Deploy the composite indexes from `firestore.indexes.json`:
```bash
firebase deploy --only firestore:indexes
```

### 3. Sample Data
Use the `firebase-sample-data.js` script to populate initial data:
```bash
node firebase-sample-data.js
```

## User Roles & Permissions

### Admin
- Full system access across all sites
- User management and permission control
- Cost visibility and approval
- System configuration

### Operator
- Site-specific access (assigned sites only)
- Create and manage tickets
- Add cost estimates
- Update ASIC status and information

### Client
- View assigned ASICs and related tickets
- Limited cost visibility (admin controlled)
- Read-only access to their equipment

## Data Model

### Core Entities
- **Sites**: Mining locations (e.g., OHIO, TOCANTINS)
- **Containers**: Physical containers within sites (e.g., DC_11)
- **Racks**: Equipment racks within containers (e.g., Rack 01)
- **ASICs**: Individual mining units with detailed specifications
- **Tickets**: Maintenance and issue tracking
- **Comments**: Collaborative communication
- **Costs**: Financial tracking for maintenance
- **Users**: System users with role-based access

### Relationships
```
Site (1) → (N) Container (1) → (N) Rack (1) → (N) ASIC
ASIC (1) → (N) Ticket (1) → (N) Comment
Ticket (1) → (N) Cost
ASIC (1) → (N) Cost
```

## Key Features in Detail

### Asset Hierarchy Navigation
- Expandable tree view of infrastructure
- Real-time status indicators
- Quick edit functionality for all asset types
- Bulk operations support

### Advanced Search
- Global search across all ASICs
- Multiple search criteria (MAC, serial, IP, location)
- Real-time search results
- Direct navigation to asset details

### Ticket Workflow
1. **Creation**: Users create tickets for issues
2. **Assignment**: Tickets assigned to technicians
3. **Progress Tracking**: Status updates throughout resolution
4. **Cost Management**: Track associated costs
5. **Resolution**: Mark tickets as resolved/closed

### Security Features
- Site-based data isolation
- Role-based UI rendering
- Secure API access patterns
- Audit logging for all changes

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style
- TypeScript strict mode enabled
- ESLint configuration for React/TypeScript
- Tailwind CSS for styling
- Component-based architecture

## Deployment

The application is configured for deployment on Bolt Hosting with automatic builds from the main branch.

### Build Configuration
- Vite build system
- TypeScript compilation
- Tailwind CSS processing
- Asset optimization

## Contributing

1. Follow the existing code structure and patterns
2. Use TypeScript for all new code
3. Follow the component organization structure
4. Add proper error handling and loading states
5. Update documentation for new features

## Security Considerations

- All data access is controlled by Firestore security rules
- User authentication required for all operations
- Site-based data isolation enforced
- Sensitive operations require admin privileges
- Audit trail for all system changes

## Performance Optimizations

- Lazy loading of components
- Efficient Firestore queries with proper indexing
- Optimized bundle splitting
- Image optimization
- Caching strategies for frequently accessed data

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

This project is proprietary software for Bitcoin mining operations management.