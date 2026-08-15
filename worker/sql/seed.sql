-- GENERATED FILE - do not edit by hand.
-- Regenerate with: npm run gen:seed   (source: worker/seed.json)

DELETE FROM donors;
DELETE FROM hospitals;
DELETE FROM requests;
DELETE FROM alerts;
DELETE FROM responses;
DELETE FROM inventory;
DELETE FROM config;

INSERT INTO hospitals (id,name,city,lat,lng,contact) VALUES ('hosp-901','Ruby Hall Clinic','Puducherry',11.935,79.81,'+91-413-222-1212');
INSERT INTO hospitals (id,name,city,lat,lng,contact) VALUES ('hosp-902','Jehangir Hospital','Puducherry',11.945,79.815,'+91-413-222-1000');
INSERT INTO hospitals (id,name,city,lat,lng,contact) VALUES ('hosp-903','KEM Hospital','Puducherry',11.93,79.795,'+91-413-222-3391');
INSERT INTO hospitals (id,name,city,lat,lng,contact) VALUES ('hosp-904','Manipal Hospital','Puducherry',11.96,79.83,'+91-413-222-4000');
INSERT INTO hospitals (id,name,city,lat,lng,contact) VALUES ('hosp-905','Aditya Birla Hospital','Puducherry',11.92,79.785,'+91-413-222-5000');
INSERT INTO hospitals (id,name,city,lat,lng,contact) VALUES ('hosp-906','Lilavati Hospital','Mumbai',19.0509,72.8295,'+91-22-2640-8888');

INSERT INTO donors (id,name,bloodGroup,city,lat,lng,phone,email,totalDonations,lastDonationDate,registeredAt,isAvailable,alertsReceived,alertsResponded,fcmToken) VALUES ('donor-001','Faizan Ali','O-','Puducherry',11.938,79.805,'+91-98220-11001','faizan.ali@example.com',18,'2026-01-14','2023-06-02',1,15,13,NULL);
INSERT INTO donors (id,name,bloodGroup,city,lat,lng,phone,email,totalDonations,lastDonationDate,registeredAt,isAvailable,alertsReceived,alertsResponded,fcmToken) VALUES ('donor-002','Rahul Verma','AB-','Mumbai',19.07,72.885,'+91-98220-11002','rahul.verma@example.com',12,'2026-02-20','2023-11-18',1,11,10,NULL);
INSERT INTO donors (id,name,bloodGroup,city,lat,lng,phone,email,totalDonations,lastDonationDate,registeredAt,isAvailable,alertsReceived,alertsResponded,fcmToken) VALUES ('donor-003','Aditi Rao','B+','Puducherry',11.942,79.812,'+91-98220-11003','aditi.rao@example.com',2,'2026-07-28','2026-01-05',1,3,2,NULL);
INSERT INTO donors (id,name,bloodGroup,city,lat,lng,phone,email,totalDonations,lastDonationDate,registeredAt,isAvailable,alertsReceived,alertsResponded,fcmToken) VALUES ('donor-004','Arjun Mehta','O+','Mumbai',19.033,72.857,'+91-98220-11004','arjun.mehta@example.com',8,'2026-03-11','2024-02-14',1,9,7,NULL);
INSERT INTO donors (id,name,bloodGroup,city,lat,lng,phone,email,totalDonations,lastDonationDate,registeredAt,isAvailable,alertsReceived,alertsResponded,fcmToken) VALUES ('donor-005','Vikram Desai','B-','Mumbai',19.1,72.84,'+91-98220-11005','vikram.desai@example.com',4,'2026-04-02','2024-08-09',1,6,5,NULL);
INSERT INTO donors (id,name,bloodGroup,city,lat,lng,phone,email,totalDonations,lastDonationDate,registeredAt,isAvailable,alertsReceived,alertsResponded,fcmToken) VALUES ('donor-006','Priya Sharma','A+','Mumbai',19.055,72.9,'+91-98220-11006','priya.sharma@example.com',5,'2026-03-30','2024-05-21',1,7,6,NULL);
INSERT INTO donors (id,name,bloodGroup,city,lat,lng,phone,email,totalDonations,lastDonationDate,registeredAt,isAvailable,alertsReceived,alertsResponded,fcmToken) VALUES ('donor-007','Nehru Nair','AB+','Puducherry',11.95,79.825,'+91-98220-11007','nehru.nair@example.com',3,'2026-02-05','2024-12-01',1,5,3,NULL);
INSERT INTO donors (id,name,bloodGroup,city,lat,lng,phone,email,totalDonations,lastDonationDate,registeredAt,isAvailable,alertsReceived,alertsResponded,fcmToken) VALUES ('donor-008','Kavya Singh','A-','Puducherry',11.925,79.79,'+91-98220-11008','kavya.singh@example.com',0,NULL,'2026-05-19',1,2,1,NULL);
INSERT INTO donors (id,name,bloodGroup,city,lat,lng,phone,email,totalDonations,lastDonationDate,registeredAt,isAvailable,alertsReceived,alertsResponded,fcmToken) VALUES ('donor-009','Sanjay Kapoor','O+','Mumbai',19.018,72.83,'+91-98220-11009','sanjay.kapoor@example.com',6,'2026-05-30','2023-09-27',1,8,5,NULL);
INSERT INTO donors (id,name,bloodGroup,city,lat,lng,phone,email,totalDonations,lastDonationDate,registeredAt,isAvailable,alertsReceived,alertsResponded,fcmToken) VALUES ('donor-010','Meera Iyer','AB+','Puducherry',11.955,79.835,'+91-98220-11010','meera.iyer@example.com',1,'2026-07-30','2026-07-01',0,1,0,NULL);

