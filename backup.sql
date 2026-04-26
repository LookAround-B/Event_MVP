--
-- PostgreSQL database dump
--

\restrict Wp1hB58jLQildWyDKyfLW3l2quBenciTWGWkjOc5YtgPLJxC1IljiYLafYVx0uL

-- Dumped from database version 18.3 (Ubuntu 18.3-1.pgdg24.04+1)
-- Dumped by pg_dump version 18.3 (Debian 18.3-1.pgdg12+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Approval; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Approval" (
    id text NOT NULL,
    "taskId" text NOT NULL,
    "approverId" text NOT NULL,
    "approverLevel" text NOT NULL,
    status text DEFAULT 'Pending'::text NOT NULL,
    comments text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Attendance" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "checkInTime" timestamp(3) without time zone,
    "checkOutTime" timestamp(3) without time zone,
    status text DEFAULT 'Present'::text NOT NULL,
    remarks text,
    "markedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AttendanceLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AttendanceLog" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "timeIn" timestamp(3) without time zone NOT NULL,
    "timeOut" timestamp(3) without time zone,
    shift text,
    notes text,
    "approvedBy" text,
    "isApproved" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "userId" text NOT NULL,
    action text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    changes text,
    "ipAddress" text,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Employee; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Employee" (
    id text NOT NULL,
    "fullName" text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "phoneNumber" text,
    designation text NOT NULL,
    department text NOT NULL,
    "colorCode" text,
    "profileImage" text,
    "shiftTiming" text,
    "employmentStatus" text DEFAULT 'Active'::text NOT NULL,
    "isApproved" boolean DEFAULT false NOT NULL,
    "supervisorId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: EmployeePermission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EmployeePermission" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "viewDashboard" boolean DEFAULT false NOT NULL,
    "manageEmployees" boolean DEFAULT false NOT NULL,
    "viewReports" boolean DEFAULT false NOT NULL,
    "issueFines" boolean DEFAULT false NOT NULL,
    "manageInventory" boolean DEFAULT false NOT NULL,
    "manageSchedules" boolean DEFAULT false NOT NULL,
    "viewPayroll" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "viewNotifications" boolean DEFAULT false NOT NULL
);


--
-- Name: EmployeeTaskPermission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EmployeeTaskPermission" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    permission text NOT NULL,
    granted boolean NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Expense; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Expense" (
    id text NOT NULL,
    type text NOT NULL,
    amount double precision NOT NULL,
    description text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "createdById" text NOT NULL,
    "horseId" text,
    "employeeId" text,
    attachments text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: FarrierInventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FarrierInventory" (
    id text NOT NULL,
    "itemName" text NOT NULL,
    category text NOT NULL,
    "horseId" text,
    quantity integer DEFAULT 0 NOT NULL,
    "sizeType" text,
    material text,
    condition text,
    "lastUsedDate" timestamp(3) without time zone,
    "farrierId" text,
    "serviceDate" timestamp(3) without time zone,
    "nextServiceDue" timestamp(3) without time zone,
    notes text,
    "replacementCycle" text,
    "costTracking" double precision,
    supplier text,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: FarrierShoeing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FarrierShoeing" (
    id text NOT NULL,
    "horseId" text NOT NULL,
    "farrierId" text NOT NULL,
    "shoeingDate" timestamp(3) without time zone NOT NULL,
    "nextDueDate" timestamp(3) without time zone NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "numberOfLegs" integer DEFAULT 4 NOT NULL,
    "shoeChanged" boolean DEFAULT true NOT NULL
);


--
-- Name: FeedInventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FeedInventory" (
    id text NOT NULL,
    "feedType" text NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    "unitsBrought" double precision DEFAULT 0 NOT NULL,
    "openingStock" double precision DEFAULT 0 NOT NULL,
    "totalUsed" double precision DEFAULT 0 NOT NULL,
    "unitsLeft" double precision DEFAULT 0 NOT NULL,
    unit text DEFAULT 'kg'::text NOT NULL,
    notes text,
    "recordedById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "notifyAdmin" boolean DEFAULT false NOT NULL,
    threshold double precision
);


