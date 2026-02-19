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
            setTimeout(() => window.print(), 500);
        }
    }, [isLoading, orders]);

    if (isLoading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif" }}>
                <p>Preparing labels, please wait...</p>
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
            <style>{`
                * { box-sizing: border-box; }
                body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; }
                .no-print { display: block; }
                @media print {
                    .no-print { display: none !important; }
                    .label-page { page-break-after: always; page-break-inside: avoid; }
                    .label-page:last-child { page-break-after: auto; }
                }
                @import url('https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap');
            `}</style>

            {/* Screen-only print button */}
            <div className="no-print" style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, display: "flex", gap: 8 }}>
                <button
                    onClick={() => window.print()}
                    style={{ background: "#794A05", color: "#fff", border: "none", padding: "10px 22px", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: "pointer" }}
                >
                    🖨️ Print Now
                </button>
                <button
                    onClick={() => window.close()}
                    style={{ background: "#eee", color: "#333", border: "none", padding: "10px 22px", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: "pointer" }}
                >
                    ✕ Close
                </button>
            </div>

            {orders.map((order, idx) => (
                <div key={order.id} className="label-page" style={{ padding: "30px 40px", maxWidth: 800, margin: "0 auto", borderBottom: idx < orders.length - 1 ? "2px dashed #ccc" : "none" }}>

                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #000", paddingBottom: 12, marginBottom: 20 }}>
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: "#794A05" }}>DevBhakti</div>
                            <div style={{ fontSize: 11, color: "#666", fontWeight: 600 }}>www.devbhakti.in</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", fontWeight: 700 }}>Sub-Order ID</div>
                            <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 1 }}>#{order.id.slice(-12).toUpperCase()}</div>
                            <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                                {format(new Date(order.createdAt), "dd MMM yyyy")}
                            </div>
                        </div>
                    </div>

                    {/* Addresses */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, marginBottom: 24 }}>
                        <div style={{ background: "#f9f9f9", borderRadius: 8, padding: "12px 16px" }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: "#888", textTransform: "uppercase", marginBottom: 8, letterSpacing: 1 }}>📦 Ship To</div>
                            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{order.order?.shippingAddress?.fullName || order.order?.user?.name}</div>
                            <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6 }}>
                                {order.order?.shippingAddress?.street && <div>{order.order.shippingAddress.street}</div>}
                                {(order.order?.shippingAddress?.city || order.order?.shippingAddress?.state) && (
                                    <div>{[order.order?.shippingAddress?.city, order.order?.shippingAddress?.state].filter(Boolean).join(", ")}</div>
                                )}
                                {order.order?.shippingAddress?.pincode && (
                                    <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: 2, marginTop: 4 }}>{order.order.shippingAddress.pincode}</div>
                                )}
                                {(order.order?.shippingAddress?.phone || order.order?.user?.phone) && (
                                    <div style={{ marginTop: 6, color: "#555" }}>📞 {order.order?.shippingAddress?.phone || order.order?.user?.phone}</div>
                                )}
                            </div>
                        </div>

                        <div style={{ background: "#fff8f0", borderRadius: 8, padding: "12px 16px" }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: "#794A05", textTransform: "uppercase", marginBottom: 8, letterSpacing: 1 }}>🏛️ Ship From</div>
                            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, color: "#794A05" }}>{templeData?.name || "Temple"}</div>
                            <div style={{ fontSize: 12, color: "#555" }}>{templeData?.location || ""}</div>

                            <div style={{ marginTop: 12, border: "1.5px dashed #794A05", borderRadius: 6, padding: "8px 12px", textAlign: "center" }}>
                                <div style={{ fontSize: 10, color: "#794A05", fontWeight: 700, textTransform: "uppercase" }}>Payment Mode</div>
                                <div style={{ fontSize: 16, fontWeight: 900, marginTop: 2, color: "#333" }}>
                                    {order.order?.paymentMethod?.toUpperCase() || "PREPAID"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
                        <thead>
                            <tr style={{ background: "#f9f9f9", borderBottom: "2px solid #eee" }}>
                                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 800, color: "#666", textTransform: "uppercase", letterSpacing: 1 }}>Item Description</th>
                                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 800, color: "#666", textTransform: "uppercase", letterSpacing: 1 }}>Variant</th>
                                <th style={{ padding: "8px 12px", textAlign: "center", fontSize: 10, fontWeight: 800, color: "#666", textTransform: "uppercase", letterSpacing: 1 }}>Qty</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items?.map((item: any) => (
                                <tr key={item.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                                    <td style={{ padding: "10px 12px", fontWeight: 700, fontSize: 13 }}>{item.product?.name}</td>
                                    <td style={{ padding: "10px 12px", color: "#555", fontSize: 12 }}>{item.variantName || "Standard"}</td>
                                    <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 900, fontSize: 15 }}>{item.quantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Footer */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "2px solid #eee", paddingTop: 16 }}>
                        <div style={{ fontSize: 10, color: "#aaa" }}>
                            Printed via DevBhakti Dashboard<br />
                            {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontFamily: "'Libre Barcode 39', cursive", fontSize: 38, fontWeight: 700, lineHeight: 1 }}>
                                *{order.id.slice(0, 10).toUpperCase()}*
                            </div>
                            <div style={{ fontSize: 9, color: "#999", marginTop: 2, letterSpacing: 1 }}>TRACKING CODE</div>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
}

export default function PrintLabelsPage() {
    return (
        <Suspense fallback={<div style={{ fontFamily: "sans-serif", textAlign: "center", padding: 40 }}>Loading labels...</div>}>
            <PrintLabelsContent />
        </Suspense>
    );
}
