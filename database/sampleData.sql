USE HawkerDB;
GO


-- =========================
-- Users
-- Password for all accounts below is: password123
-- =========================
INSERT INTO Users (
    firstName,
    lastName,
    email,
    phone,
    passwordHash,
    role
)
VALUES
(
    'Elix',
    'Ng',
    'elix@gmail.com',
    '91234567',
    '$2b$10$iNkOaKgaV9GHGDoSa96ohuZMKad6hmbha7Eopb5twyO989tGNBX1O',
    'customer'
),
(
    'Keith',
    'Tan',
    'keith@gmail.com',
    '98765432',
    '$2b$10$iNkOaKgaV9GHGDoSa96ohuZMKad6hmbha7Eopb5twyO989tGNBX1O',
    'vendor'
),
(
    'Ryan',
    'Lee',
    'rider@gmail.com',
    '91112222',
    '$2b$10$iNkOaKgaV9GHGDoSa96ohuZMKad6hmbha7Eopb5twyO989tGNBX1O',
    'rider'
);
GO


-- =========================
-- NEA Officer
-- Password: password123
-- =========================
INSERT INTO Users (
    firstName,
    lastName,
    email,
    phone,
    passwordHash,
    role
)
VALUES
(
    'Nadia',
    'Lim',
    'nea@example.com',
    '90001111',
    '$2b$10$iNkOaKgaV9GHGDoSa96ohuZMKad6hmbha7Eopb5twyO989tGNBX1O',
    'nea_officer'
);
GO


-- =========================
-- Customers
-- =========================
INSERT INTO Customers (
    userId,
    customerName,
    email
)
VALUES
(
    1,
    'Elix Ng',
    'elix@gmail.com'
),
(
    NULL,
    'Walk-in Guest',
    'guest@example.com'
);
GO


-- =========================
-- Stalls
-- =========================
INSERT INTO Stalls (
    stallId,
    stallName,
    cuisine,
    hawkerCentre,
    address,
    ownerName,
    phone,
    email,
    description,
    established,
    hygieneGrade,
    rating,
    totalReviews,
    deliveryAvailable,
    pickupAvailable,
    monday,
    tuesday,
    wednesday,
    thursday,
    friday,
    saturday,
    sunday
)
VALUES
(
    1,
    'Tian Tian Chicken Rice',
    'Chinese',
    'Maxwell Food Centre',
    '1 Kadayanallur Street, #01-10, Singapore 069184',
    'Ah Tan',
    '+65 6225 5635',
    'tiantian@example.com',
    '',
    1980,
    'A',
    4.8,
    1245,
    1,
    1,
    '10:00-20:00',
    '10:00-20:00',
    '10:00-20:00',
    '10:00-20:00',
    '10:00-20:00',
    '10:00-20:00',
    '10:00-18:00'
),
(
    2,
    'Hill Street Fried Kway Teow',
    'Chinese',
    'Bedok Food Centre',
    '348 Bedok Road, #01-23, Singapore 469560',
    'Mr. Wong',
    '+65 6243 9876',
    'hillstreet@example.com',
    'Traditional fried kway teow with excellent wok hei flavor.',
    1975,
    'A',
    4.5,
    892,
    1,
    1,
    '08:00-18:00',
    '08:00-18:00',
    '08:00-18:00',
    '08:00-18:00',
    '08:00-18:00',
    '08:00-18:00',
    'Closed'
),
(
    3,
    'Sungei Road Laksa',
    'Chinese',
    'Jalan Besar',
    '27 Jalan Berseh, #01-100, Singapore 200027',
    'Madam Goh',
    '+65 6294 0321',
    'sungeiroad@example.com',
    'Original Katong laksa with rich coconut broth. Family recipe since 1956.',
    1956,
    'A',
    4.7,
    1543,
    1,
    1,
    '09:00-17:00',
    '09:00-17:00',
    '09:00-17:00',
    '09:00-17:00',
    '09:00-17:00',
    '09:00-17:00',
    '09:00-15:00'
),
(
    4,
    'Roti Prata House',
    'Indian',
    'Little India',
    '246 Race Course Road, Singapore 218701',
    'Mr. Singh',
    '+65 6299 0022',
    'pratahouse@example.com',
    '24-hour prata shop serving crispy pratas with various curries',
    1990,
    'B',
    4.3,
    765,
    1,
    1,
    '06:00-22:00',
    '06:00-22:00',
    '06:00-22:00',
    '06:00-22:00',
    '06:00-22:00',
    '06:00-22:00',
    '06:00-22:00'
);
GO


-- =========================
-- Stall Feature Additions
-- Keith owns stall 1.
-- =========================
UPDATE Stalls
SET
    ownerId = 2,
    stallNumber = '#01-10'
WHERE stallId = 1;

UPDATE Stalls
SET stallNumber = '#01-23'
WHERE stallId = 2;

UPDATE Stalls
SET stallNumber = '#01-100'
WHERE stallId = 3;

UPDATE Stalls
SET stallNumber = '#01-15'
WHERE stallId = 4;
GO


