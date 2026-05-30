import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";

const OrderQRCodesModal = ({ order, onClose }) => {
  const backendUrl = process.env.REACT_APP_BACKEND_IP;
  const [qrItems, setQrItems] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (!order) return;
    const fetchQRCodes = async () => {
      setLoading(true);
      try {
        // Fetch all inventory for this order only
        const { data } = await axios.get(`${backendUrl}/api/inventory/admin/inventory`, {
          params: { orderId: order._id },
        });
        // If API returns grouped by product, flatten all items for this order
        let allItems = [];
        if (Array.isArray(data.inventory)) {
          data.inventory.forEach(prod => {
            if (Array.isArray(prod.items)) allItems = allItems.concat(prod.items);
          });
        }
        setQrItems(allItems);
      } catch (err) {
        setQrItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchQRCodes();
  }, [order, backendUrl]);

  const handlePrint = () => {
    const doc = new jsPDF();
    qrItems.forEach((item, idx) => {
      if (idx !== 0) doc.addPage();
      doc.text(`QR Code:`, 10, 10);
      if (item.qrImage) {
        doc.addImage(item.qrImage, "PNG", 10, 20, 60, 60);
      }
      doc.text(`Status: ${item.status}`, 10, 90);
      doc.text(`Inventory ID: ${item._id}`, 10, 100);
      doc.text(`QR: ${item.qrCode}`, 10, 110);
    });
    doc.save(`Order_${order._id}_QRCodes.pdf`);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 600, padding: 24 }}>
        <h2>QR Codes for Order #{order._id}</h2>
        <button onClick={onClose} style={{ float: "right", marginTop: -40, marginRight: -10 }}>Close</button>
        <button onClick={handlePrint} style={{ marginBottom: 16, background: "#6366f1", color: "#fff", border: "none", borderRadius: 4, padding: "8px 18px", fontWeight: 500, cursor: "pointer" }}>Print All QR Codes</button>
        {loading ? (
          <p>Loading QR codes...</p>
        ) : qrItems.length === 0 ? (
          <p>No QR codes found for this order.</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
            {qrItems.map((item) => (
              <div key={item._id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, background: "#fafbfc", minWidth: 160, textAlign: "center" }}>
                <div><strong>{item.productId?.name || item.productId}</strong></div>
                <img src={item.qrImage} alt="QR" style={{ width: 100, margin: "10px 0" }} />
                <div>Status: {item.status}</div>
                <div style={{ fontSize: 12, color: "#888" }}>ID: {item._id}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderQRCodesModal;
