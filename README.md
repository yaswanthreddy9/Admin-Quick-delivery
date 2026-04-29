

# 🎛️ Admin Dispatch Dashboard

**Stack:** HTML5, CSS3, Vanilla Javascript, Firebase (Firestore, Firebase Authentication)
**Architecture:** Pure Web Application (Browser-Based)
**Role:** The Command Center. It bridges the gap between the Customer App (which creates orders) and the Driver App (which fulfills them). It watches the database in real-time and triggers the backend Cloud Function via document updates.

## 📖 Overview
The Admin Dashboard does not need to be wrapped into a mobile app (though it can be). It is designed to sit open in a browser tab at the restaurant or dispatch center. 

Its primary job is to watch the `orders` collection for new entries, watch the `drivers` collection for available workers, and manually assign a `driverId` to an order. **This single action is what triggers the Cloud Function to blast the driver's phone with the high-priority alarm.**

---

## 🏗️ System Architecture & Data Flow

### 1. The Live Inbox (Order Listener)
* **Tech:** Firebase `onSnapshot()`.
* **Function:** Actively listens to the `orders` collection where `status == "Pending"`.
* **Interaction:** The moment a customer taps "Checkout" on the User App, a new card instantly pops up on the Admin screen with a notification sound, without the Admin ever refreshing the page.

### 2. Fleet Management (Driver Roster)
* **Tech:** Firebase `onSnapshot()`.
* **Function:** Listens to the `drivers` collection to see who is currently logged in.
* **Interaction:** Displays a list of drivers, their current status (e.g., "Online", "On Delivery"), and potentially their live location coordinates.

### 3. The Dispatch Action (The Trigger)
* **Trigger:** The Admin selects an order, selects an available driver, and clicks "Assign."
* **Database Write:** The Javascript updates the specific order document in Firestore:
  ```javascript
  db.collection("orders").doc(orderId).update({
      driverId: selectedDriverId,
      status: "Assigned"
  })
  ```
* **The Domino Effect:** This specific database update (`driverId` changing from `null` to a real ID) is exactly what the Firebase Cloud Function is waiting for. The backend robot detects this write and fires the FCM Push Notification to the driver.

---

## 📂 Recommended Folder Structure

```text
AdminPanel/
│
├── index.html          # Main dispatch dashboard UI
├── login.html          # Admin authentication screen
├── css/
│   └── style.css       # Visual layout (Grid/Flexbox for columns)
└── js/
    ├── firebase.js     # Firebase config and Auth logic
    ├── orders.js       # Listens for and displays pending orders
    ├── drivers.js      # Listens for and displays active drivers
    └── dispatch.js     # The logic for pairing an order to a driver
```

---

## 🛠️ Step-by-Step Developer Implementation Guide

### Step 1: Build the UI Grid
Create a two-column layout. The left column holds incoming "Pending Orders." The right column holds a list of "Available Drivers."

### Step 2: Set Up Real-Time Listeners
Connect your Javascript to Firestore. You must use `onSnapshot` instead of `.get()` so the dashboard feels alive.

```javascript
// Watch for new orders from the User App
db.collection("orders").where("status", "==", "Pending")
    .onSnapshot((querySnapshot) => {
        const ordersList = document.getElementById('orders-list');
        ordersList.innerHTML = ''; // Clear old list
        
        querySnapshot.forEach((doc) => {
            const order = doc.data();
            // Create HTML elements for the order card and append to ordersList
            renderOrderCard(doc.id, order); 
        });
    });

// Watch for drivers coming online
db.collection("drivers").where("isOnline", "==", true)
    .onSnapshot((querySnapshot) => {
        // Render available drivers into a dropdown or list
    });
```

### Step 3: Implement the Dispatch Logic
When the Admin clicks the "Assign" button on an order, gather the `orderId` and the `driverId`, and execute the update.

```javascript
function assignDriverToOrder(orderId, driverId) {
    db.collection("orders").doc(orderId).update({
        driverId: driverId,
        status: "Assigned",
        assignedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log("Order assigned! Cloud Function will now wake up the driver.");
        // UI will automatically update because of the onSnapshot listener
    })
    .catch((error) => {
        console.error("Error assigning order: ", error);
    });
}
```

---

## 🔒 Security & Deployment Checklist
- [ ] **Firebase Authentication:** Ensure the page requires an Admin login (Email/Password). Do not leave the dispatch screen public!
- [ ] **Firestore Rules:** Update Firebase Security Rules so only authenticated users with an "Admin" role can modify the `driverId` field.
  ```text
  match /orders/{orderId} {
      allow update: if request.auth != null && request.auth.token.admin == true;
  }
  ```
- [ ] **Hosting:** Deploy the folder to Firebase Hosting using `firebase deploy --only hosting` so you can access it via a live URL from any computer.
