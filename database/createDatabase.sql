USE master;
GO

IF DB_ID('HawkerDB') IS NOT NULL
BEGIN
    ALTER DATABASE HawkerDB
    SET SINGLE_USER
    WITH ROLLBACK IMMEDIATE;

    DROP DATABASE HawkerDB;
END;
GO

CREATE DATABASE HawkerDB;
GO

USE HawkerDB;
GO


-- =========================
-- Users
-- =========================
CREATE TABLE Users (
    userId INT IDENTITY(1,1) PRIMARY KEY,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,

    -- Increased from VARCHAR(8) to support formatted phone numbers.
    phone VARCHAR(20) NULL,

    passwordHash VARCHAR(255) NOT NULL,

    -- Added nea_officer for the inspection feature.
    role VARCHAR(20) NOT NULL
    CHECK (
        role IN (
            'customer',
            'vendor',
            'nea_officer',
            'rider'
        )
    ),

    createdAt DATETIME DEFAULT GETDATE()
);
GO


-- =========================
-- Customers
-- =========================
CREATE TABLE Customers (
    customerId INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NULL,
    customerName VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,

    FOREIGN KEY (userId)
        REFERENCES Users(userId)
);
GO


-- =========================
-- Stalls
-- =========================
CREATE TABLE Stalls (
    stallId INT PRIMARY KEY,
    ownerId INT NULL,
    stallName VARCHAR(100) NOT NULL,
    cuisine VARCHAR(50),
    hawkerCentre VARCHAR(100),

    -- Added for rental agreements.
    stallNumber VARCHAR(30) NULL,

    address VARCHAR(255),
    ownerName VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    description VARCHAR(500),
    established INT,

    -- Kept for compatibility with the existing frontend.
    -- InspectionRecords stores the full inspection history.
    hygieneGrade CHAR(1),

    rating DECIMAL(2,1),

    totalReviews INT NOT NULL
        DEFAULT 0,

    deliveryAvailable BIT NOT NULL
        DEFAULT 0,

    pickupAvailable BIT NOT NULL
        DEFAULT 1,

    monday VARCHAR(50),
    tuesday VARCHAR(50),
    wednesday VARCHAR(50),
    thursday VARCHAR(50),
    friday VARCHAR(50),
    saturday VARCHAR(50),
    sunday VARCHAR(50),

    FOREIGN KEY (ownerId)
        REFERENCES Users(userId),

    CONSTRAINT CK_Stalls_HygieneGrade
        CHECK (
            hygieneGrade IS NULL
            OR hygieneGrade IN ('A', 'B', 'C', 'D')
        ),

    CONSTRAINT CK_Stalls_Rating
        CHECK (
            rating IS NULL
            OR rating BETWEEN 0 AND 5
        ),

    CONSTRAINT CK_Stalls_TotalReviews
        CHECK (totalReviews >= 0)
);
GO


-- =========================
-- Menu Items
-- =========================
CREATE TABLE MenuItems (
    menuItemId INT IDENTITY(1,1) PRIMARY KEY,
    stallId INT NOT NULL,
    stallName VARCHAR(100),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    description VARCHAR(500),

    -- Increased from DECIMAL(6,2).
    price DECIMAL(8,2) NOT NULL,

    prepTime INT,

    availability CHAR(1) NOT NULL
        CHECK (availability IN ('Y', 'N')),

    image VARCHAR(255),

    FOREIGN KEY (stallId)
        REFERENCES Stalls(stallId),

    CONSTRAINT CK_MenuItems_Price
        CHECK (price >= 0),

    CONSTRAINT CK_MenuItems_PrepTime
        CHECK (
            prepTime IS NULL
            OR prepTime >= 0
        )
);
GO


-- =========================
-- Orders
-- =========================
CREATE TABLE Orders (
    orderId INT IDENTITY(1,1) PRIMARY KEY,
    customerId INT NOT NULL,
    stallId INT NOT NULL,

    totalAmount DECIMAL(10,2) NOT NULL,

    paymentStatus VARCHAR(20) NOT NULL
        DEFAULT 'Paid',

    orderStatus VARCHAR(20) NOT NULL
        DEFAULT 'Completed',

    orderDate DATETIME NOT NULL
        DEFAULT GETDATE(),

    FOREIGN KEY (customerId)
        REFERENCES Customers(customerId),

    FOREIGN KEY (stallId)
        REFERENCES Stalls(stallId),

    CONSTRAINT CK_Orders_TotalAmount
        CHECK (totalAmount >= 0)
);
GO