-- =========================
-- Menu Items
-- =========================
INSERT INTO MenuItems (
    stallId,
    stallName,
    name,
    category,
    description,
    price,
    prepTime,
    availability,
    image
)
VALUES
(
    2,
    'Hill Street Fried Kway Teow',
    'Fried Hokkien Mee',
    'Main Course',
    'Stir-fried noodles with prawns, egg, and sambal chilli',
    5.50,
    10,
    'Y',
    'hokkien-mee.jpg'
),
(
    2,
    'Hill Street Fried Kway Teow',
    'Add egg',
    'Add-on',
    'Extra fried egg topping',
    1.00,
    2,
    'Y',
    'egg.jpg'
),
(
    4,
    'Roti Prata House',
    'Cheese prata',
    'Main Course',
    'Crispy prata with cheese inside',
    4.00,
    6,
    'Y',
    'cheese-prata.jpg'
),
(
    4,
    'Roti Prata House',
    'Egg prata',
    'Main Course',
    'Crispy prata with egg inside',
    3.00,
    5,
    'Y',
    'egg-prata.jpg'
),
(
    2,
    'Hill Street Fried Kway Teow',
    'Char Kway Teow',
    'Main Course',
    'Fried flat rice noodles with prawns, Chinese sausage, cockles, and bean sprouts',
    5.00,
    10,
    'Y',
    'char-kway-teow.jpg'
),
(
    2,
    'Hill Street Fried Kway Teow',
    'Iced Lemon Tea',
    'Beverage',
    'Refreshing lemon tea served cold',
    2.50,
    3,
    'Y',
    'ice-lemon-tea.jpg'
),
(
    2,
    'Hill Street Fried Kway Teow',
    'Sugar Cane Juice',
    'Beverage',
    'Freshly pressed sugar cane juice',
    3.00,
    2,
    'Y',
    'sugarcane.jpg'
),
(
    3,
    'Sungei Road Laksa',
    'Otah (2pcs)',
    'Side',
    'Bigger portion with extra prawns and tofu puffs',
    2.00,
    5,
    'Y',
    'otah.jpg'
),
(
    4,
    'Roti Prata House',
    'Teh Tarik (Hot)',
    'Beverage',
    'Traditional pulled milk tea',
    1.80,
    3,
    'Y',
    'teh-tarik.jpg'
),
(
    1,
    'Tian Tian Chicken Rice',
    'Roasted Chicken Rice',
    'Main Course',
    'Crispy roasted chicken with aromatic rice',
    6.00,
    20,
    'Y',
    'roasted-chicken-rice.jpg'
),
(
    1,
    'Tian Tian Chicken Rice',
    'Chicken Rice',
    'Main Course',
    'Signature Hainanese chicken rice with fragrant rice and tender steamed chicken',
    5.50,
    15,
    'Y',
    'chicken-rice.jpg'
),
(
    1,
    'Tian Tian Chicken Rice',
    'Iced Teh Tarik',
    'Beverage',
    'Traditional pulled tea with ice',
    2.50,
    3,
    'Y',
    'iced-teh-tarik.jpg'
),
(
    4,
    'Roti Prata House',
    'Prata with curry',
    'Main Course',
    'Crispy Indian flatbread served with curry',
    2.50,
    5,
    'Y',
    'curry-prata.jpg'
),
(
    3,
    'Sungei Road Laksa',
    'Laksa (large)',
    'Main Course',
    'Bigger portion with extra prawns and tofu puffs',
    7.50,
    12,
    'Y',
    'laksa.jpg'
);
GO


-- =========================
-- Orders
-- =========================
INSERT INTO Orders (
    customerId,
    stallId,
    totalAmount,
    paymentStatus,
    orderStatus
)
VALUES
(
    1,
    1,
    7.50,
    'Paid',
    'Completed'
),
(
    2,
    2,
    5.80,
    'Paid',
    'Completed'
),
(
    1,
    1,
    12.00,
    'Paid',
    'Out for Delivery'
);
GO


-- =========================
-- Deliveries
-- Sample delivery tracking data.
-- =========================
DECLARE @riderId INT;

SELECT @riderId = userId
FROM Users
WHERE email = 'rider@gmail.com';

IF @riderId IS NULL
BEGIN
    THROW 50002, 'Rider account was not found.', 1;
END;

INSERT INTO Deliveries (
    orderId,
    riderId,
    riderName,
    riderPhone,
    deliveryAddress,
    destinationLatitude,
    destinationLongitude,
    currentLatitude,
    currentLongitude,
    deliveryStatus,
    estimatedArrivalMinutes,
    remainingDistanceMetres,
    assignedAt,
    pickedUpAt
)
VALUES
(
    3,
    @riderId,
    'Ryan Lee',
    '91112222',
    '535 Clementi Road, Singapore 599489',
    1.3321000,
    103.7743000,
    1.3298000,
    103.7711000,
    'Out for Delivery',
    7,
    2100,
    DATEADD(MINUTE, -15, GETDATE()),
    DATEADD(MINUTE, -5, GETDATE())
);
GO


