USE HawkerDB;
GO

-- =========================
-- Users
-- Password for both accounts below is: password123
-- =========================
INSERT INTO Users (firstName, lastName, email, phone, passwordHash, role)
VALUES
('Elix', 'Ng', 'elix@gmail.com', '91234567', '$2b$10$iNkOaKgaV9GHGDoSa96ohuZMKad6hmbha7Eopb5twyO989tGNBX1O', 'customer'),
('Keith', 'Tan', 'keith@gmail.com', '98765432', '$2b$10$iNkOaKgaV9GHGDoSa96ohuZMKad6hmbha7Eopb5twyO989tGNBX1O', 'vendor');

-- =========================
-- Customers
-- =========================
INSERT INTO Customers (userId, customerName, email)
VALUES
(1, 'Elix Ng', 'elix@gmail.com'),
(NULL, 'Walk-in Guest', 'guest@example.com');

-- =========================
-- Stalls
-- =========================
INSERT INTO Stalls (
    stallId, stallName, cuisine, hawkerCentre, address, ownerName, phone, email,
    description, established, hygieneGrade, rating, totalReviews,
    deliveryAvailable, pickupAvailable,
    monday, tuesday, wednesday, thursday, friday, saturday, sunday
)
VALUES
(1, 'Tian Tian Chicken Rice', 'Chinese', 'Maxwell Food Centre', '1 Kadayanallur Street, #01-10, Singapore 069184', 'Ah Tan', '+65 6225 5635', 'tiantian@example.com', '', 1980, 'A', 4.8, 1245, 1, 1, '10:00-20:00', '10:00-20:00', '10:00-20:00', '10:00-20:00', '10:00-20:00', '10:00-20:00', '10:00-18:00'),
(2, 'Hill Street Fried Kway Teow', 'Chinese', 'Bedok Food Centre', '348 Bedok Road, #01-23, Singapore 469560', 'Mr. Wong', '+65 6243 9876', 'hillstreet@example.com', 'Traditional fried kway teow with excellent wok hei flavor.', 1975, 'A', 4.5, 892, 1, 1, '08:00-18:00', '08:00-18:00', '08:00-18:00', '08:00-18:00', '08:00-18:00', '08:00-18:00', 'Closed'),
(3, 'Sungei Road Laksa', 'Chinese', 'Jalan Besar', '27 Jalan Berseh, #01-100, Singapore 200027', 'Madam Goh', '+65 6294 0321', 'sungeiroad@example.com', 'Original Katong laksa with rich coconut broth. Family recipe since 1956.', 1956, 'A', 4.7, 1543, 1, 1, '09:00-17:00', '09:00-17:00', '09:00-17:00', '09:00-17:00', '09:00-17:00', '09:00-17:00', '09:00-15:00'),
(4, 'Roti Prata House', 'Indian', 'Little India', '246 Race Course Road, Singapore 218701', 'Mr. Singh', '+65 6299 0022', 'pratahouse@example.com', '24-hour prata shop serving crispy pratas with various curries', 1990, 'B', 4.3, 765, 1, 1, '06:00-22:00', '06:00-22:00', '06:00-22:00', '06:00-22:00', '06:00-22:00', '06:00-22:00', '06:00-22:00');

-- =========================
-- Menu Items
-- =========================
INSERT INTO MenuItems (
    stallId, stallName, name, category, description, price, prepTime, availability, image
)
VALUES
(2, 'Hill Street Fried Kway Teow', 'Fried Hokkien Mee', 'Main Course', 'Stir-fried noodles with prawns, egg, and sambal chilli', 5.50, 10, 'Y', 'hokkien-mee.jpg'),
(2, 'Hill Street Fried Kway Teow', 'Add egg', 'Add-on', 'Extra fried egg topping', 1.00, 2, 'Y', 'egg.jpg'),
(4, 'Roti Prata House', 'Cheese prata', 'Main Course', 'Crispy prata with cheese inside', 4.00, 6, 'Y', 'cheese-prata.jpg'),
(4, 'Roti Prata House', 'Egg prata', 'Main Course', 'Crispy prata with egg inside', 3.00, 5, 'Y', 'egg-prata.jpg'),
(2, 'Hill Street Fried Kway Teow', 'Char Kway Teow', 'Main Course', 'Fried flat rice noodles with prawns, Chinese sausage, cockles, and bean sprouts', 5.00, 10, 'Y', 'char-kway-teow.jpg'),
(2, 'Hill Street Fried Kway Teow', 'Iced Lemon Tea', 'Beverage', 'Refreshing lemon tea served cold', 2.50, 3, 'Y', 'ice-lemon-tea.jpg'),
(2, 'Hill Street Fried Kway Teow', 'Sugar Cane Juice', 'Beverage', 'Freshly pressed sugar cane juice', 3.00, 2, 'Y', 'sugarcane.jpg'),
(3, 'Sungei Road Laksa', 'Otah (2pcs)', 'Side', 'Bigger portion with extra prawns and tofu puffs', 2.00, 5, 'Y', 'otah.jpg'),
(4, 'Roti Prata House', 'Teh Tarik (Hot)', 'Beverage', 'Traditional pulled milk tea', 1.80, 3, 'Y', 'teh-tarik.jpg'),
(1, 'Tian Tian Chicken Rice', 'Roasted Chicken Rice', 'Main Course', 'Crispy roasted chicken with aromatic rice', 6.00, 20, 'Y', 'roasted-chicken-rice.jpg'),
(1, 'Tian Tian Chicken Rice', 'Chicken Rice', 'Main Course', 'Signature Hainanese chicken rice with fragrant rice and tender steamed chicken', 5.50, 15, 'Y', 'chicken-rice.jpg'),
(1, 'Tian Tian Chicken Rice', 'Iced Teh Tarik', 'Beverage', 'Traditional pulled tea with ice', 2.50, 3, 'Y', 'iced-teh-tarik.jpg'),
(4, 'Roti Prata House', 'Prata with curry', 'Main Course', 'Crispy Indian flatbread served with curry', 2.50, 5, 'Y', 'curry-prata.jpg'),
(3, 'Sungei Road Laksa', 'Laksa (large)', 'Main Course', 'Bigger portion with extra prawns and tofu puffs', 7.50, 12, 'Y', 'laksa.jpg');

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
(1, 1, 7.50, 'Paid', 'Completed'),
(2, 2, 5.80, 'Paid', 'Completed');

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
(1, 1, 1, 5, 'Great chicken rice, very tasty.'),
(2, 2, 2, 4, 'Good food and fast service.');