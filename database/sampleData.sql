/* =========================================================
   HawkerHub Sample Data
   File: sampleData.sql

   Run createDatabase.sql before running this file.
   ========================================================= */

USE HawkerDB;
GO

/* =========================================================
   Sample customers

   userId is NULL because real user accounts should be
   created through POST /api/auth/register so passwords
   are securely hashed using bcrypt.
   ========================================================= */

INSERT INTO Customers (
    userId,
    customerName,
    email
)
VALUES
(
    NULL,
    'Sample Customer One',
    'customer1@example.com'
),
(
    NULL,
    'Sample Customer Two',
    'customer2@example.com'
),
(
    NULL,
    'Sample Customer Three',
    'customer3@example.com'
);
GO

/* =========================================================
   Sample stalls
   ========================================================= */

INSERT INTO Stalls (
    ownerId,
    stallName,
    cuisine,
    location
)
VALUES
(
    NULL,
    'Tian Tian Chicken Rice',
    'Chinese',
    'Maxwell Food Centre'
),
(
    NULL,
    'Hill Street Fried Kway Teow',
    'Chinese',
    'Chinatown Complex'
),
(
    NULL,
    'Sungei Road Laksa',
    'Local',
    'Jalan Berseh'
),
(
    NULL,
    'Roti Prata House',
    'Indian',
    'Upper Thomson Road'
),
(
    NULL,
    'ABC Noodles',
    'Chinese',
    'Old Airport Road Food Centre'
);
GO

/* =========================================================
   Sample menu items
   Ensure these image filenames exist inside public/Images.
   ========================================================= */

INSERT INTO MenuItems (
    stallId,
    itemName,
    description,
    price,
    image
)
VALUES
(
    1,
    'Chicken Rice',
    'Steamed chicken served with fragrant rice.',
    5.50,
    'chicken-rice.jpg'
),
(
    1,
    'Roasted Chicken Rice',
    'Roasted chicken served with fragrant rice.',
    6.00,
    'roasted-chicken-rice.jpg'
),
(
    2,
    'Fried Kway Teow',
    'Flat rice noodles fried with egg and bean sprouts.',
    6.50,
    'fried-kway-teow.jpg'
),
(
    3,
    'Laksa',
    'Rice noodles served in spicy coconut gravy.',
    5.00,
    'laksa.jpg'
),
(
    4,
    'Plain Prata',
    'Crispy prata served with curry.',
    1.50,
    'plain-prata.jpg'
),
(
    4,
    'Egg Prata',
    'Crispy prata filled with egg and served with curry.',
    2.50,
    'egg-prata.jpg'
),
(
    5,
    'Minced Meat Noodles',
    'Noodles served with minced meat and vegetables.',
    5.50,
    'minced-meat-noodles.jpg'
);
GO

/* =========================================================
   Sample completed orders

   These orders allow feedback to be submitted and tested.
   ========================================================= */

INSERT INTO Orders (
    customerId,
    stallId,
    totalAmount,
    paymentStatus,
    createdAt
)
VALUES
(
    1,
    1,
    5.50,
    'Paid',
    DATEADD(DAY, -5, GETDATE())
),
(
    2,
    1,
    6.00,
    'Paid',
    DATEADD(DAY, -4, GETDATE())
),
(
    3,
    2,
    6.50,
    'Paid',
    DATEADD(DAY, -3, GETDATE())
),
(
    1,
    3,
    5.00,
    'Paid',
    DATEADD(DAY, -2, GETDATE())
),
(
    2,
    4,
    4.00,
    'Paid',
    DATEADD(DAY, -1, GETDATE())
);
GO

/* =========================================================
   Sample feedback

   One feedback record per order.
   ========================================================= */

INSERT INTO Feedback (
    orderId,
    customerId,
    stallId,
    rating,
    comments,
    createdAt
)
VALUES
(
    1,
    1,
    1,
    5,
    'The chicken was tender and the rice was very fragrant.',
    DATEADD(DAY, -4, GETDATE())
),
(
    2,
    2,
    1,
    4,
    'Good chicken rice, but the waiting time was slightly long.',
    DATEADD(DAY, -3, GETDATE())
),
(
    3,
    3,
    2,
    5,
    'Very flavourful fried kway teow with a good smoky taste.',
    DATEADD(DAY, -2, GETDATE())
),
(
    4,
    1,
    3,
    4,
    'The laksa gravy was rich and spicy.',
    DATEADD(DAY, -1, GETDATE())
);
GO

/* =========================================================
   Display inserted data
   ========================================================= */

SELECT * FROM Users;
SELECT * FROM Customers;
SELECT * FROM Stalls;
SELECT * FROM MenuItems;
SELECT * FROM Orders;
SELECT * FROM Feedback;
GO

PRINT 'HawkerHub sample data inserted successfully.';
GO