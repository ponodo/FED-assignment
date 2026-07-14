USE HawkerDB;
GO

INSERT INTO Customers (customerName, email)
VALUES
('Elix Ng', 'elix@gmail.com'),
('Keith Tan', 'keith@gmail.com');

INSERT INTO Stalls (stallName, cuisine, location)
VALUES
('Ah Seng Chicken Rice', 'Chicken Rice', 'Block A'),
('Muthu Prata', 'Indian', 'Block B');

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