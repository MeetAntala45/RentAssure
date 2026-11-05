UPDATE rental_items SET "Status" = 'Available' WHERE "Status" = 'Rented';
SELECT "Id", "Title", "Status" FROM rental_items ORDER BY "Id" DESC LIMIT 10;
