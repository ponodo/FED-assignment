USE HawkerDB;
GO

-- Users
-- Password for both accounts below is: password123
INSERT INTO Users (firstName, lastName, email, phone, passwordHash, role)
VALUES
('Elix', 'Ng', 'elix@gmail.com', '91234567', '$2b$10$iNkOaKgaV9GHGDoSa96ohuZMKad6hmbha7Eopb5twyO989tGNBX1O', 'customer'),
('Keith', 'Tan', 'keith@gmail.com', '98765432', '$2b$10$iNkOaKgaV9GHGDoSa96ohuZMKad6hmbha7Eopb5twyO989tGNBX1O', 'vendor');

INSERT INTO Customers (userId, customerName, email)
VALUES
(1, 'Elix Ng', 'elix@gmail.com'),
(NULL, 'Walk-in Guest', 'guest@example.com');

INSERT INTO Stalls (ownerId, stallName, cuisine, location)
VALUES
(2, 'Ah Seng Chicken Rice', 'Chicken Rice', 'Block A'),
(NULL, 'Muthu Prata', 'Indian', 'Block B');

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