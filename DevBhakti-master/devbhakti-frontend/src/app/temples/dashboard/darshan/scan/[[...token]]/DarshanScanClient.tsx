"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_URL } from "@/config/apiConfig";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  ScanLine, 
  CheckCircle2, 
  XCircle, 
  User, 
  Calendar, 
  Clock, 
  Users,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

export default function DarshanScanClient() {
  const params = useParams();
  const tokenParam = params?.token?.[0]; // [[...token]] makes it an array
  const { toast } = useToast();
  const router = useRouter();

  const [tokenInput, setTokenInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState<string>("");

  useEffect(() => {
    if (tokenParam) {
      setTokenInput(tokenParam);
      verifyToken(tokenParam);
    }
  }, [tokenParam]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    
    // Clear URL so they can scan another without refresh
    router.replace("/temples/dashboard/darshan/scan");
    verifyToken(tokenInput.trim());
  };

  const verifyToken = async (qrToken: string) => {
    setIsScanning(true);
    setScanResult(null);
    setScanError("");
    
    try {
      const adminToken = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/temple-admin/darshan/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ qrToken })
      });

      const json = await res.json();
      
      if (res.ok) {
        setScanResult(json.ticket);
      } else {
        setScanError(json.error || "Invalid QR Pass");
      }
    } catch (err) {
      console.error(err);
      setScanError("Connection error while verifying ticket.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-center">Scanner</h1>
        <p className="text-muted-foreground mt-1 text-center">Verify Darshan tickets at the entrance.</p>
      </div>

      <Card className="border-2 shadow-lg border-primary/10">
        <CardContent className="p-8">
          <form onSubmit={handleManualSubmit} className="space-y-4 max-w-md mx-auto">
            <div className="text-center space-y-2 mb-6">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <ScanLine className="w-8 h-8 text-primary" />
              </div>
              {/* <p className="text-sm font-medium">Scan QR code using device camera (if supported) or enter token manually.</p> */}
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Enter Ticket Token..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="h-12 text-center text-lg tracking-wider font-mono"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isScanning}>
              {isScanning ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Verifying...</> : "Verify Pass"}
            </Button>
          </form>

          {/* Result Section */}
          <div className="mt-8">
            {isScanning && (
              <div className="flex flex-col items-center justify-center text-primary py-8">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p className="font-semibold text-lg animate-pulse">Checking database...</p>
              </div>
            )}

            {!isScanning && scanError && (
              <div className="bg-red-50 text-red-700 p-8 rounded-2xl flex flex-col items-center text-center border-2 border-red-200">
                <XCircle className="w-16 h-16 text-red-500 mb-4" />
                <h3 className="text-2xl font-black uppercase tracking-wider mb-2">Access Denied</h3>
                <p className="text-lg font-medium">{scanError}</p>
              </div>
            )}

            {!isScanning && scanResult && (
              <div className="bg-green-50 text-green-800 p-6 md:p-8 rounded-2xl border-2 border-green-200">
                <div className="flex flex-col items-center text-center mb-6">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mb-3" />
                  <h3 className="text-2xl font-black uppercase tracking-wider text-green-700">Valid Pass</h3>
                  <p className="text-sm font-bold text-green-600/80 bg-green-200/50 px-3 py-1 rounded-full mt-2">
                    ID: {scanResult.displayId || scanResult.id.substring(0,8).toUpperCase()}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Date</p>
                      <p className="font-semibold">{format(new Date(scanResult.slot.date), "dd MMM yyyy")}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Time</p>
                      <p className="font-semibold">{scanResult.slot.startTime}</p>
                    </div>
                  </div>

                  <div className="border-t border-green-100 pt-4">
                     <p className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Allow Entry</p>
                     <p className="text-3xl font-black text-[#5c3a21]">{scanResult.visitorCount} Person(s)</p>
                  </div>

                  <div className="border-t border-green-100 pt-4">
                     <p className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Devotee Details</p>
                     <p className="font-semibold">{scanResult.visitorName}</p>
                     <p className="text-sm text-muted-foreground">{scanResult.visitorPhone}</p>
                  </div>
                </div>

                <div className="mt-6 text-center text-xs font-bold text-green-700/60 uppercase tracking-widest">
                  Status Updated to USED
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
