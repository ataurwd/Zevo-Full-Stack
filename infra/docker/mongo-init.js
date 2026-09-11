// MongoDB Replica Set Initialization Script
try {
  const status = rs.status();
  print("Replica set already initialized: " + status.set);
} catch (e) {
  print("Initializing replica set rs0...");
  const res = rs.initiate({
    _id: "rs0",
    members: [
      { _id: 0, host: "mongodb:27017" }
    ]
  });
  print("rs.initiate result: " + JSON.stringify(res));
}