INSERT INTO requests (id,hospitalId,bloodGroup,unitsNeeded,urgency,status,donorsAlerted,donorsFound,createdAt) VALUES ('req-001','hosp-904','AB+',2,'LOW','ACTIVE',2,2,'2026-04-12T22:30:00');
INSERT INTO requests (id,hospitalId,bloodGroup,unitsNeeded,urgency,status,donorsAlerted,donorsFound,createdAt) VALUES ('req-002','hosp-902','O-',3,'HIGH','ACTIVE',3,3,'2026-04-12T21:45:00');
INSERT INTO requests (id,hospitalId,bloodGroup,unitsNeeded,urgency,status,donorsAlerted,donorsFound,createdAt) VALUES ('req-003','hosp-901','B+',8,'CRITICAL','ACTIVE',8,8,'2026-04-12T20:30:00');
INSERT INTO requests (id,hospitalId,bloodGroup,unitsNeeded,urgency,status,donorsAlerted,donorsFound,createdAt) VALUES ('req-004','hosp-905','O+',15,'CRITICAL','ACTIVE',15,15,'2026-04-12T20:00:00');
INSERT INTO requests (id,hospitalId,bloodGroup,unitsNeeded,urgency,status,donorsAlerted,donorsFound,createdAt) VALUES ('req-005','hosp-903','A+',12,'MEDIUM','FULFILLED',12,12,'2026-04-12T17:30:00');
INSERT INTO requests (id,hospitalId,bloodGroup,unitsNeeded,urgency,status,donorsAlerted,donorsFound,createdAt) VALUES ('req-006','hosp-906','AB-',1,'HIGH','ACTIVE',1,1,'2026-04-12T14:45:00');
INSERT INTO requests (id,hospitalId,bloodGroup,unitsNeeded,urgency,status,donorsAlerted,donorsFound,createdAt) VALUES ('req-007','hosp-906','A-',2,'MEDIUM','FULFILLED',2,2,'2026-04-10T13:30:00');

INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-901','A+',6);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-901','A-',2);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-901','B+',4);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-901','B-',1);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-901','AB+',3);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-901','AB-',0);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-901','O+',5);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-901','O-',1);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-902','A+',14);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-902','A-',6);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-902','B+',9);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-902','B-',4);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-902','AB+',5);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-902','AB-',2);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-902','O+',18);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-902','O-',5);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-903','A+',9);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-903','A-',3);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-903','B+',7);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-903','B-',2);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-903','AB+',4);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-903','AB-',1);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-903','O+',11);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-903','O-',3);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-904','A+',20);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-904','A-',9);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-904','B+',12);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-904','B-',6);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-904','AB+',8);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-904','AB-',3);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-904','O+',22);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-904','O-',7);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-905','A+',5);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-905','A-',1);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-905','B+',3);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-905','B-',0);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-905','AB+',2);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-905','AB-',0);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-905','O+',4);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-905','O-',1);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-906','A+',11);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-906','A-',5);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-906','B+',8);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-906','B-',3);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-906','AB+',6);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-906','AB-',1);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-906','O+',13);
INSERT INTO inventory (hospitalId,bloodGroup,units) VALUES ('hosp-906','O-',4);

INSERT INTO config (key,value) VALUES ('minInventoryLevel','8');
