CREATE DATABASE HawkerDB;
GO

USE HawkerDB;
GO

-- Customers
CREATE TABLE Customers (
    customerId INT IDENTITY(1,1) PRIMARY KEY,
    customerName VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE
);

-- Stalls
CREATE TABLE Stalls (
    stallId INT IDENTITY(1,1) PRIMARY KEY,
    stallName VARCHAR(100) NOT NULL,
    cuisine VARCHAR(50),
    location VARCHAR(100)
);

-- Orders
CREATE TABLE Orders (
    orderId INT IDENTITY(1,1) PRIMARY KEY,
    customerId INT NOT NULL,
    stallId INT NOT NULL,
    totalAmount DECIMAL(10,2) NOT NULL,
    paymentStatus VARCHAR(20) DEFAULT 'Paid',
    orderStatus VARCHAR(20) DEFAULT 'Completed',
    orderDate DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (customerId) REFERENCES Customers(customerId),
    FOREIGN KEY (stallId) REFERENCES Stalls(stallId)
);

-- Feedback
CREATE TABLE Feedback (
    feedbackId INT IDENTITY(1,1) PRIMARY KEY,
    orderId INT NOT NULL UNIQUE,
    customerId INT NOT NULL,
    stallId INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comments VARCHAR(1000),
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME NULL,

    FOREIGN KEY (orderId) REFERENCES Orders(orderId),
    FOREIGN KEY (customerId) REFERENCES Customers(customerId),
    FOREIGN KEY (stallId) REFERENCES Stalls(stallId)
);