--
-- Name: Fine; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Fine" (
    id text NOT NULL,
    "issuedById" text NOT NULL,
    "issuedToId" text NOT NULL,
    reason text NOT NULL,
    "evidenceImage" text NOT NULL,
    status text DEFAULT 'Open'::text NOT NULL,
    "resolvedById" text,
    "resolutionNotes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    amount double precision
);


--
-- Name: GateAttendanceLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GateAttendanceLog" (
    id text NOT NULL,
    "guardId" text NOT NULL,
    "personName" text NOT NULL,
    "personType" text NOT NULL,
    "entryTime" timestamp(3) without time zone NOT NULL,
    "exitTime" timestamp(3) without time zone,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: GateEntry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GateEntry" (
    id text NOT NULL,
    "guardId" text NOT NULL,
    "personType" text NOT NULL,
    "employeeId" text,
    "visitorId" text,
    "vehicleNo" text,
    "entryTime" timestamp(3) without time zone NOT NULL,
    "exitTime" timestamp(3) without time zone,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: GrassBeddingEntry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GrassBeddingEntry" (
    id text NOT NULL,
    "horseId" text,
    "entryType" text DEFAULT 'Grass'::text NOT NULL,
    "supplyName" text,
    "collectedById" text,
    "collectedAt" timestamp(3) without time zone,
    notes text,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "grassLoadReceived" boolean,
    "weightInTons" integer
);


--
-- Name: GroceriesInventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GroceriesInventory" (
    id text NOT NULL,
    name text NOT NULL,
    quantity double precision NOT NULL,
    unit text DEFAULT 'kg'::text NOT NULL,
    price double precision DEFAULT 0 NOT NULL,
    "totalPrice" double precision DEFAULT 0 NOT NULL,
    description text,
    "employeeId" text,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "purchaseDate" timestamp(3) without time zone,
    "expiryDate" timestamp(3) without time zone,
    "notifyAdmin" boolean DEFAULT false NOT NULL,
    threshold double precision
);


--
-- Name: GroomWorkSheet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GroomWorkSheet" (
    id text NOT NULL,
    "groomId" text,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "totalAM" double precision DEFAULT 0 NOT NULL,
    "totalPM" double precision DEFAULT 0 NOT NULL,
    "wholeDayHours" double precision DEFAULT 0 NOT NULL,
    "woodchipsUsed" double precision DEFAULT 0 NOT NULL,
    "bichaliUsed" double precision DEFAULT 0 NOT NULL,
    "booSaUsed" integer DEFAULT 0 NOT NULL,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: HealthRecord; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."HealthRecord" (
    id text NOT NULL,
    "horseId" text NOT NULL,
    "healthAdvisorId" text,
    "recordType" text NOT NULL,
    description text,
    date timestamp(3) without time zone NOT NULL,
    "nextDueDate" timestamp(3) without time zone,
    documents text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Horse; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Horse" (
    id text NOT NULL,
    name text NOT NULL,
    gender text NOT NULL,
    "dateOfBirth" timestamp(3) without time zone NOT NULL,
    breed text,
    color text,
    height double precision,
    age integer,
    location text,
    "stableNumber" text,
    "profileImage" text,
    status text DEFAULT 'Active'::text NOT NULL,
    discipline text,
    "trainingLevel" text,
    "workloadLimit" text,
    "girthSize" text,
    "bitSize" text,
    "rugSize" text,
    "bridleSize" text,
    "numnahSize" text,
    ueln text,
    "microchipNumber" text,
    "feiId" text,
    "feiIdExpiry" timestamp(3) without time zone,
    "passportDetails" text,
    sire text,
    damsire text,
    "ownerName" text,
    "ownerContact" text,
    "leaseStatus" text,
    "emergencyContact" text,
    "insuranceDetails" text,
    "supervisorId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "passportNumber" text,
    "horseEntryType" text DEFAULT 'Normal'::text NOT NULL,
    "privateDiagnosisNotes" text,
    "privateEntryAt" timestamp(3) without time zone,
    "privateExitAt" timestamp(3) without time zone
);


