"use client";

import React, { useEffect, useState } from "react";
import { Eye, Loader2, Radio, Video, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { fetchAllTemplesAdmin, toggleTempleStatusAdmin, updateTempleLiveConfigAdmin } from "@/api/adminController";

const getEmbedUrl = (value: string) => {
  if (!value) return "";
  const url = value.trim();

  if (url.startsWith("UC") && !url.includes("/") && !url.includes(".")) {
    return `https://www.youtube.com/embed/live_stream?channel=${url}`;
  }
  if (url.includes("youtu.be/")) {
    return url.replace("youtu.be/", "www.youtube.com/embed/");
  }
  if (url.includes("watch?v=")) {
    return url.replace("watch?v=", "embed/");
  }
  if (url.includes("youtube.com")) {
    return url;
  }
  return url;
};

export default function AdminLiveDarshanPage() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [temples, setTemples] = useState<any[]>([]);
  const [allTemples, setAllTemples] = useState<any[]>([]);

  const [selectedTemple, setSelectedTemple] = useState<any | null>(null);
  const [editChannelId, setEditChannelId] = useState("");
  const [editLiveUrl, setEditLiveUrl] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchAllTemplesAdmin();
        const actualTemples = data
          .filter((user: any) => user.temple)
          .map((user: any) => ({
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            userPhone: user.phone,
            isVerified: user.isVerified,
            temple: user.temple,
          }));

        setAllTemples(actualTemples);

        const liveCandidates = actualTemples.filter((t: any) => {
          const temple = t.temple;
          if (!temple) return false;
          const hasSelfLive = temple.isLive;
          const hasUrlOrChannel = temple.liveUrl || temple.channelId;
          return hasSelfLive && hasUrlOrChannel;
        });

        setTemples(liveCandidates);
      } catch (error) {
        console.error("Failed to load live temples", error);
        toast({
          title: "Error",
          description: "Failed to load live darshan temples",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [toast]);

  const handleToggleAdminLive = async (entry: any) => {
    try {
      await toggleTempleStatusAdmin(entry.userId, entry.isVerified, entry.temple?.isActive ?? true, {
        liveStatus: !entry.temple?.liveStatus,
      });
      toast({
        title: "Updated",
        description: `Temple live visibility ${!entry.temple?.liveStatus ? "enabled" : "disabled"} on website.`,
      });

      const data = await fetchAllTemplesAdmin();
      const actualTemples = data
        .filter((user: any) => user.temple)
        .map((user: any) => ({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          userPhone: user.phone,
          isVerified: user.isVerified,
          temple: user.temple,
        }));
      const liveCandidates = actualTemples.filter((t: any) => {
        const temple = t.temple;
        if (!temple) return false;
        const hasSelfLive = temple.isLive;
        const hasUrlOrChannel = temple.liveUrl || temple.channelId;
        return hasSelfLive && hasUrlOrChannel;
      });
      setTemples(liveCandidates);
    } catch (error: any) {
      console.error("Toggle admin live error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update live visibility",
        variant: "destructive",
      });
    }
  };

  const openEditModal = (entry: any) => {
    setIsAddMode(false);
    setSelectedTemple(entry);
    setEditChannelId(entry.temple?.channelId || "");
    setEditLiveUrl(entry.temple?.liveUrl || "");
  };

  const openAddModal = () => {
    if (allTemples.length === 0) {
      toast({
        title: "No temples found",
        description: "Pehle temples create/approve kariye, phir unke liye live configure kar sakte hain.",
        variant: "destructive",
      });
      return;
    }
    const entry = allTemples[0];
    setIsAddMode(true);
    setSelectedTemple(entry);
    setEditChannelId(entry.temple?.channelId || "");
    setEditLiveUrl(entry.temple?.liveUrl || "");
  };

  const handleSaveConfig = async () => {
    if (!selectedTemple) return;
    setSavingConfig(true);
    try {
      const trimmedChannel = editChannelId.trim();
      const trimmedUrl = editLiveUrl.trim();

      // Admin add mode: mark temple live + visible by default
      if (isAddMode) {
        await updateTempleLiveConfigAdmin(selectedTemple.userId, {
          channelId: trimmedChannel,
          liveUrl: trimmedUrl,
          isLive: true,
        });
        await toggleTempleStatusAdmin(
          selectedTemple.userId,
          selectedTemple.isVerified,
          selectedTemple.temple?.isActive ?? true,
          { liveStatus: true }
        );
      } else {
        await updateTempleLiveConfigAdmin(selectedTemple.userId, {
          channelId: trimmedChannel,
          liveUrl: trimmedUrl,
        });
      }
      toast({
        title: "Saved",
        description: "Live configuration updated successfully.",
      });

      const data = await fetchAllTemplesAdmin();
      const actualTemples = data
        .filter((user: any) => user.temple)
        .map((user: any) => ({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          userPhone: user.phone,
          isVerified: user.isVerified,
          temple: user.temple,
        }));
      setAllTemples(actualTemples);
      const liveCandidates = actualTemples.filter((t: any) => {
        const temple = t.temple;
        if (!temple) return false;
        const hasSelfLive = temple.isLive;
        const hasUrlOrChannel = temple.liveUrl || temple.channelId;
        return hasSelfLive && hasUrlOrChannel;
      });
      setTemples(liveCandidates);
      setSelectedTemple(null);
      setIsAddMode(false);
    } catch (error: any) {
      console.error("Save live config error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save live config",
        variant: "destructive",
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const previewEmbed = getEmbedUrl(editLiveUrl || editChannelId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Video className="w-6 h-6 text-primary" />
            Live Darshan Control
          </h1>
          <p className="text-slate-600 text-sm">
            Temples jinhone apne panel se Live ON kiya hai aur URL dala hai, unko yahan se website par dikhane/na dikhane ka control karein.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={openAddModal}>
            Add Live Darshan
          </Button>
        </div>
      </div>

      <Card className="border rounded-xl bg-card overflow-hidden shadow-sm">
        <CardHeader className="border-b bg-slate-50/80">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Radio className="w-4 h-4 text-destructive" />
            Live Temples ({temples.length})
          </CardTitle>
          <CardDescription className="text-xs">
            List me sirf wahi temples hain jinhone apni profile se Live toggle ON rakha hai aur live URL / channel ID diya hai.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading live temples...</span>
            </div>
          ) : temples.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              Abhi kisi temple ne apne panel se Live ON nahi kiya hai ya URL nahi diya hai.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Temple</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Live Source</TableHead>
                  <TableHead>Website Visibility</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {temples.map((entry) => (
                  <TableRow key={entry.userId}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-slate-900">{entry.temple?.name || "N/A"}</span>
                        <span className="text-xs text-slate-600">{entry.temple?.location || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-xs text-slate-700">
                        <span>{entry.userName}</span>
                        <span className="text-slate-500">{entry.userEmail || entry.userPhone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs max-w-xs">
                        <span className="text-slate-600 truncate">
                          Channel: {entry.temple?.channelId || "—"}
                        </span>
                        <span className="text-slate-600 truncate">
                          URL: {entry.temple?.liveUrl || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium ${
                            entry.temple?.liveStatus
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-50 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {entry.temple?.liveStatus ? (
                            <>
                              <Power className="w-3 h-3" /> On Homepage
                            </>
                          ) : (
                            <>
                              <PowerOff className="w-3 h-3" /> Hidden
                            </>
                          )}
                        </div>
                        <Switch
                          checked={entry.temple?.liveStatus || false}
                          onCheckedChange={() => handleToggleAdminLive(entry)}
                          disabled={!entry.isVerified}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-700"
                        onClick={() => openEditModal(entry)}
                        title="View & Edit Live Config"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedTemple} onOpenChange={(open) => !open && setSelectedTemple(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex flex-col gap-1">
              Live Config – {selectedTemple?.temple?.name}
              <span className="text-xs font-normal text-slate-500">
                {selectedTemple?.temple?.location}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-4">
              {isAddMode && (
                <div className="space-y-2">
                  <Label className="text-slate-700 text-xs">Temple</Label>
                  <select
                    value={selectedTemple?.userId || ""}
                    onChange={(e) => {
                      const entry = allTemples.find((t) => t.userId === e.target.value);
                      if (!entry) return;
                      setSelectedTemple(entry);
                      setEditChannelId(entry.temple?.channelId || "");
                      setEditLiveUrl(entry.temple?.liveUrl || "");
                    }}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
                  >
                    {allTemples.map((entry) => (
                      <option key={entry.userId} value={entry.userId}>
                        {entry.temple?.name || "Untitled Temple"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-slate-700 text-xs">YouTube Channel ID</Label>
                <Input
                  value={editChannelId}
                  onChange={(e) => setEditChannelId(e.target.value)}
                  placeholder="UC..."
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 text-xs">Watch URL</Label>
                <Input
                  value={editLiveUrl}
                  onChange={(e) => setEditLiveUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="h-9 text-sm"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Temple apne panel se bhi ye values change kar sakta hai. Yahan se aap emergency me correct kar sakte hain.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTemple(null)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveConfig}
                  disabled={savingConfig}
                >
                  {savingConfig && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                  Save
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-slate-700 text-xs">Preview</Label>
              {previewEmbed ? (
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                  <iframe
                    src={`${previewEmbed}?autoplay=1&mute=1&rel=0`}
                    title="Live Preview"
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (
                <div className="aspect-video w-full rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400 text-center px-4">
                  Channel ID ya URL daalein preview ke liye.
                </div>
              )}
              <p className="text-[11px] text-slate-500">
                Ye sirf admin preview hai. Public ke liye final experience landing Live section aur `/live-darshan` page par dikhega.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}