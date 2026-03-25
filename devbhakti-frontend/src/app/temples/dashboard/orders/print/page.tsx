"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { fetchTempleOrders, fetchMyTempleProfile } from "@/api/templeAdminController";
import { format } from "date-fns";

function PrintLabelsContent() {
    const searchParams = useSearchParams();
    const [orders, setOrders] = useState<any[]>([]);
    const [templeData, setTempleData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const orderIds = searchParams.get("ids")?.split(",") ?? [];

    useEffect(() => {
        const load = async () => {
            try {
                const profileRes = await fetchMyTempleProfile();
                if (profileRes.success) {
                    setTempleData(profileRes.data);
                    const ordersRes = await fetchTempleOrders(profileRes.data.id);
                    if (ordersRes.success) {
                        const filtered = ordersRes.data.filter((o: any) => orderIds.includes(o.id));
                        setOrders(filtered);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (!isLoading && orders.length > 0) {
            setTimeout(() => window.print(), 800);
        }
    }, [isLoading, orders]);

    if (isLoading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif" }}>
                <p>Preparing invoices, please wait...</p>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif" }}>
                <p>No orders found to print.</p>
            </div>
        );
    }

    return (
        <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />

            <style>{`
                * { box-sizing: border-box  !important; }
                body { 
                    font-family: 'Roboto', sans-serif; 
                    margin: 0; 
                    padding: 0; 
                    color: #333; 
                    background: #f1f5f9;
                }
                
                .no-print {
                    background: white;
                    padding: 16px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    display: flex;
                    justify-content: center;
                    gap: 16px;
                    border-bottom: 1px solid #e2e8f0;
                }
                
                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 24px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    text-decoration: none;
                }
                .btn-print { background: #794A05; color: white; border: none; }
                .btn-back { background: #fff; color: #333; border: 1px solid #ddd; }
                
                .page {
                    background: white;
                    width: 210mm;
                    min-height: 297mm;
                    margin: 40px auto;
                    padding: 30px;
                    box-sizing: border-box;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    position: relative;
                }
                
                .logo-section {
                    text-align: center;
                    margin-bottom: 15px;
                }
                .logo-title {
                    font-size: 20px;
                    font-weight: 700;
                    color: #794A05;
                }
                
                .invoice-title-wrapper {
                    text-align: center;
                    border-bottom: 2px solid #ccc;
                    padding-bottom: 15px;
                    margin-bottom: 25px;
                }
                .invoice-title {
                    font-size: 22px;
                    font-weight: 500;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }
                
                .grid-3 {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 30px;
                    font-size: 11px;
                }
                
                .column h4 {
                    font-size: 11px;
                    font-weight: 700;
                    margin: 0 0 10px 0;
                    text-transform: uppercase;
                }
                
                .column-content {
                    line-height: 1.5;
                }
                
                .col-border {
                    border-left: 1px dashed #ccc;
                    padding-left: 15px;
                }
                
                .detail-row {
                    display: flex;
                    margin-bottom: 4px;
                }
                .detail-label {
                    width: 85px;
                    font-weight: 700;
                    text-transform: uppercase;
                    font-size: 10px;
                }
                .detail-value {
                    flex: 1;
                }
                
                table.items {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    font-size: 10px;
                }
                table.items th {
                    text-align: center;
                    text-transform: uppercase;
                    padding: 6px 4px;
                    border-top: 1px solid #eee;
                    border-bottom: 1px solid #ccc;
                    font-weight: 700;
                }
                table.items td {
                    padding: 10px 4px;
                    text-align: center;
                    border-bottom: 1px solid #eee;
                }
                table.items td.text-left, table.items th.text-left {
                    text-align: left;
                }
                table.items td.text-right, table.items th.text-right {
                    text-align: right;
                }
                
                .totals-section {
                    display: flex;
                    justify-content: space-between;
                    border-top: 1px solid #ccc;
                    border-bottom: 1px solid #ccc;
                    padding: 10px 0;
                    margin-bottom: 20px;
                }
                .totals-left {
                    flex: 1;
                }
                .totals-right {
                    width: 250px;
                }
                .total-line {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 6px;
                    font-size: 11px;
                }
                .total-line.grand {
                    font-size: 13px;
                    font-weight: 700;
                    margin-top: 8px;
                }
                
                .footer-box {
                    border: 1px solid #999;
                    width: 180px;
                    height: 50px;
                    margin-bottom: 8px;
                }
                .footer-sign {
                    font-size: 10px;
                    font-weight: 700;
                }
                
                @media print {
                    .no-print { display: none !important; }
                    body { background: white; }
                    .page { 
                        box-shadow: none; 
                        margin: 0; 
                        padding: 0; 
                        width: 100%; 
                        height: auto; 
                        page-break-after: always;
                    }
                    .page:last-child {
                        page-break-after: auto;
                    }
                }
            `}</style>

            <div className="no-print">
                <button onClick={() => window.history.back()} className="btn btn-back">
                    Back to Orders
                </button>
                <button onClick={() => window.print()} className="btn btn-print">
                    Print Invoices
                </button>
            </div>

            <div style={{ paddingTop: "20px" }}>
                {orders.map((order) => {
                    const parentOrder = order.order || {};
                    const shippingAddress = parentOrder.shippingAddress || {};
                    const allItems = order.items || [];

                    return (
                        <div key={order.id} className="page">
                            <div className="logo-section">
                                <div className="logo-title">DevBhakti</div>
                            </div>

                            <div className="invoice-title-wrapper">
                                <span className="invoice-title">INVOICE</span>
                            </div>

                            <div className="grid-3">
                                <div className="column">
                                    <h4>SHIPPING ADDRESS:</h4>
                                    <div className="column-content">
                                        <strong>{shippingAddress.fullName || parentOrder.user?.name}</strong><br />
                                        {shippingAddress.street || "N/A"}<br />
                                        {shippingAddress.city} {shippingAddress.pincode}<br />
                                        {shippingAddress.state}<br />
                                        India<br />
                                        Ph: {shippingAddress.phone || parentOrder.user?.phone}
                                    </div>
                                </div>

                                <div className="column col-border">
                                    <h4>SOLD BY:</h4>
                                    <div className="column-content">
                                        <div style={{ marginBottom: 0 }}>
                                            <strong>{templeData?.name || order.temple?.name || "DevBhakti Seller"}</strong><br />
                                            {templeData?.location || order.temple?.fullAddress || "Indore, MP"}
                                        </div>
                                        <br />
                                        Website: DevBhakti.in<br />
                                        Email: admin@devbhakti.in
                                    </div>
                                </div>

                                <div className="column col-border">
                                    <h4>INVOICE DETAILS:</h4>
                                    <div className="column-content">
                                        <div className="detail-row">
                                            <span className="detail-label">INVOICE NO</span>
                                            <span className="detail-value">: INV-{order.id.slice(-6).toUpperCase()}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">INVOICE DATE</span>
                                            <span className="detail-value">: {format(new Date(order.createdAt), "dd MMMM yyyy")}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">ORDER NO</span>
                                            <span className="detail-value">: {parentOrder.id?.slice(-8).toUpperCase() || order.id.slice(-8).toUpperCase()}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">ORDER DATE</span>
                                            <span className="detail-value">: {format(new Date(parentOrder.createdAt || order.createdAt), "dd MMMM yyyy")}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">CHANNEL</span>
                                            <span className="detail-value">: CUSTOM DEVBHAKTI</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">PAYMENT<br />METHOD</span>
                                            <span className="detail-value">: {parentOrder.paymentMethod === 'COD' ? 'cod' : 'prepaid'}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">REMARK</span>
                                            <span className="detail-value">: Custom Order</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <table className="items">
                                <thead>
                                    <tr>
                                        <th className="text-left" style={{ width: "5%" }}>S.NO</th>
                                        <th className="text-left" style={{ width: "35%" }}>PRODUCT NAME</th>
                                        <th style={{ width: "5%" }}>HSN</th>
                                        <th style={{ width: "5%" }}>QTY</th>
                                        <th className="text-right" style={{ width: "10%" }}>UNIT PRICE</th>
                                        <th className="text-right" style={{ width: "10%" }}>DISCOUNT</th>
                                        <th className="text-right" style={{ width: "10%" }}>TAXABLE<br />VALUE</th>
                                        <th className="text-right" style={{ width: "10%" }}>CGST<br />(Value | %)</th>
                                        <th className="text-right" style={{ width: "10%" }}>SGST<br />(Value | %)</th>
                                        <th className="text-right" style={{ width: "10%" }}>TOTAL<br />(Inc GST)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allItems.map((item: any, idx: number) => (
                                        <tr key={item.id}>
                                            <td className="text-left">{idx + 1}</td>
                                            <td className="text-left">
                                                <strong>{item.product?.name || "Item"}</strong> ({item.variantName || "Standard"})<br />
                                                <span style={{ color: "#666", fontSize: "10px" }}>SKU: {item.variantId || "N/A"}</span>
                                            </td>
                                            <td>0</td>
                                            <td>{item.quantity}</td>
                                            <td className="text-right">Rs. {Number(item.price).toFixed(2)}</td>
                                            <td className="text-right">0.00</td>
                                            <td className="text-right">{(item.price * item.quantity).toFixed(2)}</td>
                                            <td className="text-right">0.00 | 0.00</td>
                                            <td className="text-right">0.00 | 0.00</td>
                                            <td className="text-right">{(item.price * item.quantity).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="totals-section">
                                <div className="totals-left">
                                    <div className="footer-box"></div>
                                    <div className="footer-sign">
                                        Authorized Signature for<br />
                                        {templeData?.name || order.temple?.name || "DevBhakti Seller"}
                                    </div>
                                </div>

                                <div className="totals-right">
                                    <div className="total-line">
                                        <span>Items Subtotal</span>
                                        <span>Rs. {order.totalAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="total-line">
                                        <span>Platform Service fee</span>
                                        <span>Rs. {(order.commissionAmount || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="total-line">
                                        <span>Shipping Costs</span>
                                        <span>{(parentOrder.shippingCost || 0) > 0 ? "Rs. " + (parentOrder.shippingCost || 0).toFixed(2) : "0.00"}</span>
                                    </div>
                                    <div className="total-line grand">
                                        <span>AMOUNT PAYABLE</span>
                                        <span>Rs. {(order.totalAmount + (order.commissionAmount || 0) + (parentOrder.shippingCost || 0)).toFixed(2)}</span>
                                    </div>
                                    <br />
                                    <div className="total-line text" style={{ justifyContent: "flex-end", fontSize: "12px", fontWeight: 500 }}>
                                        Whether tax is payable under reverse charge - No
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}

export default function TemplePrintLabelsPage() {
    return (
        <Suspense fallback={<div style={{ fontFamily: "sans-serif", textAlign: "center", padding: 40 }}>Loading labels...</div>}>
            <PrintLabelsContent />
        </Suspense>
    );
}
