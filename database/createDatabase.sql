/* =========================================================
   HawkerHub Database Setup
   File: createDatabase.sql
   ========================================================= */

USE master;
GO

IF DB_ID('HawkerDB') IS NULL
BEGIN
    CREATE DATABASE HawkerDB;
END;
GO

USE HawkerDB;
GO

/* =========================================================
   Drop existing tables in dependency order
   This allows the script to be rerun safely.
   ========================================================= */

IF OBJECT_ID('Feedback', 'U') IS NOT NULL
    DROP TABLE Feedback;
GO

IF OBJECT_ID('MenuItems', 'U') IS NOT NULL
    DROP TABLE MenuItems;
GO

IF OBJECT_ID('Orders', 'U') IS NOT NULL
    DROP TABLE Orders;
GO

IF OBJECT_ID('Customers', 'U') IS NOT NULL
    DROP TABLE Customers;
GO

IF OBJECT_ID('Stalls', 'U') IS NOT NULL
    DROP TABLE Stalls;
GO

IF OBJECT_ID('Users', 'U') IS NOT NULL
    DROP TABLE Users;
GO

/* =========================================================
   Users
   Stores login and registration information.
   ========================================================= */

CREATE TABLE Users (
    userId INT IDENTITY(1,1) PRIMARY KEY,

    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,

    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(8) NULL,

    passwordHash VARCHAR(255) NOT NULL,

    role VARCHAR(20) NOT NULL,

    createdAt DATETIME NOT NULL
        CONSTRAINT DF_Users_CreatedAt DEFAULT GETDATE(),

    CONSTRAINT CK_Users_Role
        CHECK (role IN ('customer', 'vendor'))
);
GO

/* =========================================================
   Customers
   Links a customer account to business-related data.
   ========================================================= */

CREATE TABLE Customers (
    customerId INT IDENTITY(1,1) PRIMARY KEY,

    userId INT NULL,

    customerName VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,

    CONSTRAINT FK_Customers_Users
        FOREIGN KEY (userId)
        REFERENCES Users(userId)
);
GO

/* =========================================================
   Stalls
   Stores hawker stall information.
   ========================================================= */

CREATE TABLE Stalls (
    stallId INT IDENTITY(1,1) PRIMARY KEY,

    ownerId INT NULL,

    stallName VARCHAR(100) NOT NULL,
    cuisine VARCHAR(50) NULL,
    location VARCHAR(100) NULL,

    CONSTRAINT FK_Stalls_Users
        FOREIGN KEY (ownerId)
        REFERENCES Users(userId)
);
GO

/* =========================================================
   MenuItems
   Stores menu items belonging to stalls.
   ========================================================= */

CREATE TABLE MenuItems (
    menuItemId INT IDENTITY(1,1) PRIMARY KEY,

    stallId INT NOT NULL,

    itemName VARCHAR(100) NOT NULL,
    description VARCHAR(500) NULL,

    price DECIMAL(10,2) NOT NULL,
    image VARCHAR(255) NULL,

    createdAt DATETIME NOT NULL
        CONSTRAINT DF_MenuItems_CreatedAt DEFAULT GETDATE(),

    CONSTRAINT CK_MenuItems_Price
        CHECK (price >= 0),

    CONSTRAINT FK_MenuItems_Stalls
        FOREIGN KEY (stallId)
        REFERENCES Stalls(stallId)
);
GO

/* =========================================================
   Orders
   Stores completed and ongoing customer orders.
   ========================================================= */

CREATE TABLE Orders (
    orderId INT IDENTITY(1,1) PRIMARY KEY,

    customerId INT NOT NULL,
    stallId INT NOT NULL,

    totalAmount DECIMAL(10,2) NOT NULL,

    paymentStatus VARCHAR(20) NOT NULL
        CONSTRAINT DF_Orders_PaymentStatus DEFAULT 'Paid',

    createdAt DATETIME NOT NULL
        CONSTRAINT DF_Orders_CreatedAt DEFAULT GETDATE(),

    CONSTRAINT CK_Orders_TotalAmount
        CHECK (totalAmount >= 0),

    CONSTRAINT CK_Orders_PaymentStatus
        CHECK (
            paymentStatus IN (
                'Pending',
                'Paid',
                'Failed',
                'Refunded'
            )
        ),

    CONSTRAINT FK_Orders_Customers
        FOREIGN KEY (customerId)
        REFERENCES Customers(customerId),

    CONSTRAINT FK_Orders_Stalls
        FOREIGN KEY (stallId)
        REFERENCES Stalls(stallId)
);
GO

/* =========================================================
   Feedback
   Supports Vendor Ratings and Reviews full CRUD.
   ========================================================= */

CREATE TABLE Feedback (
    feedbackId INT IDENTITY(1,1) PRIMARY KEY,

    orderId INT NOT NULL,
    customerId INT NOT NULL,
    stallId INT NOT NULL,

    rating INT NOT NULL,
    comments VARCHAR(1000) NULL,

    createdAt DATETIME NOT NULL
        CONSTRAINT DF_Feedback_CreatedAt DEFAULT GETDATE(),

    updatedAt DATETIME NULL,

    CONSTRAINT CK_Feedback_Rating
        CHECK (rating BETWEEN 1 AND 5),

    CONSTRAINT UQ_Feedback_Order
        UNIQUE (orderId),

    CONSTRAINT FK_Feedback_Orders
        FOREIGN KEY (orderId)
        REFERENCES Orders(orderId),

    CONSTRAINT FK_Feedback_Customers
        FOREIGN KEY (customerId)
        REFERENCES Customers(customerId),

    CONSTRAINT FK_Feedback_Stalls
        FOREIGN KEY (stallId)
        REFERENCES Stalls(stallId)
);
GO

PRINT 'HawkerDB tables created successfully.';
GO