--
-- Name: HorseCareTeam; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."HorseCareTeam" (
    id text NOT NULL,
    "horseId" text NOT NULL,
    "staffId" text NOT NULL,
    role text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "assignedDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: HorseFeed; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."HorseFeed" (
    id text NOT NULL,
    "recordedById" text NOT NULL,
    "horseId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    balance double precision,
    barley double precision,
    oats double precision,
    soya double precision,
    lucerne double precision,
    linseed double precision,
    epsom double precision,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "menuCompletionNotifiedAt" timestamp(3) without time zone,
    "menuEndAt" timestamp(3) without time zone,
    "menuStartAt" timestamp(3) without time zone,
    "temporaryMenuName" text,
    bran double precision,
    dcp double precision,
    "diggyMax" double precision,
    electrolyte double precision,
    growth double precision,
    heylage double precision,
    "riceBranOil" double precision,
    salt double precision,
    sports double precision
);


--
-- Name: HousekeepingInventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."HousekeepingInventory" (
    id text NOT NULL,
    "itemName" text NOT NULL,
    category text NOT NULL,
    quantity double precision DEFAULT 0 NOT NULL,
    "unitType" text DEFAULT 'pcs'::text NOT NULL,
    "minimumStockLevel" double precision,
    "reorderAlert" boolean DEFAULT false NOT NULL,
    "storageLocation" text,
    "supplierName" text,
    "purchaseDate" timestamp(3) without time zone,
    "expiryDate" timestamp(3) without time zone,
    "usageArea" text,
    "consumptionRate" text,
    "lastRestockedDate" timestamp(3) without time zone,
    "assignedStaffId" text,
    "costPerUnit" double precision,
    notes text,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: InspectionRound; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."InspectionRound" (
    id text NOT NULL,
    "jamedarId" text NOT NULL,
    round text NOT NULL,
    description text NOT NULL,
    "horseId" text,
    location text NOT NULL,
    "severityLevel" text NOT NULL,
    comments text,
    status text DEFAULT 'Open'::text NOT NULL,
    "resolvedById" text,
    "resolutionNotes" text,
    "resolvedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    area text,
    images text[]
);


--
-- Name: InstructorDailyWorkRecord; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."InstructorDailyWorkRecord" (
    id text NOT NULL,
    "instructorId" text NOT NULL,
    "horseId" text NOT NULL,
    "riderId" text,
    "workType" text NOT NULL,
    duration integer NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: InstructorIncentive; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."InstructorIncentive" (
    id text NOT NULL,
    "instructorId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    amount double precision NOT NULL,
    "paymentMode" text NOT NULL,
    description text,
    "bookingId" text,
    "lessonCount" integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'Pending'::text NOT NULL,
    "approvedById" text,
    "paidAt" timestamp(3) without time zone,
    notes text,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: JamedarRoundCheck; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."JamedarRoundCheck" (
    id text NOT NULL,
    "jamedarId" text NOT NULL,
    "checkDate" timestamp(3) without time zone NOT NULL,
    "morningCompleted" boolean DEFAULT false NOT NULL,
    "afternoonCompleted" boolean DEFAULT false NOT NULL,
    "eveningCompleted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: MedicineInventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MedicineInventory" (
    id text NOT NULL,
    "medicineType" text NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    "unitsPurchased" double precision DEFAULT 0 NOT NULL,
    "openingStock" double precision DEFAULT 0 NOT NULL,
    "totalUsed" double precision DEFAULT 0 NOT NULL,
    "unitsLeft" double precision DEFAULT 0 NOT NULL,
    unit text DEFAULT 'ml'::text NOT NULL,
    notes text,
    "recordedById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "notifyAdmin" boolean DEFAULT false NOT NULL,
    threshold double precision
);


--
-- Name: MedicineLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MedicineLog" (
    id text NOT NULL,
    "jamiedarId" text NOT NULL,
    "horseId" text NOT NULL,
    "medicineName" text NOT NULL,
    "timeAdministered" timestamp(3) without time zone NOT NULL,
    notes text,
    "photoUrl" text,
    "stockAlert" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "approvalDate" timestamp(3) without time zone,
    "approvalStatus" text DEFAULT 'pending'::text NOT NULL,
    "approvedById" text,
    "rejectionReason" text,
    unit text DEFAULT 'ml'::text NOT NULL,
    quantity double precision NOT NULL,
    diagnosis text
);


--
-- Name: Meeting; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Meeting" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "meetingDate" timestamp(3) without time zone NOT NULL,
    "meetingTime" text,
    location text,
    "createdById" text NOT NULL,
    status text DEFAULT 'Scheduled'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: MeetingMOM; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MeetingMOM" (
    id text NOT NULL,
    "meetingId" text NOT NULL,
    "pointsDiscussed" text,
    "memberInputs" text,
    decisions text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: MeetingParticipant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MeetingParticipant" (
    id text NOT NULL,
    "meetingId" text NOT NULL,
    "employeeId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "relatedTaskId" text,
    "relatedApprovalId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "readAt" timestamp(3) without time zone
);


--
-- Name: Report; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Report" (
    id text NOT NULL,
    "reportedEmployeeId" text NOT NULL,
    "reporterEmployeeId" text NOT NULL,
    reason text NOT NULL,
    category text,
    "taskId" text,
    status text DEFAULT 'Pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SystemSettings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SystemSettings" (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    description text,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: TackInventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TackInventory" (
    id text NOT NULL,
    "itemName" text NOT NULL,
    category text NOT NULL,
    "horseId" text,
    "riderId" text,
    quantity integer DEFAULT 1 NOT NULL,
    condition text DEFAULT 'Good'::text NOT NULL,
    brand text,
    size text,
    material text,
    "purchaseDate" timestamp(3) without time zone,
    "lastUsedDate" timestamp(3) without time zone,
    "maintenanceRequired" boolean DEFAULT false NOT NULL,
    notes text,
    "cleaningSchedule" text,
    "repairHistory" text,
    "storageLocation" text,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "unitNumber" text
);


--
-- Name: Task; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Task" (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'Pending'::text NOT NULL,
    "horseId" text,
    "assignedEmployeeId" text NOT NULL,
    "createdById" text NOT NULL,
    "scheduledTime" timestamp(3) without time zone NOT NULL,
    "completedTime" timestamp(3) without time zone,
    "submittedAt" timestamp(3) without time zone,
    priority text DEFAULT 'Medium'::text NOT NULL,
    "requiredProof" boolean DEFAULT false NOT NULL,
    "proofImage" text,
    "completionNotes" text,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "accommodationCheckIn" timestamp(3) without time zone,
    "accommodationCheckOut" timestamp(3) without time zone,
    "bookingCategory" text,
    "bookingDestination" text,
    "bookingRideType" text,
    "bookingSlot" text,
    "customerName" text,
    "customerPhone" text,
    "gstAmount" double precision,
    "instructorId" text,
    "isMembershipBooking" boolean DEFAULT false NOT NULL,
    "leadPrice" double precision,
    "packageMemberCount" integer,
    "packageName" text,
    "packagePrice" double precision,
    "packageRideCount" integer,
    "paymentSource" text,
    "leadGroomName" text,
    "isPaid" boolean DEFAULT false NOT NULL,
    "totalRoomPrice" double precision
);


--
-- Name: Visitor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Visitor" (
    id text NOT NULL,
    name text NOT NULL,
    purpose text NOT NULL,
    "contactNumber" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: VisitorLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VisitorLog" (
    id text NOT NULL,
    "visitorName" text NOT NULL,
    purpose text NOT NULL,
    "checkInTime" timestamp(3) without time zone NOT NULL,
    "checkOutTime" timestamp(3) without time zone,
    "contactPerson" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: WorkRecord; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WorkRecord" (
    id text NOT NULL,
    "staffId" text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    category text NOT NULL,
    "totalAM" double precision DEFAULT 0 NOT NULL,
    "totalPM" do