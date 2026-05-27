SELECT * FROM users;

DELETE FROM users 
WHERE id = (SELECT MAX(id) FROM users);