-- =========================
-- Delivery Status History
-- =========================
DECLARE @deliveryId INT;
DECLARE @riderUserId INT;

SELECT @deliveryId = deliveryId
FROM Deliveries
WHERE orderId = 3;

SELECT @riderUserId = userId
FROM Users
WHERE email = 'rider@gmail.com';

IF @deliveryId IS NULL
BEGIN
    THROW 50003, 'Sample delivery record was not found.', 1;
END;

INSERT INTO DeliveryStatusHistory (
    deliveryId,
    deliveryStatus,
    changedByUserId,
    changedAt
)
VALUES
(
    @deliveryId,
    'Order Confirmed',
    NULL,
    DATEADD(MINUTE, -35, GETDATE())
),
(
    @deliveryId,
    'Preparing',
    2,
    DATEADD(MINUTE, -30, GETDATE())
),
(
    @deliveryId,
    'Ready for Delivery',
    2,
    DATEADD(MINUTE, -20, GETDATE())
),
(
    @deliveryId,
    'Rider Assigned',
    2,
    DATEADD(MINUTE, -15, GETDATE())
),
(
    @deliveryId,
    'Out for Delivery',
    @riderUserId,
    DATEADD(MINUTE, -5, GETDATE())
);
GO


-- =========================
-- Feedback
-- =========================
INSERT INTO Feedback (
    orderId,
    customerId,
    stallId,
    rating,
    comments
)
VALUES
(
    1,
    1,
    1,
    5,
    'Great chicken rice, very tasty.'
),
(
    2,
    2,
    2,
    4,
    'Good food and fast service.'
);
GO


-- =========================
-- Rental Agreements
-- =========================
INSERT INTO RentalAgreements (
    stallId,
    stallNumber,
    monthlyRent,
    stallSizeSqFt,
    startDate,
    endDate,
    status
)
VALUES
(
    1,
    '#01-10',
    2000.00,
    150,
    '2026-01-01',
    '2026-12-31',
    'Active'
),
(
    2,
    '#01-23',
    1800.00,
    130,
    '2026-02-01',
    '2027-01-31',
    'Active'
),
(
    3,
    '#01-100',
    2200.00,
    170,
    '2026-03-01',
    '2027-02-28',
    'Active'
),
(
    4,
    '#01-15',
    1900.00,
    140,
    '2026-01-15',
    '2027-01-14',
    'Active'
);
GO


-- =========================
-- Rental Payments
-- =========================
INSERT INTO RentalPayments (
    agreementId,
    dueDate,
    amount,
    paymentDate,
    paymentMethod,
    status
)
VALUES
(
    1,
    '2026-06-05',
    2000.00,
    '2026-06-03',
    'Bank Transfer',
    'Paid'
),
(
    1,
    '2026-07-05',
    2000.00,
    '2026-07-04',
    'PayNow',
    'Paid'
),
(
    1,
    '2026-08-05',
    2000.00,
    NULL,
    NULL,
    'Pending'
),
(
    2,
    '2026-06-05',
    1800.00,
    '2026-06-05',
    'Bank Transfer',
    'Paid'
),
(
    2,
    '2026-07-05',
    1800.00,
    NULL,
    NULL,
    'Overdue'
),
(
    3,
    '2026-07-05',
    2200.00,
    '2026-07-02',
    'PayNow',
    'Paid'
),
(
    4,
    '2026-07-15',
    1900.00,
    '2026-07-14',
    'Bank Transfer',
    'Paid'
);
GO


-- =========================
-- Inspection Records
-- =========================
DECLARE @neaOfficerId INT;

SELECT @neaOfficerId = userId
FROM Users
WHERE email = 'nea@example.com';

IF @neaOfficerId IS NULL
BEGIN
    THROW 50001, 'NEA officer account was not found.', 1;
END;

INSERT INTO InspectionRecords (
    stallId,
    officerId,
    inspectionDate,
    score,
    grade,
    remarks
)
VALUES
(
    1,
    @neaOfficerId,
    '2026-02-10',
    90,
    'A',
    'Food preparation and storage areas were clean.'
),
(
    2,
    @neaOfficerId,
    '2026-02-08',
    88,
    'A',
    'Clean food preparation area with no major issues.'
),
(
    3,
    @neaOfficerId,
    '2026-02-05',
    92,
    'A',
    'Very good overall cleanliness and food handling.'
),
(
    4,
    @neaOfficerId,
    '2026-02-03',
    78,
    'B',
    'Minor improvements required for food storage practices.'
);
GO


-- =========================
-- Verify Inserted Data
-- =========================
SELECT * FROM Users;
SELECT * FROM Customers;
SELECT * FROM Stalls;
SELECT * FROM MenuItems;
SELECT * FROM Orders;
SELECT * FROM Deliveries;
SELECT * FROM DeliveryStatusHistory;
SELECT * FROM Feedback;
SELECT * FROM RentalAgreements;
SELECT * FROM RentalPayments;
SELECT * FROM InspectionRecords;
GO

PRINT 'Sample data inserted successfully.';
GO