-- =========================
-- Deliveries
-- Added for delivery status, rider location and ETA tracking.
-- =========================
CREATE TABLE Deliveries (
    deliveryId INT IDENTITY(1,1) PRIMARY KEY,

    -- One delivery record per order.
    orderId INT NOT NULL UNIQUE,

    -- Rider must be a user with the rider role.
    riderId INT NULL,
    riderName VARCHAR(100) NULL,
    riderPhone VARCHAR(20) NULL,

    deliveryAddress VARCHAR(255) NOT NULL,

    destinationLatitude DECIMAL(10,7) NULL,
    destinationLongitude DECIMAL(10,7) NULL,

    currentLatitude DECIMAL(10,7) NULL,
    currentLongitude DECIMAL(10,7) NULL,

    deliveryStatus VARCHAR(30) NOT NULL
        DEFAULT 'Order Confirmed',

    estimatedArrivalMinutes INT NULL,
    remainingDistanceMetres INT NULL,

    assignedAt DATETIME NULL,
    pickedUpAt DATETIME NULL,
    deliveredAt DATETIME NULL,

    createdAt DATETIME NOT NULL
        DEFAULT GETDATE(),

    updatedAt DATETIME NOT NULL
        DEFAULT GETDATE(),

    CONSTRAINT FK_Deliveries_Orders
        FOREIGN KEY (orderId)
        REFERENCES Orders(orderId),

    CONSTRAINT FK_Deliveries_Riders
        FOREIGN KEY (riderId)
        REFERENCES Users(userId),

    CONSTRAINT CK_Deliveries_Status
        CHECK (
            deliveryStatus IN (
                'Order Confirmed',
                'Preparing',
                'Ready for Delivery',
                'Rider Assigned',
                'Out for Delivery',
                'Delivered',
                'Cancelled'
            )
        ),

    CONSTRAINT CK_Deliveries_EstimatedArrival
        CHECK (
            estimatedArrivalMinutes IS NULL
            OR estimatedArrivalMinutes >= 0
        ),

    CONSTRAINT CK_Deliveries_RemainingDistance
        CHECK (
            remainingDistanceMetres IS NULL
            OR remainingDistanceMetres >= 0
        ),

    CONSTRAINT CK_Deliveries_DestinationLatitude
        CHECK (
            destinationLatitude IS NULL
            OR destinationLatitude BETWEEN -90 AND 90
        ),

    CONSTRAINT CK_Deliveries_DestinationLongitude
        CHECK (
            destinationLongitude IS NULL
            OR destinationLongitude BETWEEN -180 AND 180
        ),

    CONSTRAINT CK_Deliveries_CurrentLatitude
        CHECK (
            currentLatitude IS NULL
            OR currentLatitude BETWEEN -90 AND 90
        ),

    CONSTRAINT CK_Deliveries_CurrentLongitude
        CHECK (
            currentLongitude IS NULL
            OR currentLongitude BETWEEN -180 AND 180
        )
);
GO


-- =========================
-- Delivery Status History
-- Stores every delivery status change for the tracking timeline.
-- =========================
CREATE TABLE DeliveryStatusHistory (
    deliveryStatusHistoryId INT IDENTITY(1,1) PRIMARY KEY,

    deliveryId INT NOT NULL,

    deliveryStatus VARCHAR(30) NOT NULL,

    changedByUserId INT NULL,

    changedAt DATETIME NOT NULL
        DEFAULT GETDATE(),

    CONSTRAINT FK_DeliveryStatusHistory_Deliveries
        FOREIGN KEY (deliveryId)
        REFERENCES Deliveries(deliveryId),

    CONSTRAINT FK_DeliveryStatusHistory_Users
        FOREIGN KEY (changedByUserId)
        REFERENCES Users(userId),

    CONSTRAINT CK_DeliveryStatusHistory_Status
        CHECK (
            deliveryStatus IN (
                'Order Confirmed',
                'Preparing',
                'Ready for Delivery',
                'Rider Assigned',
                'Out for Delivery',
                'Delivered',
                'Cancelled'
            )
        )
);
GO

-- =========================
-- Feedback
-- =========================
CREATE TABLE Feedback (
    feedbackId INT IDENTITY(1,1) PRIMARY KEY,
    orderId INT NOT NULL UNIQUE,
    customerId INT NOT NULL,
    stallId INT NOT NULL,

    rating INT NOT NULL
        CHECK (rating BETWEEN 1 AND 5),

    comments VARCHAR(1000),

    createdAt DATETIME NOT NULL
        DEFAULT GETDATE(),

    updatedAt DATETIME NULL,

    FOREIGN KEY (orderId)
        REFERENCES Orders(orderId),

    FOREIGN KEY (customerId)
        REFERENCES Customers(customerId),

    FOREIGN KEY (stallId)
        REFERENCES Stalls(stallId)
);
GO


-- =========================
-- Rental Agreements
-- Added for retrieving, creating and updating rental agreements.
-- =========================
CREATE TABLE RentalAgreements (
    agreementId INT IDENTITY(1,1) PRIMARY KEY,

    stallId INT NOT NULL,
    stallNumber VARCHAR(30) NOT NULL,

    monthlyRent DECIMAL(10,2) NOT NULL,
    stallSizeSqFt INT NOT NULL,

    startDate DATE NOT NULL,
    endDate DATE NOT NULL,

    status VARCHAR(20) NOT NULL
        DEFAULT 'Pending',

    createdAt DATETIME NOT NULL
        DEFAULT GETDATE(),

    updatedAt DATETIME NULL,

    CONSTRAINT FK_RentalAgreements_Stalls
        FOREIGN KEY (stallId)
        REFERENCES Stalls(stallId),

    CONSTRAINT CK_RentalAgreements_MonthlyRent
        CHECK (monthlyRent > 0),

    CONSTRAINT CK_RentalAgreements_StallSize
        CHECK (stallSizeSqFt > 0),

    CONSTRAINT CK_RentalAgreements_Dates
        CHECK (endDate >= startDate),

    CONSTRAINT CK_RentalAgreements_Status
        CHECK (
            status IN (
                'Active',
                'Expired',
                'Terminated',
                'Pending'
            )
        )
);
GO


