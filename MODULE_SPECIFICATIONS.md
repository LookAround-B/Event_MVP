# Event MVP - Module Specifications & Product Documentation

**Last Updated:** March 31, 2026  
**Version:** 1.0  
**Project:** Event Management System - MVP

---

## Table of Contents

1. [Authentication & User Management](#1-authentication--user-management)
2. [Clubs Management](#2-clubs-management)
3. [Riders Management](#3-riders-management)
4. [Horses Management](#4-horses-management)
5. [Events Management](#5-events-management)
6. [Event Registrations](#6-event-registrations)
7. [Stables Management](#7-stables-management)
8. [Financial & Transactions](#8-financial--transactions)
9. [Admin & Approvals](#9-admin--approvals)
10. [Dashboard & Analytics](#10-dashboard--analytics)
11. [Audit & Logging](#11-audit--logging)
12. [Notifications](#12-notifications)
13. [Reports](#13-reports)
14. [Settings & Configuration](#14-settings--configuration)
15. [File Management](#15-file-management)
16. [Shared Components](#16-shared-components)
17. [Core Application Pages](#17-core-application-pages)
18. [Utility APIs](#18-utility-apis)

---

## 1. AUTHENTICATION & USER MANAGEMENT

### Overview
Secure user authentication and role-based access control system with email/password and Google OAuth2 integration.

### Purpose
- Authenticate users via credentials or Google
- Manage user profiles and approval workflows
- Implement role-based access control (RBAC)
- Manage granular permissions for users

### Frontend Pages

#### `auth/login.tsx` - User Login
- **Purpose:** Authenticate users with email and password
- **Features:**
  - Email/password login form
  - Google OAuth integration
  - Remember me functionality
  - Error handling and validation
  - Redirect to dashboard on success
- **User Type:** Public (unauthenticated users)
- **Destination Route:** `/auth/login`

#### `auth/signup.tsx` - User Registration
- **Purpose:** Allow new users to create accounts
- **Features:**
  - Registration form (firstName, lastName, email, password)
  - Email validation
  - Password strength requirements
  - Terms & conditions acceptance
  - Automatic profile completion flow
- **User Type:** Public (unauthenticated users)
- **Destination Route:** `/auth/signup`

#### `complete-profile.tsx` - Profile Completion
- **Purpose:** Complete user profile after signup/approval
- **Features:**
  - Collect additional user information (designation, phone, address, DOB)
  - Profile image upload
  - Address map picker
  - Mark profile as complete
- **User Type:** Authenticated users with incomplete profiles
- **Destination Route:** `/complete-profile`

#### `account.tsx` - Account Management
- **Purpose:** View and manage user account settings
- **Features:**
  - View profile information
  - Edit personal details
  - Change password
  - Manage notification preferences
  - View account status
- **User Type:** Authenticated users
- **Destination Route:** `/account`

#### `users/index.tsx` - User Management List
- **Purpose:** List all users in the system
- **Features:**
  - Paginated user list with search/filter
  - User status indicators (active, approved, pending)
  - Quick actions dropdown
  - Bulk edit capability
- **User Type:** Admin users
- **Destination Route:** `/users`

#### `users/create.tsx` - Create User
- **Purpose:** Manually create new user accounts (admin)
- **Features:**
  - User creation form
  - Automatic password generation
  - Initial role assignment
  - Send invitation email
- **User Type:** Admin users
- **Destination Route:** `/users/create`

#### `users/[id]/edit.tsx` - Edit User
- **Purpose:** Modify user details and account status
- **Features:**
  - Edit user information
  - Change user status (active/inactive)
  - Update designation and phone
  - Modify profile picture
- **User Type:** Admin users
- **Destination Route:** `/users/[id]/edit`

#### `users/[id]/permissions.tsx` - Manage Permissions
- **Purpose:** Set granular permissions for specific users
- **Features:**
  - View all available permissions
  - Enable/disable permissions by action and resource
  - Permission categories (Event, Financial, User, etc.)
  - Save and audit changes
- **User Type:** Admin users
- **Destination Route:** `/users/[id]/permissions`

### Backend APIs

#### `POST /api/auth/login` - User Login
- **Authentication:** None (public)
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "token": "jwt_token",
      "user": {
        "id": "user_id",
        "email": "user@example.com",
        "name": "John Doe",
        "role": "rider",
        "isApproved": true,
        "profileComplete": true
      }
    }
  }
  ```
- **Validation:** Email format, password non-empty
- **Response Codes:** 200 (success), 401 (invalid credentials), 400 (validation error)

#### `POST /api/auth/signup` - User Registration
- **Authentication:** None (public)
- **Request Body:**
  ```json
  {
    "email": "newuser@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
- **Response:** User object with token
- **Features:**
  - Check email uniqueness
  - Hash password securely
  - Create user with default role (rider)
  - Send welcome email
- **Response Codes:** 201 (created), 409 (email exists), 400 (validation error)

#### `POST /api/auth/google` - Google OAuth Login
- **Authentication:** None (public)
- **Request Body:**
  ```json
  {
    "idToken": "google_id_token"
  }
  ```
- **Response:** User object with token
- **Features:**
  - Verify Google token
  - Create user if doesn't exist
  - Link to existing account if email matches
- **Response Codes:** 200 (success), 201 (new user), 400 (invalid token)

#### `GET /api/users` - List Users
- **Authentication:** Required (admin)
- **Query Parameters:**
  - `skip` (number) - pagination offset
  - `take` (number) - limit results
  - `search` (string) - search by name/email
  - `status` (string) - filter by status (active, pending, approved)
- **Response:** Paginated user list
- **Response Codes:** 200 (success), 401 (unauthorized), 403 (forbidden)

#### `POST /api/users` - Create User
- **Authentication:** Required (admin)
- **Request Body:**
  ```json
  {
    "email": "newuser@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "designation": "Rider",
    "role": "rider"
  }
  ```
- **Response:** Created user object
- **Features:**
  - Generate temporary password
  - Send invitation email
  - Assign initial role
  - Audit log entry
- **Response Codes:** 201 (created), 409 (email exists), 400 (validation error)

#### `GET /api/users/[id]` - Get User Details
- **Authentication:** Required
- **Authorization:** Self or admin
- **Response:** Complete user object with roles and permissions
- **Response Codes:** 200 (success), 401 (unauthorized), 404 (not found)

#### `PUT /api/users/[id]` - Update User
- **Authentication:** Required
- **Authorization:** Self or admin
- **Request Body:** Updatable user fields
- **Response:** Updated user object
- **Audit:** Log all changes
- **Response Codes:** 200 (success), 400 (validation error), 404 (not found)

#### `DELETE /api/users/[id]` - Delete User
- **Authentication:** Required (admin)
- **Response:** Success message
- **Audit:** Log deletion
- **Response Codes:** 200 (success), 404 (not found), 403 (forbidden)

#### `POST /api/users/bulk-update` - Bulk Update Users
- **Authentication:** Required (admin)
- **Request Body:**
  ```json
  {
    "userIds": ["id1", "id2"],
    "updates": {
      "isActive": true,
      "designation": "Rider Senior"
    }
  }
  ```
- **Response:** Number of updated users
- **Features:**
  - Update multiple users at once
  - Audit each change
  - Transaction-like behavior
- **Response Codes:** 200 (success), 400 (validation error)

#### `PUT /api/users/profile` - Update Profile
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+91-9876543210",
    "dob": "1990-01-01",
    "address": "123 Main St"
  }
  ```
- **Response:** Updated user object
- **Response Codes:** 200 (success), 400 (validation error)

#### `POST /api/users/complete-profile` - Complete Profile
- **Authentication:** Required
- **Request Body:** Profile completion data
- **Response:** Updated user with `profileComplete: true`
- **Audit:** Log profile completion
- **Response Codes:** 200 (success), 400 (validation error)

#### `GET /api/users/[id]/roles` - Get User Roles
- **Authentication:** Required (admin or self)
- **Response:** Array of user roles
- **Response Codes:** 200 (success), 401 (unauthorized)

#### `POST /api/users/[id]/roles` - Assign Roles
- **Authentication:** Required (admin)
- **Request Body:**
  ```json
  {
    "roleIds": ["role_id1", "role_id2"]
  }
  ```
- **Response:** Updated user with new roles
- **Audit:** Log role changes
- **Response Codes:** 200 (success), 400 (validation error)

#### `GET /api/users/[id]/permissions` - Get User Permissions
- **Authentication:** Required (admin or self)
- **Response:** Array of user permissions
- **Response Codes:** 200 (success), 401 (unauthorized)

#### `POST /api/users/[id]/permissions` - Set Permissions
- **Authentication:** Required (admin)
- **Request Body:**
  ```json
  {
    "permissions": [
      {
        "action": "CanEditEvent",
        "resource": "Event",
        "isGranted": true
      }
    ]
  }
  ```
- **Response:** Updated permissions
- **Audit:** Log permission changes
- **Response Codes:** 200 (success), 400 (validation error)

#### `POST /api/admin/approve-user` - Approve User
- **Authentication:** Required (admin)
- **Request Body:**
  ```json
  {
    "userId": "user_id",
    "isApproved": true
  }
  ```
- **Response:** Updated user object
- **Email:** Send approval notification
- **Audit:** Log approval
- **Response Codes:** 200 (success), 404 (not found)

### Data Models

#### User Model
```prisma
model User {
  id              String   @id @default(cuid())
  eId             String   @unique @default(cuid())
  email           String   @unique
  password        String   (hashed)
  firstName       String
  lastName        String
  designation     String?
  gender          String?
  phone           String?
  optionalPhone   String?
  dob             DateTime?
  address         String?
  efiRiderId      String?
  imageUrl        String?
  isActive        Boolean  @default(true)
  isApproved      Boolean  @default(false)
  isGoogleAuth    Boolean  @default(false)
  profileComplete Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  roles         Role[]         @relation("UserRoles")
  permissions   Permission[]
  clubs         Club[]         @relation("ClubPrimaryContact")
  riders        Rider[]        @relation("RiderUser")
  horsesOwned   Horse[]        @relation("HorseOwner")
  registrations Registration[] @relation("RegistrationUser")
  auditLogs     AuditLog[]
  notifications Notification[]
}
```

#### Role Model
```prisma
model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users User[] @relation("UserRoles")
}
```

#### Permission Model
```prisma
model Permission {
  id        String   @id @default(cuid())
  userId    String
  action    String   // CanEditEvent, CanViewFinancial, CanExport, CanPublish
  resource  String   // Event, Financial, User, etc.
  isGranted Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, action, resource])
}
```

### Key Features
- **Password Security:** Bcrypt hashing with salt
- **JWT Tokens:** 24-hour expiration with refresh mechanism
- **Google OAuth:** Sign-in with Google integration
- **Email Verification:** Confirmation emails for new accounts
- **Profile Approval Workflow:** Admin review before full access
- **Granular Permissions:** Action + Resource-based access control
- **Account Status:** Active/inactive toggles for user management
- **Audit Trail:** All user changes logged with timestamps

### User Flows

#### Complete Authentication Flow
1. User visits login page
2. Enters credentials or uses Google OAuth
3. System verifies credentials
4. JWT token issued upon success
5. User redirected to dashboard or pending approval page
6. If new user, directed to complete profile
7. Admin approves user (if required)
8. Full access granted

#### Permission Assignment Flow
1. Admin navigates to user permissions page
2. Selects permissions to grant/revoke
3. Saves changes
4. System logs all permission changes
5. User gains access to permitted resources on next login

### Related Modules
- Audit & Logging (tracks all user changes)
- Notifications (sends approval/rejection emails)
- Dashboard (personalizes per user role)

---

## 2. CLUBS MANAGEMENT

### Overview
Manage equestrian clubs, their riders, horses, and event registrations as organizational units.

### Purpose
- Organize riders and horses into clubs
- Manage club information and contact details
- Link multiple riders and horses to clubs
- Track club-level event registrations and finances

### Frontend Pages

#### `clubs/index.tsx` - Clubs List
- **Purpose:** Display all clubs with search and filter
- **Features:**
  - Paginated list of clubs
  - Search by name or short code
  - Filter by active/inactive status
  - Quick view club details
  - Create new club button
  - Bulk edit functionality
- **User Type:** Admin, Club managers
- **Destination Route:** `/clubs`

#### `clubs/create.tsx` - Create Club
- **Purpose:** Add new club to system
- **Features:**
  - Club information form (name, short code, registration number)
  - Contact information (phone, email, address)
  - GST details
  - Logo upload
  - Primary contact (user) selection
  - Social media links
  - Description
- **User Type:** Admin
- **Destination Route:** `/clubs/create`

#### `clubs/[id].tsx` - Club Details & Management
- **Purpose:** View and manage individual club
- **Features:**
  - Club information display
  - Riders list (with add/remove)
  - Horses list (with add/remove)
  - Event registrations summary
  - Financial summary
  - Edit club details
  - View stable bookings
- **User Type:** Admin, Club manager
- **Destination Route:** `/clubs/[id]`

### Backend APIs

#### `GET /api/clubs` - List Clubs
- **Authentication:** Required
- **Query Parameters:**
  - `skip`, `take` - pagination
  - `search` - search by name/code
  - `isActive` - filter by status
- **Response:** Paginated clubs list with counts
- **Response Codes:** 200, 401, 403

#### `POST /api/clubs` - Create Club
- **Authentication:** Required (admin)
- **Request Body:**
  ```json
  {
    "name": "Royal Equestrian Club",
    "shortCode": "REC",
    "registrationNumber": "REG123",
    "contactNumber": "+91-9876543210",
    "email": "info@rec.com",
    "address": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "pincode": "400001",
    "gstNumber": "27AAPCT1234A1Z0",
    "logoUrl": "https://...",
    "primaryContactId": "user_id",
    "socialLinks": { "instagram": "...", "website": "..." }
  }
  ```
- **Response:** Created club object
- **Validation:** Unique short code, valid GST format
- **Audit:** Log club creation
- **Response Codes:** 201, 409 (conflict), 400

#### `GET /api/clubs/[id]` - Get Club Details
- **Authentication:** Required
- **Response:** Complete club object with relations
- **Response Codes:** 200, 404

#### `PUT /api/clubs/[id]` - Update Club
- **Authentication:** Required (admin or club manager)
- **Authorization:** Admin or club's primary contact
- **Request Body:** Updatable club fields
- **Response:** Updated club object
- **Audit:** Log all changes
- **Response Codes:** 200, 400, 404

#### `DELETE /api/clubs/[id]` - Delete Club
- **Authentication:** Required (admin)
- **Soft Delete:** Set `isActive: false`
- **Response:** Success message
- **Audit:** Log deletion
- **Response Codes:** 200, 404

#### `GET /api/clubs/[id]/riders` - Get Club Riders
- **Authentication:** Required
- **Response:** Array of riders in club
- **Query Parameters:** `skip`, `take`, `search`
- **Response Codes:** 200, 404

#### `POST /api/clubs/[id]/riders` - Add Rider to Club
- **Authentication:** Required (admin)
- **Request Body:**
  ```json
  {
    "riderId": "rider_id"
  }
  ```
- **Response:** Updated rider object
- **Response Codes:** 200, 404

#### `DELETE /api/clubs/[id]/riders/[riderId]` - Remove Rider
- **Authentication:** Required (admin)
- **Response:** Success message
- **Response Codes:** 200, 404

#### `GET /api/clubs/[id]/horses` - Get Club Horses
- **Authentication:** Required
- **Response:** Array of horses in club
- **Query Parameters:** `skip`, `take`, `search`
- **Response Codes:** 200, 404

#### `POST /api/clubs/[id]/horses` - Add Horse to Club
- **Authentication:** Required (admin)
- **Request Body:**
  ```json
  {
    "horseId": "horse_id"
  }
  ```
- **Response:** Updated horse object
- **Response Codes:** 200, 404

### Data Models

#### Club Model
```prisma
model Club {
  id                 String   @id @default(cuid())
  eId                String   @unique @default(cuid())
  name               String
  shortCode          String   @unique
  registrationNumber String?
  contactNumber      String?
  email              String?
  address            String?
  city               String?
  state              String?
  country            String?
  pincode            String?
  gstNumber          String?
  logoUrl            String?
  description        String?
  socialLinks        Json?
  optionalPhone      String?
  isActive           Boolean  @default(true)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  primaryContactId String
  primaryContact   User   @relation("ClubPrimaryContact", fields: [primaryContactId], references: [id])

  riders         Rider[]         @relation("ClubRiders")
  horses         Horse[]         @relation("ClubHorses")
  registrations  Registration[]  @relation("ClubRegistrations")
  stableBookings StableBooking[] @relation("ClubStableBookings")
}
```

### Key Features
- **Club Hierarchy:** Organize riders and horses under clubs
- **Contact Management:** Multi-point contact information
- **GST Tracking:** Tax identification for financial reports
- **Logo Support:** Club branding with image uploads
- **Primary Contact:** designated manager per club
- **Soft Deletes:** Deactivate clubs without losing data
- **Relationship Tracking:** Monitor riders, horses, and registrations

### User Flows

#### Create Club Flow
1. Admin clicks "Create Club"
2. Fills in club information
3. Selects primary contact (user)
4. Uploads logo
5. Confirms creation
6. Club appears in list
7. Can add riders and horses

#### Manage Club Flow
1. Admin navigates to club
2. Views riders and horses
3. Can add/remove riders and horses
4. Can edit club details
5. Views financial summary
6. Manages stable bookings

### Related Modules
- Users (primary contact)
- Riders (managed within clubs)
- Horses (managed within clubs)
- Registrations (club-level tracking)
- Financial (income by club)

---

## 3. RIDERS MANAGEMENT

### Overview
Manage equestrian riders with profiles, contact information, and club associations.

### Purpose
- Register and track rider information
- Link riders to clubs and horses
- Maintain rider credentials (EFI ID, Aadhaar)
- Track rider event participation

### Frontend Pages

#### `riders/index.tsx` - Riders List
- **Purpose:** Display all riders with search and filters
- **Features:**
  - Paginated list with search by name/email
  - Filter by club or active status
  - View rider details in modal/detail view
  - Add new rider button
  - Bulk import capability
- **User Type:** Admin, Club managers
- **Destination Route:** `/riders`

#### `riders/create.tsx` - Create Rider
- **Purpose:** Register new rider in system
- **Features:**
  - Rider information form (name, email, DOB, gender)
  - Contact details (mobile, address)
  - Aadhaar and EFI ID (optional)
  - Club assignment
  - Profile picture upload
  - Social media links
- **User Type:** Admin, Club managers
- **Destination Route:** `/riders/create`

#### `riders/[id].tsx` - Rider Details
- **Purpose:** View and manage individual rider
- **Features:**
  - Complete rider profile
  - Associated horses
  - Event registrations history
  - Financial summary
  - Edit rider details
  - Enable/disable rider
- **User Type:** Admin, Club managers, Riders
- **Destination Route:** `/riders/[id]`

### Backend APIs

#### `GET /api/riders` - List Riders
- **Authentication:** Required
- **Query Parameters:**
  - `skip`, `take` - pagination
  - `search` - by name/email
  - `clubId` - filter by club
  - `isActive` - filter by status
- **Response:** Paginated riders list
- **Response Codes:** 200, 401

#### `POST /api/riders` - Create Rider
- **Authentication:** Required (admin)
- **Request Body:**
  ```json
  {
    "firstName": "John",
    "lastName": "Smith",
    "email": "john@example.com",
    "dob": "1990-01-15",
    "gender": "Male",
    "mobile": "+91-9876543210",
    "address": "123 Green Lane",
    "aadhaarNumber": "123456789012",
    "efiRiderId": "EFI123456",
    "clubId": "club_id",
    "imageUrl": "https://...",
    "socialLinks": { "instagram": "..." }
  }
  ```
- **Response:** Created rider object
- **Validation:** Unique email, valid phone format
- **Audit:** Log creation
- **Response Codes:** 201, 409, 400

#### `GET /api/riders/[id]` - Get Rider Details
- **Authentication:** Required
- **Response:** Complete rider with relations
- **Response Codes:** 200, 404

#### `PUT /api/riders/[id]` - Update Rider
- **Authentication:** Required
- **Authorization:** Self, admin, or club manager
- **Request Body:** Updatable rider fields
- **Response:** Updated rider object
- **Audit:** Log changes
- **Response Codes:** 200, 400, 404

#### `DELETE /api/riders/[id]` - Delete Rider
- **Authentication:** Required (admin)
- **Soft Delete:** Set `isActive: false`
- **Response:** Success message
- **Response Codes:** 200, 404

#### `POST /api/riders/[id]/disable` - Disable Rider
- **Authentication:** Required (admin)
- **Request Body:**
  ```json
  {
    "reason": "Retired from competitions"
  }
  ```
- **Response:** Updated rider with `isActive: false`
- **Email:** Notify rider of deactivation
- **Audit:** Log disabling
- **Response Codes:** 200, 404

### Data Models

#### Rider Model
```prisma
model Rider {
  id            String    @id @default(cuid())
  eId           String    @unique @default(cuid())
  efiRiderId    String?
  firstName     String
  lastName      String
  email         String    @unique
  dob           DateTime?
  gender        String?
  mobile        String?
  optionalPhone String?
  address       String?
  aadhaarNumber String?
  imageUrl      String?
  socialLinks   Json?
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User?          @relation("RiderUser", fields: [userId], references: [id])
  userId        String?
  club          Club?          @relation("ClubRiders", fields: [clubId], references: [id])
  clubId        String?
  horses        Horse[]        @relation("RiderHorses")
  registrations Registration[] @relation("RiderRegistrations")
}
```

### Key Features
- **Multi-Contact Fields:** Primary and optional phone numbers
- **Credential Tracking:** EFI ID and Aadhaar number storage
- **Club Affiliation:** Link riders to specific clubs
- **User Account Link:** Connect rider to user accounts
- **Profile Images:** Support for rider photos
- **Registration History:** Track all event participations
- **Status Management:** Enable/disable riders with reasons

### User Flows

#### Register Rider Flow
1. Admin/Club manager clicks "Create Rider"
2. Fills in rider information
3. Optionally adds EFI and Aadhaar IDs
4. Assigns to club
5. Uploads profile picture
6. Creates rider record
7. Rider can register for events

#### View Rider Flow
1. Navigate to riders list
2. Search or filter riders
3. Click on rider for details
4. View horses, registrations, finances
5. Can edit or disable rider

### Related Modules
- Users (linked via userId)
- Clubs (club affiliation)
- Horses (owned/ridden by riders)
- Registrations (event participations)
- Notifications (communicate with riders)

---

## 4. HORSES MANAGEMENT

### Overview
Manage horse records including breed, identification, ownership, and event participation.

### Purpose
- Register and track horses
- Maintain horse credentials and identification
- Link horses to owners, riders, and clubs
- Track horse event history and health records

### Frontend Pages

#### `horses/index.tsx` - Horses List
- **Purpose:** Display all horses in system
- **Features:**
  - Paginated list with search by name
  - Filter by breed, gender, owner, or rider
  - View horse details
  - Add new horse button
  - Bulk import capability
- **User Type:** Admin, Club managers, Riders
- **Destination Route:** `/horses`

#### `horses/create.tsx` - Create Horse
- **Purpose:** Register new horse
- **Features:**
  - Horse information form (name, breed, gender, color)
  - Height and year of birth
  - Identification numbers (passport, EIRS code, embassy ID)
  - Owner assignment (user or rider)
  - Rider assignment
  - Club assignment
  - Horse picture upload
- **User Type:** Admin, Riders
- **Destination Route:** `/horses/create`

#### `horses/[id].tsx` - Horse Details
- **Purpose:** View and manage individual horse
- **Features:**
  - Complete horse profile
  - Owner and rider information
  - Event participation history
  - Performance records
  - Edit horse details
  - Enable/disable horse
  - Medical/health notes (if available)
- **User Type:** Admin, Club managers, Riders, Owners
- **Destination Route:** `/horses/[id]`

### Backend APIs

#### `GET /api/horses` - List Horses
- **Authentication:** Required
- **Query Parameters:**
  - `skip`, `take` - pagination
  - `search` - by name
  - `breed`, `gender` - filters
  - `ownerId`, `riderId`, `clubId` - associations
  - `isActive` - status filter
- **Response:** Paginated horses list
- **Response Codes:** 200, 401

#### `POST /api/horses` - Create Horse
- **Authentication:** Required (admin or rider)
- **Request Body:**
  ```json
  {
    "name": "Thunderbolt",
    "breed": "Arabian",
    "color": "Bay",
    "height": 15.2,
    "gender": "Stallion",
    "yearOfBirth": 2018,
    "passportNumber": "PSP123456",
    "embassyId": "EIRSHR00001",
    "horseCode": "TB001",
    "ownerId": "user_id",
    "riderId": "rider_id",
    "clubId": "club_id"
  }
  ```
- **Response:** Created horse object
- **Validation:** Valid height/birth year, unique passport number
- **Audit:** Log creation
- **Response Codes:** 201, 409, 400

#### `GET /api/horses/[id]` - Get Horse Details
- **Authentication:** Required
- **Response:** Complete horse with relations and history
- **Response Codes:** 200, 404

#### `PUT /api/horses/[id]` - Update Horse
- **Authentication:** Required
- **Authorization:** Owner, admin, or rider
- **Request Body:** Updatable horse fields
- **Response:** Updated horse object
- **Audit:** Log changes
- **Response Codes:** 200, 400, 404

#### `DELETE /api/horses/[id]` - Delete Horse
- **Authentication:** Required (admin)
- **Soft Delete:** Set `isActive: false`
- **Response:** Success message
- **Response Codes:** 200, 404

#### `POST /api/horses/[id]/disable` - Disable Horse
- **Authentication:** Required (admin)
- **Request Body:**
  ```json
  {
    "reason": "Retired from racing"
  }
  ```
- **Response:** Updated horse with `isActive: false`
- **Email:** Notify owner/rider
- **Audit:** Log disabling
- **Response Codes:** 200, 404

### Data Models

#### Horse Model
```prisma
model Horse {
  id             String   @id @default(cuid())
  eId            String   @unique @default(cuid())
  name           String
  breed          String?
  color          String?
  height         Float?
  passportNumber String?
  horseCode      String?
  embassyId      String?  @unique
  gender         String   // Stallion, Mare, Gelding
  yearOfBirth    Int?
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  owner         User?          @relation("HorseOwner", fields: [ownerId], references: [id])
  ownerId       String?
  rider         Rider?         @relation("RiderHorses", fields: [riderId], references: [id])
  riderId       String?
  club          Club?          @relation("ClubHorses", fields: [clubId], references: [id])
  clubId        String?
  registrations Registration[] @relation("HorseRegistrations")
}
```

### Key Features
- **Comprehensive Identification:** Passport, EIRS, embassy IDs
- **Physical Characteristics:** Breed, color, height, gender
- **Multiple Associations:** Owner, rider, and club links
- **Registration History:** Track all event participations
- **Status Management:** Enable/disable horses with reasons
- **Unique Constraints:** Embassy ID uniqueness
- **Audit Trail:** Track all modifications

### User Flows

#### Register Horse Flow
1. Rider/Owner clicks "Create Horse"
2. Fills in horse information
3. Enters identification numbers
4. Assigns owner and rider
5. Assigns to club
6. Uploads horse picture
7. Creates horse record

#### View Horse Flow
1. Navigate to horses list
2. Search or filter horses
3. Click on horse for details
4. View owner, rider, club information
5. View event participation history
6. View financial summary
7. Can edit or disable horse

### Related Modules
- Users (owner)
- Riders (ridden by)
- Clubs (club affiliation)
- Registrations (event participations)
- Financial (costs and income)

---

## 5. EVENTS MANAGEMENT

### Overview
Create, manage, and track equestrian events with categories, venues, and scheduling.

### Purpose
- Create and publish events
- Define event categories with pricing
- Manage event venues and schedules
- Track published vs draft states
- Support multi-day and complex event structures

### Frontend Pages

#### `events/index.tsx` - Events List
- **Purpose:** Display all events with filtering
- **Features:**
  - Paginated list with search by name
  - Filter by event type, date range, published status
  - View event details in modal
  - Create new event button
  - Duplicate event capability
  - Quick edit/publish toggles
- **User Type:** Admin, Event organizers
- **Destination Route:** `/events`

#### `events/create.tsx` - Create/Edit Event
- **Purpose:** Create or edit event details
- **Features:**
  - Event information form (name, type, description)
  - Date and time selection (multi-day support)
  - Venue selection or address input with map picker
  - Event categories with pricing and GST
  - Terms and conditions editor (rich text)
  - File upload (event documents)
  - Save as draft or publish
- **User Type:** Admin, Event organizers
- **Destination Route:** `/events/create` or `/events/[id]/edit`

#### `events/[id].tsx` - Event Details
- **Purpose:** View comprehensive event information
- **Features:**
  - Event overview with dates, venue, categories
  - Categories with pricing breakdown
  - Registration count and revenue
  - Stables management link
  - Participant list
  - Financial summary
  - Edit/Duplicate/Publish buttons
  - Cancel event option
- **User Type:** Admin, Event organizers, Riders (view only)
- **Destination Route:** `/events/[id]`

#### `events/[id]/stables.tsx` - Manage Event Stables
- **Purpose:** Define and manage stables for event
- **Features:**
  - Stables list with capacity
  - Create new stable
  - Edit stable details
  - Adjust pricing
  - View bookings for each stable
  - Availability status
- **User Type:** Admin, Event organizers
- **Destination Route:** `/events/[id]/stables`

### Backend APIs

#### `GET /api/events` - List Events
- **Authentication:** Required
- **Query Parameters:**
  - `skip`, `take` - pagination
  - `search` - by name
  - `eventType`, `isPublished`, `startDate` - filters
  - `clubId` - for club-specific events
- **Response:** Paginated events list
- **Response Codes:** 200, 401

#### `POST /api/events` - Create Event
- **Authentication:** Required (admin)
- **Request Body:**
  ```json
  {
    "eventType": "KSEC Show",
    "name": "Spring Equestrian Show 2026",
    "description": "Annual spring show",
    "startDate": "2026-05-01",
    "endDate": "2026-05-03",
    "startTime": "09:00",
    "startEndTime": "17:00",
    "endStartTime": "09:00",
    "endTime": "17:00",
    "venueName": "Green meadows",
    "venueAddress": "123 Country Road",
    "venueLat": 28.7041,
    "venueLng": 77.1025,
    "termsAndConditions": "...",
    "fileUrl": "https://..."
  }
  ```
- **Response:** Created event object
- **Validation:** Valid dates, venue info, category data
- **Default State:** isPublished: false (draft)
- **Response Codes:** 201, 400

#### `GET /api/events/[id]` - Get Event Details
- **Authentication:** Required (or public if published)
- **Response:** Complete event with categories and registrations
- **Response Codes:** 200, 404

#### `PUT /api/events/[id]` - Update Event
- **Authentication:** Required (admin)
- **Authorization:** Only if unpublished or admin override
- **Request Body:** Updatable event fields
- **Response:** Updated event object
- **Audit:** Log changes
- **Response Codes:** 200, 400, 404, 403

#### `DELETE /api/events/[id]` - Delete Event
- **Authentication:** Required (admin)
- **Authorization:** Only if no registrations
- **Response:** Success message
- **Audit:** Log deletion
- **Response Codes:** 200, 404, 403

#### `POST /api/events/[id]/publish` - Publish Event
- **Authentication:** Required (admin)
- **Request Body:**
  ```json
  {
    "publish": true
  }
  ```
- **Response:** Updated event with `isPublished: true`
- **Email:** Notify registered users
- **Audit:** Log publication
- **Validations:**
  - Has categories with valid pricing
  - Venue information complete
  - Start date is in future
- **Response Codes:** 200, 400, 403

#### `POST /api/events/[id]/duplicate` - Duplicate Event
- **Authentication:** Required (admin)
- **Request Body:**
  ```json
  {
    "newName": "Spring Show 2027",
    "newStartDate": "2027-05-01"
  }
  ```
- **Response:** New duplicated event (unpublished)
- **Copies:** Categories, stables, terms
- **Doesn't Copy:** Registrations, transactions
- **Response Codes:** 201, 400

#### `GET /api/events/[id]/stables` - Get Event Stables
- **Authentication:** Required
- **Response:** Array of stables with booking info
- **Response Codes:** 200, 404

#### `POST /api/events/[id]/stables` - Create Event Stable
- **Authentication:** Required (admin)
- **Request Body:**
  ```json
  {
    "number": "A1",
    "capacity": 2,
    "pricePerStable": 1500,
    "venueId": "venue_id"
  }
  ```
- **Response:** Created stable object
- **Response Codes:** 201, 400

#### `PUT /api/events/[id]/stables/[stableId]` - Update Stable
- **Authentication:** Required (admin)
- **Request Body:** Updatable stable fields
- **Response:** Updated stable object
- **Response Codes:** 200, 400

#### `DELETE /api/events/[id]/stables/[stableId]` - Delete Stable
- **Authentication:** Required (admin)
- **Authorization:** Only if no bookings
- **Response:** Success message
- **Response Codes:** 200, 403, 404

### Data Models

#### Event Model
```prisma
model Event {
  id          String   @id @default(cuid())
  eId         String   @unique @default(cuid())
  eventType   String
  name        String
  description String?
  startDate   DateTime
  endDate     DateTime
  startTime   String?
  startEndTime String?
  endStartTime String?
  endTime     String?
  fileUrl     String?
  isPublished Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  venueName    String?
  venueAddress String?
  venueLat     Float?
  venueLng     Float?

  termsAndConditions String?

  venue         Venue?          @relation(fields: [venueId], references: [id])
  venueId       String?
  categories    EventCategory[] @relation("EventToCategory")
  registrations Registration[]  @relation("EventRegistrations")
  stables       Stable[]        @relation("EventStables")
}
```

#### EventCategory Model
```prisma
model EventCategory {
  id          String   @id @default(cuid())
  eId         String   @unique @default(cuid())
  name        String
  price       Float
  cgst        Float    @default(0)
  sgst        Float    @default(0)
  igst        Float    @default(0)
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  events        Event[]        @relation("EventToCategory")
  registrations Registration[] @relation("RegistrationCategory")
}
```

#### EventType Model
```prisma
model EventType {
  id          String   @id @default(cuid())
  name        String   @unique
  shortCode   String   @unique
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### Venue Model
```prisma
model Venue {
  id        String   @id @default(cuid())
  name      String?
  address   String?
  isDefault Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  events  Event[]  @relation()
  stables Stable[] @relation("VenueStables")
}
```

### Key Features
- **Multi-Category Events:** Different classes with individual pricing
- **Multi-Day Support:** Complex date/time structures
- **Venue Management:** Store venue information with coordinates
- **GST Breakdown:** Track CGST, SGST, IGST separately
- **Draft/Published States:** Control event visibility
- **Event Duplication:** Clone events for recurring events
- **Terms & Conditions:** Rich text editor for rules
- **Stables Integration:** Define accommodations
- **Audit Trail:** Track all event modifications

### User Flows

#### Create Event Flow
1. Admin clicks "Create Event"
2. Fills in event details (dates, venue, name)
3. Adds event categories with pricing
4. Sets terms and conditions
5. Optionally creates stables
6. Saves as draft
7. Later, publishes event
8. Riders can register

#### Publish Event Flow
1. Admin navigates to event
2. Verifies all details are complete
3. Clicks "Publish"
4. System validates:
   - Categories exist and have pricing
   - Venue information complete
   - Start date is future
5. Event becomes visible to riders
6. Notifications sent to subscribed users

#### Duplicate Event Flow
1. Admin clicks "Duplicate" on event
2. Specifies new date/name
3. System copies:
   - Categories (pricing intact)
   - Stables
   - Terms & conditions
4. Creates new unpublished event
5. Can edit and publish

### Related Modules
- Registrations (linked registrations)
- Categories (defines pricing)
- Stables (accommodations)
- Venues (location tracking)
- Financial (revenue tracking)
- Notifications (event updates)

---

## 6. EVENT REGISTRATIONS

### Overview
Manage rider registrations for events, including approval workflows and payment tracking.

### Purpose
- Track rider registrations for events
- Manage registration approval workflow
- Calculate and track pricing (event + stables + GST)
- Link payments to registrations
- Support bulk registration and bulk updates

### Frontend Pages

#### `registrations/index.tsx` - Registrations List
- **Purpose:** Display all event registrations
- **Features:**
  - Paginated list with search and filters
  - Filter by event, rider, club, status (payment/approval)
  - View registration details
  - Quick approve/reject actions
  - Bulk actions (approve multiple)
  - Export to CSV
- **User Type:** Admin, Event organizers
- **Destination Route:** `/registrations`

#### `registrations/create.tsx` - Create Registration
- **Purpose:** Register rider for event
- **Features:**
  - Event selection
  - Rider selection
  - Horse selection (from rider's horses)
  - Category selection with price display
  - Stable booking (optional)
  - Calculate total amount (event + stable + GST)
  - Payment method selection
  - Notes field
- **User Type:** Admin, Riders
- **Destination Route:** `/registrations/create`

#### `registrations/approvals.tsx` - Approvals Queue
- **Purpose:** Review pending registrations
- **Features:**
  - List of pending registrations
  - Rider and horse information
  - Category and amount details
  - Approve button
  - Reject button with notes option
  - Bulk approve capability
  - Filter by event
- **User Type:** Admin, Event organizers
- **Destination Route:** `/registrations/approvals`

### Backend APIs

#### `GET /api/registrations` - List Registrations
- **Authentication:** Required
- **Query Parameters:**
  - `skip`, `take` - pagination
  - `search` - by rider/horse name
  - `eventId`, `clubId` - filters
  - `paymentStatus`, `approvalStatus` - status filters
  - `createdAfter`, `createdBefore` - date range
- **Response:** Paginated registrations with totals
- **Response Codes:** 200, 401

#### `POST /api/registrations` - Create Registration
- **Authentication:** Required (admin or rider)
- **Request Body:**
  ```json
  {
    "eventId": "event_id",
    "riderId": "rider_id",
    "horseId": "horse_id",
    "categoryId": "category_id",
    "clubId": "club_id",
    "paymentMethod": "CARD",
    "paymentRef": "REF123",
    "paymentNotes": "Online payment"
  }
  ```
- **Response:** Created registration with calculated amounts
- **Price Calculation:**
  - eventAmount = category.price * (1 + (cgst + sgst + igst) / 100)
  - stableAmount = stable booking costs (if any)
  - gstAmount = calculated
  - totalAmount = sum
- **Default:** paymentStatus: UNPAID, approvalStatus: PENDING
- **Audit:** Log registration
- **Response Codes:** 201, 409 (duplicate), 400

#### `GET /api/registrations/pending` - Get Pending Registrations
- **Authentication:** Required (admin)
- **Response:** Array of pending (PENDING approval) registrations
- **Query Parameters:** `eventId`, `skip`, `take`
- **Response Codes:** 200, 401

#### `GET /api/registrations/[id]` - Get Registration Details
- **Authentication:** Required
- **Authorization:** Self, admin, or event organizer
- **Response:** Complete registration with all related data
- **Response Codes:** 200, 404, 403

#### `PUT /api/registrations/[id]` - Update Registration
- **Authentication:** Required (admin)
- **Authorization:** Only before approval
- **Request Body:** Updatable fields (notes, paymentRef)
- **Response:** Updated registration
- **Audit:** Log changes
- **Response Codes:** 200, 400, 403, 404

#### `DELETE /api/registrations/[id]` - Cancel Registration
- **Authentication:** Required (admin)
- **Request Body:**
  ```json
  {
    "reason": "Rider withdrew due to injury"
  }
  ```
- **Cancellation Rules:**
  - If UNPAID: Can cancel freely
  - If PAID: Can cancel with refund processing
- **Response:** Success with refund info if applicable
- **Email:** Notify rider of cancellation
- **Audit:** Log cancellation
- **Response Codes:** 200, 403, 404

#### `POST /api/registrations/[id]/approve` - Approve Registration
- **Authentication:** Required (admin)
- **Request Body:**
  ```json
  {
    "isApproved": true,
    "approvalNotes": "Approved - documents verified"
  }
  ```
- **Response:** Updated registration with `approvalStatus: APPROVED`
- **Email:** Send approval notification to rider
- **Email:** Reminder to make payment if not paid
- **Audit:** Log approval with admin name
- **Response Codes:** 200, 400, 403

#### `POST /api/registrations/[id]/reject` - Reject Registration
- **Authentication:** Required (admin)
- **Request Body:**
  ```json
  {
    "isApproved": false,
    "rejectionNotes": "Documents incomplete"
  }
  ```
- **Response:** Updated registration with `approvalStatus: REJECTED`
- **Email:** Send rejection notification with notes
- **Audit:** Log rejection with reason
- **Response Codes:** 200, 400, 403

#### `POST /api/registrations/[id]/payment` - Record Payment
- **Authentication:** Required (admin or rider)
- **Request Body:**
  ```json
  {
    "amount": 5000,
    "paymentMethod": "CARD",
    "paymentRef": "TXN123456",
    "transactionDate": "2026-03-31",
    "paymentNotes": "Card payment"
  }
  ```
- **Response:** Updated registration with new payment status
- **Payment Logic:**
  - UNPAID -> PARTIAL (if amount < totalAmount)
  - UNPAID/PARTIAL -> PAID (if amount >= totalAmount)
- **Audit:** Log payment
- **Email:** Confirmation to rider
- **Response Codes:** 200, 400, 403

### Data Models

#### Registration Model
```prisma
model Registration {
  id             String         @id @default(cuid())
  eId            String         @unique @default(cuid())
  eventId        String
  riderId        String
  horseId        String
  clubId         String?
  categoryId     String
  paymentStatus  PaymentStatus  @default(UNPAID)
  approvalStatus ApprovalStatus @default(PENDING)
  approvedBy     String?
  approvedAt     DateTime?
  rejectionNotes String?
  paymentMethod  String?
  paymentRef     String?
  paymentNotes   String?

  eventAmount  Float @default(0)
  stableAmount Float @default(0)
  gstAmount    Float @default(0)
  totalAmount  Float @default(0)

  registeredAt DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  event    Event         @relation("EventRegistrations", fields: [eventId], references: [id], onDelete: Cascade)
  rider    Rider         @relation("RiderRegistrations", fields: [riderId], references: [id], onDelete: Cascade)
  horse    Horse         @relation("HorseRegistrations", fields: [horseId], references: [id], onDelete: Cascade)
  club     Club?         @relation("ClubRegistrations", fields: [clubId], references: [id])
  category EventCategory @relation("RegistrationCategory", fields: [categoryId], references: [id])
  user     User?         @relation("RegistrationUser", fields: [userId], references: [id])
  userId   String?

  stableBookings StableBooking[] @relation("RegistrationBookings")
  transactions   Transaction[]   @relation("RegistrationTransactions")

  @@unique([eventId, riderId, horseId])
  @@index([eventId])
  @@index([riderId])
  @@index([paymentStatus])
  @@index([approvalStatus])
  @@index([createdAt])
}
```

#### Enums
```prisma
enum PaymentStatus {
  PAID
  UNPAID
  PARTIAL
  CANCELLED
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}
```

### Key Features
- **Two-Step Workflow:** Approval + Payment tracking
- **Automatic Price Calculation:** With GST breakdown
- **Duplicate Prevention:** Unique constraint (event, rider, horse)
- **Stable Integration:** Optional stable bookings with costs
- **Partial Payments:** Support for payment in installments
- **Bulk Operations:** Approve multiple registrations at once
- **Comprehensive Audit:** All state changes logged
- **Soft Cancellations:** Track refunds and cancellation reasons

### User Flows

#### Register for Event Flow
1. Rider navigates to "Register for Event"
2. Selects event from list
3. System shows event categories and prices
4. Rider selects category
5. Selects horse from their horses
6. Optionally books stable
7. System displays calculated total (with GST)
8. Selects payment method
9. Creates registration
10. Status: PENDING approval, UNPAID

#### Approve Registration Flow
1. Admin navigates to Approvals queue
2. Reviews pending registrations
3. Verifies rider credentials
4. Clicks "Approve"
5. Registration moves to APPROVED status
6. Rider receives approval notification
7. Rider can now pay

#### Payment Processing Flow
1. Rider makes payment (online or offline)
2. Admin (or rider) records payment
3. System updates payment status:
   - UNPAID (no payment)
   - PARTIAL (partial payment)
   - PAID (full payment)
4. Rider receives payment confirmation
5. Registration fully activated

### Related Modules
- Events (event being registered for)
- Riders (registering rider)
- Horses (horse being registered)
- Categories (pricing)
- Stables (optional accommodation)
- Financial/Transactions (payment tracking)
- Notifications (approval/payment emails)
- Audit (change tracking)

---

## 7. STABLES MANAGEMENT

### Overview
Manage stable facilities, stall bookings, and accommodation resources for events.

### Purpose
- Define stable facilities at venues
- Track stable capacity and availability
- Manage stable bookings with pricing
- Link stall bookings to registrations

### Frontend Pages

#### `events/[id]/stables.tsx` - Manage Event Stables
- **Purpose:** Create and manage stables for an event
- **Features:**
  - List stables with capacity and price
  - Create new stable
  - Edit stable number, capacity, price
  - View booking status
  - Assign venue
  - Set availability
- **User Type:** Admin, Event organizers
- **Destination Route:** `/events/[id]/stables`

### Backend APIs

#### `GET /api/stables/[id]` - Get Stable Details
- **Authentication:** Required
- **Response:** Stable with bookings information
- **Response Codes:** 200, 404

#### `PUT /api/stables/[id]` - Update Stable
- **Authentication:** Required (admin)
- **Request Body:**
  ```json
  {
    "capacity": 2,
    "pricePerStable": 1500,
    "isAvailable": true
  }
  ```
- **Response:** Updated stable object
- **Response Codes:** 200, 400, 404

### Data Models

#### Stable Model
```prisma
model Stable {
  id             String   @id @default(cuid())
  eId            String   @unique @default(cuid())
  eventId        String
  number         String   // Stable A, Stable B, etc.
  capacity       Int      @default(1)
  pricePerStable Float    @default(0)
  isAvailable    Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  event    Event           @relation("EventStables", fields: [eventId], references: [id], onDelete: Cascade)
  venue    Venue?          @relation("VenueStables", fields: [venueId], references: [id])
  venueId  String?
  bookings StableBooking[] @relation("StableBookings")

  @@index([eventId])
  @@index([isAvailable])
}
```

#### StableBooking Model
```prisma
model StableBooking {
  id              String   @id @default(cuid())
  eId             String   @unique @default(cuid())
  registrationId  String
  stableId        String
  clubId          String?
  numberOfStables Int      @default(1)
  totalPrice      Float    @default(0)
  bookingDate     DateTime
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  registration Registration @relation("RegistrationBookings", fields: [registrationId], references: [id], onDelete: Cascade)
  stable       Stable       @relation("StableBookings", fields: [stableId], references: [id], onDelete: Cascade)
  club         Club?        @relation("ClubStableBookings", fields: [clubId], references: [id])

  @@index([registrationId])
  @@index([stableId])
}
```

### Key Features
- **Capacity Tracking:** Limit stalls per stable
- **Pricing:** Per-stable or fixed rates
- **Availability Management:** Enable/disable stables
- **Booking Integration:** Track bookings via registrations
- **Venue Association:** Link stables to venues

### Related Modules
- Events (event stables)
- Registrations (stable bookings)
- Venues (location)

---

## 8. FINANCIAL & TRANSACTIONS

### Overview
Track financial transactions, payments, and event revenue with detailed breakdowns.

### Purpose
- Record and track all financial transactions
- Calculate and track GST (CGST, SGST, IGST)
- Generate financial reports by event/club/period
- Monitor payment status across registrations
- Audit financial changes

### Frontend Pages

#### `financial/index.tsx` - Financial Dashboard
- **Purpose:** Overview of system finances
- **Features:**
  - Total revenue by period
  - Event-wise revenue breakdown
  - Club-wise revenue breakdown
  - GST collection summary
  - Payment status summary (paid/unpaid/partial)
  - Charts showing revenue trends
  - Export financial reports
  - Filter by date range
- **User Type:** Admin, Finance manager
- **Destination Route:** `/financial`

#### `financial/transactions/create.tsx` - Record Transaction
- **Purpose:** Manually record payment/transaction
- **Features:**
  - Select registration
  - Enter payment amount
  - Enter GST breakdown (CGST/SGST/IGST)
  - Payment method selection
  - Reference number entry
  - Date selection
  - Notes field
  - Auto-calculation of total
- **User Type:** Admin, Finance manager
- **Destination Route:** `/financial/transactions/create`

### Backend APIs

#### `GET /api/financial/summary` - Financial Summary
- **Authentication:** Required (admin)
- **Query Parameters:**
  - `eventId` - filter by event
  - `clubId` - filter by club
  - `startDate`, `endDate` - date range
  - `paymentStatus` - filter transactions
- **Response:**
  ```json
  {
    "totalRevenue": 150000,
    "totalGst": 27000,
    "paidAmount": 120000,
    "unpaidAmount": 30000,
    "partialAmount": 0,
    "breakdown": {
      "byEvent": [...],
      "byPaymentStatus": {...},
      "byClub": [...]
    },
    "gstBreakdown": {
      "cgst": 9000,
      "sgst": 9000,
      "igst": 9000
    }
  }
  ```
- **Response Codes:** 200, 401, 403

#### `GET /api/financial/transactions` - List Transactions
- **Authentication:** Required (admin)
- **Query Parameters:**
  - `skip`, `take` - pagination
  - `registrationId`, `eventId` - filters
  - `status` - payment status
  - `startDate`, `endDate` - range
  - `search` - by reference number
- **Response:** Paginated transactions
- **Response Codes:** 200, 401

#### `POST /api/financial/transactions` - Create Transaction
- **Authentication:** Required (admin)
- **Request Body:**
  ```json
  {
    "registrationId": "reg_id",
    "amount": 5000,
    "cgstAmount": 450,
    "sgstAmount": 450,
    "igstAmount": 0,
    "totalAmount": 5900,
    "transactionDate": "2026-03-31",
    "paymentMethod": "CARD",
    "referenceNumber": "TXN123456",
    "notes": "Online payment received"
  }
  ```
- **Response:** Created transaction
- **Updates Registration:** Updates registration payment status
- **Audit:** Log transaction
- **Response Codes:** 201, 400

#### `GET /api/financial/transactions/[id]` - Get Transaction
- **Authentication:** Required (admin)
- **Response:** Transaction details
- **Response Codes:** 200, 404

#### `PUT /api/financial/transactions/[id]` - Update Transaction
- **Authentication:** Required (admin)
- **Request Body:** Updatable transaction fields
- **Response:** Updated transaction
- **Audit:** Log changes
- **Response Codes:** 200, 400, 404

#### `DELETE /api/financial/transactions/[id]` - Delete Transaction
- **Authentication:** Required (admin)
- **Authorization:** Only before reconciliation
- **Response:** Success message
- **Audit:** Log deletion
- **Response Codes:** 200, 403, 404

#### `GET /api/financial/registrations` - Get Registration Financials
- **Authentication:** Required (admin)
- **Query Parameters:**
  - `eventId`, `clubId`, `riderId` - filters
  - `paymentStatus`, `approvalStatus` - status
- **Response:** Aggregated financial data by registration
- **Response Codes:** 200, 401

### Data Models

#### Transaction Model
```prisma
model Transaction {
  id              String        @id @default(cuid())
  eId             String        @unique @default(cuid())
  registrationId  String
  amount          Float
  gstAmount       Float         @default(0)
  cgstAmount      Float         @default(0)
  sgstAmount      Float         @default(0)
  igstAmount      Float         @default(0)
  totalAmount     Float
  transactionDate DateTime      @default(now())
  status          PaymentStatus @default(UNPAID)
  paymentMethod   String?
  referenceNumber String?
  notes           String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  registration Registration @relation("RegistrationTransactions", fields: [registrationId], references: [id], onDelete: Cascade)

  @@index([registrationId])
  @@index([status])
  @@index([transactionDate])
}
```

### Key Features
- **Multi-Type GST:** Separate CGST, SGST, IGST tracking
- **Financial Aggregation:** Revenue by event, club, period
- **Payment Synchronization:** Updates registration status
- **Detailed Reporting:** Period-based financial summaries
- **Reference Tracking:** Payment method and reference numbers
- **Audit Trail:** All financial changes logged
- **Soft Deletes:** Can't delete reconciled transactions

### User Flows

#### View Financial Dashboard Flow
1. Admin navigates to Financial Dashboard
2. Views total revenue and GST collected
3. Sees payment status breakdown
4. Filters by date range or event
5. Exports financial report
6. Shares with finance team

#### Record Payment Flow
1. Admin receives payment from rider
2. Navigates to "Record Transaction"
3. Selects registration
4. Enters payment amount and GST breakdown
5. Enters payment reference and method
6. Saves transaction
7. Registration payment status updates automatically

### Related Modules
- Registrations (payment tracking)
- Events (revenue by event)
- Clubs (revenue by club)
- Audit (change logging)

---

## 9. ADMIN & APPROVALS

### Overview
Administrative functions for user approval and account management workflows.

### Purpose
- Approve new user registrations
- Manage pending account activations
- Review user credentials before activation
- Control user lifecycle

### Frontend Pages

#### `admin/approvals.tsx` - User Approvals Queue
- **Purpose:** Review and approve pending users
- **Features:**
  - List of pending user approvals
  - User information display
  - View uploaded credentials/documents
  - Approve button
  - Reject button with notes
  - Bulk approve capability
  - Search and filter
- **User Type:** Admin (super admin)
- **Destination Route:** `/admin/approvals`

### Backend APIs

#### `POST /api/admin/approve-user` - Approve/Reject User
- **Authentication:** Required (admin)
- **Request Body:**
  ```json
  {
    "userId": "user_id",
    "isApproved": true,
    "approvalNotes": "Credentials verified"
  }
  ```
- **Response:** Updated user with `isApproved: true/false`
- **Email:** Send approval/rejection notification
- **Workflow:**
  - If approved: User can now access system (if profile complete)
  - If rejected: Cannot login, receives rejection details
- **Audit:** Log approval decision
- **Response Codes:** 200, 404, 400

### Key Features
- **Approval Workflow:** Two-phase account activation (signup + approval)
- **Bulk Operations:** Approve multiple users at once
- **Notification Integration:** Automatic emails to users
- **Audit Trail:** Track approval decisions and notes
- **Rejection Tracking:** Reason documentation

### User Flows

#### Approve New User Flow
1. New user signs up
2. Admin navigates to Approvals queue
3. Reviews user profile and documents
4. Checks for duplicate accounts
5. Clicks "Approve"
6. User receives approval email
7. User can login and complete profile

#### Reject User Flow
1. Admin reviews pending user
2. Identifies incomplete credentials
3. Clicks "Reject"
4. Enters rejection reason
5. System sends rejection email to user
6. User can sign up again with corrections

### Related Modules
- Users (approval status)
- Notifications (approval emails)
- Audit (approval tracking)

---

## 10. DASHBOARD & ANALYTICS

### Overview
Personalized dashboards and analytics for different user roles.

### Purpose
- Display role-specific information
- Show key metrics and statistics
- Provide quick access to important functions
- Track system health and usage

### Frontend Pages

#### `dashboard.tsx` - Main Dashboard
- **Purpose:** Central hub with role-based information
- **Features:**
  - Welcome message with user name
  - Role-specific sections:
    - **Admin:** Events, registrations, payments, approvals pending
    - **Organizer:** Event stats, registrations, revenue
    - **Rider:** My events, my registrations, my horses
  - Quick action buttons (create event, register, etc.)
  - Pending approvals count (admin)
  - Upcoming events (rider)
  - Recent activity widget
- **User Type:** All authenticated users
- **Destination Route:** `/dashboard`

#### `rider-portal.tsx` - Rider Portal
- **Purpose:** Rider-specific interface
- **Features:**
  - My registrations list
  - My horses
  - My clubs
  - Upcoming events I'm registered for
  - Payment status of registrations
  - My notifications
  - Profile management link
- **User Type:** Riders
- **Destination Route:** `/rider-portal`

#### `pending-approval.tsx` - Pending Approval Notice
- **Purpose:** Show approval status to users
- **Features:**
  - Status message ("Your account is pending approval")
  - Can still complete profile
  - Can see approval estimated timeline
  - Link to contact admin
  - Can logout
- **User Type:** Users with incomplete profiles or pending approval
- **Destination Route:** `/pending-approval`

### Backend APIs

#### `GET /api/dashboard` - Get Dashboard Data
- **Authentication:** Required
- **Response:** Role-based dashboard data
- **Response Format:**
  ```json
  {
    "user": { ... },
    "stats": {
      "pendingApprovals": 5,  // admin only
      "recentTransactions": 15000,
      "upcomingEvents": 3
    },
    "recentActivity": [...],
    "quickActions": [...]
  }
  ```
- **Response Codes:** 200, 401

#### `GET /api/dashboard/events` - Get Dashboard Events
- **Authentication:** Required
- **Response:** Upcoming/recent events based on role
- **Query Parameters:** `limit`, `role`
- **Response Codes:** 200, 401

#### `GET /api/dashboard/participants` - Get Participant Stats
- **Authentication:** Required (admin)
- **Response:**
  ```json
  {
    "activeRiders": 150,
    "activeHorses": 200,
    "pendingApprovals": 5,
    "totalEvents": 25
  }
  ```
- **Response Codes:** 200, 401, 403

### Key Features
- **Role-Based Personalization:** Different views for different roles
- **Quick Stats:** Key numbers at a glance
- **Recent Activity:** Last actions taken
- **Pending Notifications:** What needs attention
- **Quick Actions:** One-click access to common tasks

### User Flows

#### Admin Dashboard Flow
1. Admin logs in
2. Sees dashboard with:
   - Pending approvals count
   - Recent events
   - Payment summary
   - Recent registrations
3. Clicks on pending approvals to review
4. Or clicks create event button to add event

#### Rider Dashboard Flow
1. Rider logs in
2. Sees their personalized dashboard:
   - My registrations (upcoming/past)
   - My horses
   - My clubs
   - Upcoming events to register for
3. Can click on event to register
4. Can click on registration to view details

### Related Modules
- Events (dashboard events)
- Registrations (pending registrations)
- Users (user role and status)
- Financial (revenue stats)
- Notifications (notification count)

---

## 11. AUDIT & LOGGING

### Overview
Comprehensive audit trail tracking all system changes for compliance and debugging.

### Purpose
- Track all user actions and data modifications
- Maintain compliance audit requirements
- Debug issues with change history
- Support forensic investigation of discrepancies

### Frontend Pages

#### `audit.tsx` - Audit Logs Viewer
- **Purpose:** View and search audit logs
- **Features:**
  - Audit logs list with pagination
  - Search by user, entity, or action
  - Filter by date range
  - Filter by action type
  - View detailed changes (before/after)
  - IP address tracking
  - User agent information
  - Export logs to CSV
- **User Type:** Admin (super admin)
- **Destination Route:** `/audit`

### Backend APIs

#### `GET /api/audit` - Get Audit Logs
- **Authentication:** Required (admin)
- **Query Parameters:**
  - `skip`, `take` - pagination
  - `userId` - user who made change
  - `entity` - type of entity changed (Event, User, Registration, etc.)
  - `entityId` - specific record changed
  - `action` - type of action (Created, Updated, Deleted)
  - `startDate`, `endDate` - date range
- **Response:**
  ```json
  {
    "logs": [
      {
        "id": "log_id",
        "userId": "user_id",
        "user": { "email": "admin@example.com", "name": "John Doe" },
        "action": "Updated",
        "entity": "Event",
        "entityId": "event_id",
        "oldValues": { "isPublished": false },
        "newValues": { "isPublished": true },
        "changes": ["isPublished"],
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "2026-03-31T10:00:00Z"
      }
    ],
    "total": 1523
  }
  ```
- **Response Codes:** 200, 401, 403

### Data Models

#### AuditLog Model
```prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  action    String   // Created, Updated, Deleted, Approved, etc.
  entity    String   // Event, Rider, Horse, Registration, User, etc.
  entityId  String
  oldValues Json?    // Previous values before change
  newValues Json?    // New values after change
  changes   String[] @default([]) // Array of changed field names
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([entity])
  @@index([entityId])
  @@index([createdAt])
}
```

### Key Features
- **Automatic Tracking:** All changes logged automatically
- **User Context:** Track who made each change
- **Before/After Values:** Full change visibility
- **IP & User Agent:** Track session info
- **Entity Tracking:** Link to specific records
- **Searchable:** Multiple filtering options
- **Immutable:** Audit logs cannot be deleted

### User Flows

#### Investigate User Change Flow
1. Admin notices unexpected data change
2. Navigates to Audit logs
3. Searches by entity (e.g., Event, Registration)
4. Finds the specific record
5. Sees who made the change and when
6. Views before/after values
7. Checks IP address and user agent

#### Compliance Export Flow
1. Admin needs audit report for compliance
2. Navigates to Audit section
3. Filters by date range
4. Selects specific entity types
5. Clicks "Export to CSV"
6. Downloads audit report
7. Shares with compliance team

### Related Modules
- All modules (all changes are logged)
- Users (who made the change)

---

## 12. NOTIFICATIONS

### Overview
System for sending notifications to users about registrations, approvals, and system events.

### Purpose
- Notify users of important events
- Send approval/rejection notifications
- Alert about payment due dates
- Communication channel to users

### Frontend Pages

#### `notifications/index.tsx` - Notifications Center
- **Purpose:** View user notifications
- **Features:**
  - Paginated list of notifications
  - Mark as read/unread
  - Delete notifications
  - Filter by type or read status
  - Click to navigate to related entity
  - Notification badge with count
- **User Type:** All authenticated users
- **Destination Route:** `/notifications`

### Backend APIs

#### `GET /api/notifications` - Get User Notifications
- **Authentication:** Required
- **Authorization:** Self or admin
- **Query Parameters:**
  - `skip`, `take` - pagination
  - `type` - filter by notification type
  - `isRead` - read/unread filter
  - `userId` - for admin viewing another user's notifications
- **Response:** Paginated notifications
- **Response Codes:** 200, 401, 403

#### `PUT /api/notifications/[id]/read` - Mark as Read
- **Authentication:** Required
- **Response:** Updated notification
- **Response Codes:** 200, 404

#### `DELETE /api/notifications/[id]` - Delete Notification
- **Authentication:** Required
- **Response:** Success message
- **Response Codes:** 200, 404

#### `POST /api/notifications/send-email` - Send Email Notification
- **Authentication:** Required (admin or system)
- **Request Body:**
  ```json
  {
    "userId": "user_id",
    "type": "REGISTRATION_APPROVED",
    "title": "Registration Approved",
    "message": "Your registration for Spring Show has been approved",
    "link": "/registrations/reg_id"
  }
  ```
- **Response:** Success message
- **Email:** Sends actual email to user
- **Database:** Creates notification record
- **Response Codes:** 200, 400

### Data Models

#### Notification Model
```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String   // REGISTRATION_APPROVED, REGISTRATION_REJECTED, PAYMENT_RECEIVED, EVENT_UPDATE, SYSTEM
  title     String
  message   String
  link      String?  // Link to related entity
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
}
```

### Notification Types
- **REGISTRATION_APPROVED:** Registration approved notification
- **REGISTRATION_REJECTED:** Registration rejected with reason
- **PAYMENT_RECEIVED:** Payment received acknowledgment
- **PAYMENT_DUE:** Payment due reminder
- **EVENT_UPDATE:** Event details updated
- **EVENT_CANCELLED:** Event cancelled notification
- **SYSTEM:** General system messages

### Key Features
- **Multi-Channel:** Database + Email delivery
- **Link Integration:** Notifications link to related entities
- **Read Status:** Track read/unread notifications
- **Type Categorization:** Filter by notification type
- **User-Specific:** Notifications linked to user
- **Email Integration:** Actual email sent with notification

### User Flows

#### Receive Registration Approval Flow
1. Admin approves registration
2. System creates notification
3. System sends email to rider
4. Rider sees notification badge on notifications icon
5. Rider clicks on notification
6. Taken to registration details page

#### Check Notifications Flow
1. User clicks notifications icon
2. Sees list of unread notifications
3. Clicks on notification to read
4. Notification marked as read
5. Can click link to view related entity

### Related Modules
- Users (notification recipient)
- Registrations (approval/rejection)
- Financial (payment notifications)
- All modules (event sources)

---

## 13. REPORTS

### Overview
Generate and access system reports for analysis and decision-making.

### Purpose
- Generate event reports
- Financial reports
- Participant reports
- Usage statistics

### Frontend Pages

#### `reports/index.tsx` - Reports Dashboard
- **Purpose:** View and generate reports
- **Features:**
  - Available reports list
  - Date range picker
  - Filter options
  - Generate report button
  - View previous reports
  - Export options (CSV, PDF)
  - Report scheduler option
- **User Type:** Admin, Organizers
- **Destination Route:** `/reports`

### Backend APIs

#### `GET /api/reports` - List Reports
- **Authentication:** Required (admin)
- **Query Parameters:**
  - `type` - event, financial, participant
  - `startDate`, `endDate` - date range
  - `eventId`, `clubId` - filters
- **Response:** Available reports with generated data
- **Response Codes:** 200, 401

### Report Types
- **Event Report:** Registrations, revenue, categories breakdown
- **Financial Report:** Revenue by event/club, GST breakdown, payment status
- **Participant Report:** Rider statistics, horse statistics
- **Usage Report:** System usage metrics

### Related Modules
- Events (event reports)
- Registrations (participation data)
- Financial (revenue data)
- Riders, Horses (participant data)

---

## 14. SETTINGS & CONFIGURATION

### Overview
Manage system-wide settings and configuration parameters.

### Purpose
- Manage event types
- Manage event categories
- Manage venues
- System configuration
- Role management

### Frontend Pages

#### `settings/index.tsx` - Settings Portal
- **Purpose:** Manage all system settings
- **Features:**
  - Settings menu with categories
  - Event types management
  - Event categories management
  - Venues management
  - Role management
  - General system settings
- **User Type:** Admin (super admin)
- **Destination Route:** `/settings`

### Backend APIs

#### `GET /api/settings` - Get Settings
- **Authentication:** Required (admin)
- **Response:** All system settings
- **Response Codes:** 200, 401

#### `PUT /api/settings` - Update Settings
- **Authentication:** Required (admin)
- **Request Body:** Settings object
- **Response:** Updated settings
- **Response Codes:** 200, 400

#### `GET /api/settings/event-types` - Get Event Types
- **Authentication:** Required
- **Response:** Array of all event types
- **Response Codes:** 200, 401

#### `POST /api/settings/event-types` - Create Event Type
- **Authentication:** Required (admin)
- **Request Body:**
  ```json
  {
    "name": "KSEC Show",
    "shortCode": "KSEC",
    "description": "Karatepalli Stud Equestrian Championship"
  }
  ```
- **Response:** Created event type
- **Response Codes:** 201, 409, 400

#### `GET /api/settings/event-categories` - Get Event Categories
- **Authentication:** Required
- **Response:** Array of all event categories
- **Response Codes:** 200, 401

#### `POST /api/settings/event-categories` - Create Event Category
- **Authentication:** Required (admin)
- **Request Body:**
  ```json
  {
    "name": "Novice Jumpers",
    "price": 5000,
    "cgst": 9,
    "sgst": 9,
    "igst": 0
  }
  ```
- **Response:** Created category
- **Response Codes:** 201, 409, 400

#### `GET /api/settings/venue` - Get Venues
- **Authentication:** Required
- **Response:** Array of venues
- **Response Codes:** 200, 401

#### `POST /api/settings/venue` - Create Venue
- **Authentication:** Required (admin)
- **Request Body:**
  ```json
  {
    "name": "Karatepalli Stud",
    "address": "Bangalore, India",
    "isDefault": false
  }
  ```
- **Response:** Created venue
- **Response Codes:** 201, 400

#### `GET /api/settings/roles` - Get Roles
- **Authentication:** Required (admin)
- **Response:** Array of all roles
- **Response Codes:** 200, 401

#### `POST /api/settings/roles` - Create Role
- **Authentication:** Required (admin)
- **Request Body:**
  ```json
  {
    "name": "EventOrganizer",
    "description": "Can create and manage events"
  }
  ```
- **Response:** Created role
- **Response Codes:** 201, 409, 400

### Data Models

#### Settings Model
```prisma
model Settings {
  id          String   @id @default(cuid())
  key         String   @unique
  value       String
  valueType   String   // string, number, boolean, json
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([key])
}
```

### Key Features
- **Centralized Configuration:** All settings in one place
- **Type Safety:** Value types defined and validated
- **Immutable Keys:** Settings keys don't change
- **Version History:** Track setting changes (via audit)
- **Default Values:** System defaults for all settings

### Related Modules
- All modules (use settings for configuration)
- Audit (tracks setting changes)

---

## 15. FILE MANAGEMENT

### Overview
Handle file uploads and serving static files.

### Purpose
- Accept file uploads (event documents, images, etc.)
- Serve uploaded files securely
- Manage file storage

### Backend APIs

#### `POST /api/upload` - Upload File
- **Authentication:** Required
- **Request:** Multipart form data with file
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "fileUrl": "https://storage.../uploads/filename.pdf",
      "fileName": "filename.pdf",
      "size": 1024000
    }
  }
  ```
- **Validation:** File type, size limits
- **Storage:** Server storage or cloud (S3, Azure)
- **Response Codes:** 201, 400, 413 (file too large)

#### `GET /api/uploads/[...path]` - Serve File
- **Authentication:** May require (depends on file type)
- **Response:** File content
- **Security:** Check user permissions before serving
- **Response Codes:** 200, 404, 403

#### `GET /api/health` - Health Check
- **Authentication:** None
- **Response:**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-03-31T10:00:00Z",
    "version": "1.0.0"
  }
  ```
- **Purpose:** System health monitoring
- **Response Codes:** 200

### Key Features
- **File Upload Support:** Images, documents, PDFs
- **Security:** Validation and permission checks
- **Storage Flexibility:** Cloud or local storage
- **Size Limits:** Configurable file size limits
- **File Type Validation:** Only allowed types

### Related Modules
- Users (profile pictures)
- Events (event documents)
- Horses (horse pictures)
- Riders (rider pictures)
- Clubs (club logos)

---

## 16. SHARED COMPONENTS

### Overview
Reusable React components used across the application.

### Components

#### `Layout.tsx` - Main Layout Wrapper
- **Purpose:** Common layout for all pages
- **Features:**
  - Navigation header
  - Sidebar menu
  - User profile dropdown
  - Notification badge
  - Logout button
  - Breadcrumbs
  - Footer (optional)
- **Used By:** All authenticated pages
- **Props:** children, title, breadcrumbs

#### `ActionsDropdown.tsx` - Actions Menu
- **Purpose:** Quick actions for list items
- **Features:**
  - Dropdown menu with actions
  - Edit, delete, view options
  - Bulk actions support
  - Permission-based visibility
- **Used By:** List pages (riders, horses, events, etc.)
- **Props:** item, actions, onAction

#### `AddressMapPicker.tsx` - Address Selection with Map
- **Purpose:** Select addresses with map interface
- **Features:**
  - Google Maps integration
  - Search by address
  - Drag marker to select location
  - Get coordinates (lat/lng)
  - Return address info
- **Used By:** Rider, Horse, User profile pages
- **Props:** onSelect, initialPosition

#### `VenueMapPicker.tsx` - Venue Location Picker
- **Purpose:** Select event venue locations
- **Features:**
  - Similar to AddressMapPicker
  - Venue-specific features
  - Venue information pre-fill
- **Used By:** Event creation pages
- **Props:** onSelect, venues

#### `MapInner.tsx` - Map Rendering
- **Purpose:** Internal map component
- **Features:**
  - Initializes map
  - Handles markers
  - Manages interactions
- **Used By:** AddressMapPicker, VenueMapPicker
- **Props:** center, zoom, onLocationSelect

#### `RichTextEditor.tsx` - Rich Text Editor
- **Purpose:** Edit formatted text content
- **Features:**
  - Bold, italic, underline formatting
  - Lists and headings
  - Links support
  - HTML export
  - WYSIWYG editor
- **Used By:** Event creation (terms & conditions), Event description
- **Props:** value, onChange, placeholder

#### `ToastProvider.tsx` - Toast Notifications
- **Purpose:** Global toast notification system
- **Features:**
  - Success, error, info, warning toast types
  - Auto-dismiss
  - Customizable position
  - Stacking support
- **Used By:** Wrap in _app.tsx
- **Methods:** toast.success(), toast.error(), etc.

### Key Features
- **Reusability:** Used across multiple pages
- **Consistency:** Unified UI/UX
- **Customization:** Props for flexibility
- **Accessibility:** WCAG compliant
- **Responsive:** Mobile-friendly

### Related Modules
- All frontend pages (use these components)

---

## 17. CORE APPLICATION PAGES

### Overview
Core Next.js pages and setup files.

### Pages

#### `_app.tsx` - Next.js App Wrapper
- **Purpose:** Root application component
- **Features:**
  - Global CSS imports
  - ToastProvider setup
  - Protected routes wrapper
  - Global state management (context/redux)
  - Authentication state persistence
  - Error boundaries
- **Used By:** All pages
- **Route:** N/A

#### `_document.tsx` - HTML Document Template
- **Purpose:** Custom HTML document
- **Features:**
  - Meta tags
  - Global fonts
  - Font awesome integration (if used)
  - Theme configuration
  - Tailwind CSS setup
- **Used By:** All pages
- **Route:** N/A

#### `index.tsx` - Home Page
- **Purpose:** Landing page
- **Features:**
  - Welcome message
  - Sign up / Login buttons (if not authenticated)
  - Dashboard link (if authenticated)
  - Feature overview
- **User Type:** Public (both authenticated and unauthenticated)
- **Route:** `/`

### Key Features
- **Next.js Integration:** Server-side rendering support
- **Global Setup:** App-wide configuration
- **Performance:** CSS-in-JS optimization
- **SEO:** Meta tags and document setup

---

## 18. UTILITY APIS

### Overview
Utility endpoints for system health and status.

### APIs

#### `GET /api/health` - Health Check
- **Authentication:** None
- **Purpose:** Monitor system availability
- **Response:**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-03-31T10:00:00Z",
    "version": "1.0.0",
    "database": "connected"
  }
  ```
- **Response Codes:** 200 (healthy), 503 (unhealthy)
- **Used By:** Monitoring services, uptime checkers

### Key Features
- **No Authentication:** Available to all clients
- **Quick Response:** Minimal processing
- **Status Information:** Basic system health

---

## SYSTEM ARCHITECTURE OVERVIEW

### Frontend Architecture
```
Pages (37 total)
├── Authentication (Login/Signup/Account)
├── Clubs Management
├── Riders Management
├── Horses Management
├── Events Management
├── Registrations Management
├── Financial Tracking
├── Admin Tools
├── Reports & Audit
├── User Settings
├── Notifications
└── Dashboard & Portals

Components (7 reusable)
├── Layout
├── Map Pickers
├── Rich Text Editor
├── Action Dropdowns
└── Toast Provider
```

### Backend Architecture
```
API Routes (51 total)
├── Authentication (3)
├── Users & Permissions (8)
├── Clubs (4)
├── Riders (3)
├── Horses (3)
├── Events (8)
├── Registrations (5)
├── Stables (2)
├── Financial (4)
├── Admin Tools (1)
├── Dashboard (3)
├── Audit (1)
├── Notifications (2)
├── Reports (1)
├── Settings (5)
├── File Upload (2)
└── Utilities (1)
```

### Database Models (17 total)
```
Authentication
├── User
├── Role
└── Permission

Business Domain
├── Event
├── EventCategory
├── EventType
├── Club
├── Rider
└── Horse

Registrations
├── Registration
├── Venue
├── Stable
└── StableBooking

Financial
└── Transaction

Operations
├── AuditLog
├── Notification
└── Settings
```

### Key Relationships
- **User Management:** Central to system, linked to roles and permissions
- **Event Lifecycle:** Event → Categories → Registrations → Payments
- **Participant Hierarchy:** User/Rider → Horses → Registrations
- **Club Structure:** Club → Riders/Horses → Registrations
- **Financial Tracking:** Registration → Transactions → Revenue Reports

---

## DEPLOYMENT & INFRASTRUCTURE

### Technology Stack
- **Frontend:** Next.js 14+, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, TypeScript
- **Database:** PostgreSQL (via Prisma ORM)
- **Authentication:** JWT tokens with Google OAuth2
- **File Storage:** Cloud storage (S3/Azure) or local
- **Email:** SMTP or service provider
- **Monitoring:** Health check endpoint

### Environment Variables Required
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_API_URL=...
AWS_S3_BUCKET=... (if using S3)
SMTP_USERNAME=...
SMTP_PASSWORD=...
```

### Scaling Considerations
- Database indexing on frequently queried fields
- API rate limiting for registration endpoints
- File storage optimization
- Session management for concurrent users
- Audit log archival strategy

---

## SECURITY CONSIDERATIONS

### Key Security Measures
- **Password Security:** Bcrypt hashing with salt
- **JWT Tokens:** Secure token generation and validation
- **Authorization:** Role-based access control (RBAC)
- **Input Validation:** All user inputs validated
- **CORS:** Configured for specific domains
- **SQL Injection Prevention:** Prisma ORM prevents SQL injection
- **Audit Trail:** All changes logged for forensics

### Data Privacy
- Personal data (PII) identification
- GDPR compliance considerations
- Data retention policies
- Soft deletes for audit trail preservation

---

## TESTING STRATEGY

### Unit Tests Required
- Authentication logic (password hashing, token generation)
- Price calculations (registration fees with GST)
- Permission checks
- Input validation

### Integration Tests Required
- Registration workflow (creation → approval → payment)
- Event lifecycle (create → publish → close)
- Payment processing
- Notification sending

### E2E Tests Required
- Complete user registration and login
- Event creation and registration
- Payment processing
- Admin approval workflow

---

## FUTURE ENHANCEMENTS

### Planned Features
- Mobile app (React Native)
- Real-time notifications (WebSockets)
- Advanced reporting (BI integration)
- Multi-language support
- Payment gateway integration (Stripe, PayPal)
- Video upload and streaming
- Resource scheduling (calendar integration)
- Expense tracking

### Scalability Improvements
- Redis caching layer
- API rate limiting
- Background job processing
- Event streaming for audit logs
- Database read replicas

---

**Document End**

Last Updated: March 31, 2026  
Maintained By: Technical Documentation Team  
Version: 1.0.0

