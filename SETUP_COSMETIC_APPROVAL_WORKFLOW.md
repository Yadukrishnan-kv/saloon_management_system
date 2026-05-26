# Cosmetic Order Approval Workflow - Setup & Implementation

## 🚀 Step 1: Install QR Code Package

**Install qrcode package:**
```bash
cd Server
npm install qrcode
```

**Verify Installation:**
```bash
npm list qrcode
```

Expected output:
```
├── qrcode@1.5.3 (or latest version)
```

---

## 📝 Step 2: Backend Setup Checklist

✅ **Already Completed:**
- [x] Added `approveCosmeticOrder()` function in adminExtendedController.js
- [x] Added `rejectCosmeticOrder()` function in adminExtendedController.js
- [x] Updated CosmeticOrder model with new fields (adminApprovalStatus, qrCode, etc.)
- [x] Updated placeCosmeticOrder() to NOT deduct wallet on order placement
- [x] Added routes: `/api/admin/cosmetics/orders/:orderId/approve`
- [x] Added routes: `/api/admin/cosmetics/orders/:orderId/reject`
- [x] Updated getAdminCosmeticOrders() to filter by approval status

**To Do:**
- [ ] `npm install qrcode` in Server folder
- [ ] Restart server: `npm run dev`
- [ ] Test API endpoints using Postman/curl

---

## 🎨 Step 3: Frontend - Admin Dashboard Updates

### File: `Client/src/pages/Admin/CosmeticManagement/CosmeticManagement.jsx`

**Add New State for Orders Table:**
```javascript
// In your component, add state for cosmetic orders
const [cosmeticOrders, setCosmeticOrders] = useState([]);
const [ordersLoading, setOrdersLoading] = useState(false);
const [selectedOrder, setSelectedOrder] = useState(null);
const [showApprovalModal, setShowApprovalModal] = useState(false);
const [rejectionReason, setRejectionReason] = useState("");
```

**Fetch Pending Orders on Component Load:**
```javascript
const fetchPendingCosmeticOrders = useCallback(async () => {
  try {
    setOrdersLoading(true);
    const response = await axios.get(
      "/api/admin/cosmetics/orders?approvalStatus=Pending",
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    if (response.data.success) {
      setCosmeticOrders(response.data.orders);
    }
  } catch (error) {
    toast.error("Failed to fetch orders");
  } finally {
    setOrdersLoading(false);
  }
}, []);

// Call in useEffect
useEffect(() => {
  fetchPendingCosmeticOrders();
}, []);
```

**Approve Order Function:**
```javascript
const handleApproveOrder = async (orderId) => {
  try {
    const response = await axios.post(
      `/api/admin/cosmetics/orders/${orderId}/approve`,
      {},
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    
    if (response.data.success) {
      toast.success("Order approved successfully!");
      
      // Show QR code to admin
      setSelectedOrder(response.data.order);
      setShowApprovalModal(true);
      
      // Refresh orders list
      fetchPendingCosmeticOrders();
    }
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to approve order");
  }
};
```

**Reject Order Function:**
```javascript
const handleRejectOrder = async (orderId) => {
  if (!rejectionReason.trim()) {
    toast.error("Please provide a rejection reason");
    return;
  }

  try {
    const response = await axios.post(
      `/api/admin/cosmetics/orders/${orderId}/reject`,
      { reason: rejectionReason },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
    
    if (response.data.success) {
      toast.success("Order rejected successfully");
      setRejectionReason("");
      setShowApprovalModal(false);
      fetchPendingCosmeticOrders();
    }
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to reject order");
  }
};
```

**Add Orders Table Component:**
```javascript
{/* Pending Orders Section */}
<div className="mt-8">
  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
    <FiPackage /> Pending Cosmetic Orders ({cosmeticOrders.length})
  </h2>
  
  {ordersLoading ? (
    <Loading />
  ) : cosmeticOrders.length === 0 ? (
    <div className="text-center text-gray-500 py-8">
      No pending orders awaiting approval
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-blue-50">
          <tr>
            <th className="border p-3 text-left">Order ID</th>
            <th className="border p-3 text-left">Beautician</th>
            <th className="border p-3 text-left">Items</th>
            <th className="border p-3 text-right">Amount</th>
            <th className="border p-3 text-left">Date</th>
            <th className="border p-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {cosmeticOrders.map((order) => (
            <tr key={order._id} className="hover:bg-gray-50">
              <td className="border p-3 font-mono text-sm">
                {order._id.slice(0, 8)}...
              </td>
              <td className="border p-3">
                {order.beautician?.fullName} <br />
                <span className="text-xs text-gray-500">
                  {order.beautician?.phoneNumber}
                </span>
              </td>
              <td className="border p-3 text-center">
                {order.items?.length} item(s)
              </td>
              <td className="border p-3 text-right font-bold">
                ₹{order.totalAmount}
              </td>
              <td className="border p-3 text-sm">
                {new Date(order.createdAt).toLocaleDateString()}
              </td>
              <td className="border p-3 text-center">
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowApprovalModal(true);
                    }}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                  >
                    Review
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

{/* Order Approval/Rejection Modal */}
{showApprovalModal && selectedOrder && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <h3 className="text-xl font-bold mb-4">Order Review</h3>
      
      <div className="mb-4 space-y-2 text-sm">
        <p><strong>Order ID:</strong> {selectedOrder._id}</p>
        <p><strong>Beautician:</strong> {selectedOrder.beautician?.fullName}</p>
        <p><strong>Amount:</strong> ₹{selectedOrder.totalAmount}</p>
        <p><strong>Items:</strong> {selectedOrder.items?.length}</p>
      </div>

      {/* Show QR Code if Approved */}
      {selectedOrder.qrCode && (
        <div className="mb-4 text-center">
          <img 
            src={selectedOrder.qrCode} 
            alt="Order QR Code" 
            className="w-32 h-32 mx-auto border-2 border-gray-300 p-2"
          />
          <p className="text-xs text-gray-500 mt-2">QR Code Generated</p>
        </div>
      )}

      {/* Rejection Reason Input */}
      {selectedOrder.adminApprovalStatus === "Pending" && !selectedOrder.qrCode && (
        <textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Enter rejection reason (required)"
          className="w-full border p-2 rounded mb-4 text-sm"
          rows="3"
        />
      )}

      <div className="flex gap-2">
        {selectedOrder.adminApprovalStatus === "Pending" && !selectedOrder.qrCode && (
          <>
            <button
              onClick={() => handleApproveOrder(selectedOrder._id)}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              ✓ Approve
            </button>
            <button
              onClick={() => handleRejectOrder(selectedOrder._id)}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              ✗ Reject
            </button>
          </>
        )}
        <button
          onClick={() => {
            setShowApprovalModal(false);
            setSelectedOrder(null);
            setRejectionReason("");
          }}
          className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
```