-- =========================
-- Rental Payments
-- Added for payment history and upcoming payments.
-- =========================
CREATE TABLE RentalPayments (
    paymentId INT IDENTITY(1,1) PRIMARY KEY,

    agreementId INT NOT NULL,

    dueDate DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,

    paymentDate DATE NULL,
    paymentMethod VARCHAR(30) NULL,

    status VARCHAR(20) NOT NULL
        DEFAULT 'Pending',

    createdAt DATETIME NOT NULL
        DEFAULT GETDATE(),

    updatedAt DATETIME NULL,

    CONSTRAINT FK_RentalPayments_Agreements
        FOREIGN KEY (agreementId)
        REFERENCES RentalAgreements(agreementId),

    CONSTRAINT CK_RentalPayments_Amount
        CHECK (amount > 0),

    CONSTRAINT CK_RentalPayments_Status
        CHECK (
            status IN (
                'Pending',
                'Paid',
                'Overdue',
                'Waived',
                'Cancelled'
            )
        ),

    -- Prevents duplicate payment records for the same due date.
    CONSTRAINT UQ_RentalPayments_AgreementDue
        UNIQUE (agreementId, dueDate)
);
GO


-- =========================
-- Inspection Records
-- Added for NEA inspection scores and hygiene-grade history.
-- =========================
CREATE TABLE InspectionRecords (
    inspectionId INT IDENTITY(1,1) PRIMARY KEY,

    stallId INT NOT NULL,
    officerId INT NOT NULL,

    inspectionDate DATE NOT NULL,

    score INT NOT NULL,
    grade CHAR(1) NOT NULL,

    remarks VARCHAR(1000) NULL,

    createdAt DATETIME NOT NULL
        DEFAULT GETDATE(),

    updatedAt DATETIME NULL,

    CONSTRAINT FK_InspectionRecords_Stalls
        FOREIGN KEY (stallId)
        REFERENCES Stalls(stallId),

    CONSTRAINT FK_InspectionRecords_Officers
        FOREIGN KEY (officerId)
        REFERENCES Users(userId),

    CONSTRAINT CK_InspectionRecords_Score
        CHECK (score BETWEEN 0 AND 100),

    CONSTRAINT CK_InspectionRecords_Grade
        CHECK (grade IN ('A', 'B', 'C', 'D'))
);
GO


-- =========================
-- Indexes
-- Added to improve commonly used API queries.
-- =========================
CREATE INDEX IX_Stalls_OwnerId
ON Stalls(ownerId);
GO

CREATE INDEX IX_MenuItems_StallId
ON MenuItems(stallId);
GO

CREATE INDEX IX_Orders_CustomerId
ON Orders(customerId);
GO

CREATE INDEX IX_Orders_StallId
ON Orders(stallId);
GO

CREATE INDEX IX_Feedback_StallId
ON Feedback(stallId);
GO

CREATE INDEX IX_RentalAgreements_StallId
ON RentalAgreements(stallId);
GO

CREATE INDEX IX_RentalPayments_AgreementId
ON RentalPayments(agreementId);
GO

CREATE INDEX IX_RentalPayments_StatusDueDate
ON RentalPayments(status, dueDate);
GO

CREATE INDEX IX_InspectionRecords_StallDate
ON InspectionRecords(stallId, inspectionDate DESC);
GO

CREATE INDEX IX_Deliveries_RiderId
ON Deliveries(riderId);
GO

CREATE INDEX IX_Deliveries_Status
ON Deliveries(deliveryStatus);
GO

CREATE INDEX IX_DeliveryStatusHistory_DeliveryDate
ON DeliveryStatusHistory(deliveryId, changedAt DESC);
GO

-- =========================
-- SQL Login Used by the Node.js Backend
-- Matches:
-- DB_USER=hawker_user
-- DB_PASSWORD=Password123
-- =========================
USE master;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.server_principals
    WHERE name = 'hawker_user'
)
BEGIN
    CREATE LOGIN hawker_user
    WITH PASSWORD = 'Password123';
END;
GO

USE HawkerDB;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.database_principals
    WHERE name = 'hawker_user'
)
BEGIN
    CREATE USER hawker_user
    FOR LOGIN hawker_user;
END;
GO

ALTER ROLE db_datareader ADD MEMBER hawker_user;
ALTER ROLE db_datawriter ADD MEMBER hawker_user;
GO

PRINT 'HawkerDB created successfully.';
GO