---

## 🧪 Step 4: Test the Complete Workflow

### Test Case 1: Place Order (Pending Approval)
```
1. Login as Beautician
2. Place cosmetic order
3. Verify response: adminApprovalStatus = "Pending"
4. Verify wallet NOT deducted
```

### Test Case 2: Admin Views Pending Orders
```
1. Login as Admin
2. Open Cosmetic Management
3. See "Pending Cosmetic Orders" section
4. View pending orders in table
```

### Test Case 3: Admin Approves Order
```
1. Click "Review" on pending order
2. Click "Approve" button
3. Verify: QR code displayed
4. Verify: Order status = "Approved"
5. Verify: Wallet deducted
6. Verify: Beautician receives notification
```

### Test Case 4: Admin Rejects Order
```
1. Click "Review" on pending order
2. Enter rejection reason
3. Click "Reject" button
4. Verify: Order status = "Rejected"
5. Verify: NO wallet deduction
6. Verify: Beautician receives rejection notification
```

---

## 🔗 Integration Points

### 1. Notifications Component
```javascript
// After approval, beautician should see in notifications:
{
  title: "Cosmetic Order Approved ✓",
  message: "Your order of ₹{amount} has been approved. QR code generated.",
  data: { qrCode: "..." }
}
```

### 2. Mobile App Integration
- Add QR code display in beautician's order details
- Show approval status in order list
- Allow beautician to share QR code for delivery

### 3. Dashboard Metrics
- Count of pending approvals
- Approval rate (approved vs rejected)
- Average approval time

---

## 📊 Database Query Examples

### Get All Pending Orders
```javascript
db.cosmeticorders.find({ adminApprovalStatus: "Pending" })
```

### Get All Approved Orders with QR Codes
```javascript
db.cosmeticorders.find({ 
  adminApprovalStatus: "Approved",
  qrCode: { $exists: true }
})
```

### Get All Rejected Orders with Reasons
```javascript
db.cosmeticorders.find({ 
  adminApprovalStatus: "Rejected"
})
```

---

## ⚙️ Environment Setup

No new environment variables needed. The workflow uses existing:
- `MONGODB_URI` - Database connection
- `JWT_SECRET` - Authentication

---

## 🔐 Permissions

| Role | Can Approve | Can Reject | Can View QR |
|------|-------------|-----------|------------|
| Admin | ✅ | ✅ | ✅ |
| SuperAdmin | ✅ | ✅ | ✅ |
| Beautician | ❌ | ❌ | ✅ |
| Customer | ❌ | ❌ | ❌ |

---

## 📝 API Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/cosmetics/orders?approvalStatus=Pending` | Fetch pending orders |
| POST | `/api/admin/cosmetics/orders/:orderId/approve` | Approve & charge wallet |
| POST | `/api/admin/cosmetics/orders/:orderId/reject` | Reject & notify |

---

## ✅ Completion Checklist

- [ ] Install qrcode package: `npm install qrcode`
- [ ] Restart server
- [ ] Test approve endpoint with Postman
- [ ] Test reject endpoint with Postman
- [ ] Verify wallet deduction on approval
- [ ] Verify NO deduction on rejection
- [ ] Add pending orders table to admin UI
- [ ] Add approval/rejection modal
- [ ] Test complete beautician → admin → beautician flow
- [ ] Verify QR code generation
- [ ] Test notifications delivery

---

## 🚨 Troubleshooting

### Issue: "qrcode module not found"
**Solution:** Run `npm install qrcode` in Server folder

### Issue: "Order already approved"
**Solution:** The order was already processed. Refresh the orders list.

### Issue: "Insufficient wallet balance"
**Solution:** Admin tried to approve, but beautician's wallet balance is too low

### Issue: QR code not displaying
**Solution:** Ensure the response includes `qrCode` field with base64 data URL

---

## 📚 Resources

- QR Code Library: https://github.com/davidshimjs/qrcodejs
- Mongoose Population: https://mongoosejs.com/docs/populate.html
- Express Error Handling: https://expressjs.com/en/guide/error-handling.html

---

**Implementation Complete!** 🎉

All backend functions, routes, and database updates are ready. Frontend UI and mobile app integration can now be implemented using the provided code examples.
