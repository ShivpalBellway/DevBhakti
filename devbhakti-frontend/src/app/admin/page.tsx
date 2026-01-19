"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  Calendar,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Video,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  {
    title: "Total Institutions",
    value: "524",
    change: "+12%",
    trend: "up",
    icon: Building2,
    color: "bg-primary",
  },
  {
    title: "Active Users",
    value: "52,847",
    change: "+8.2%",
    trend: "up",
    icon: Users,
    color: "bg-secondary",
  },
  {
    title: "Total Bookings",
    value: "12,543",
    change: "+15%",
    trend: "up",
    icon: Calendar,
    color: "bg-accent",
  },
  {
    title: "Revenue",
    value: "₹24.5L",
    change: "+22%",
    trend: "up",
    icon: CreditCard,
    color: "bg-success",
  },
];

const recentActivity = [
  {
    type: "booking",
    title: "New booking at Kashi Vishwanath Temple",
    time: "2 minutes ago",
    icon: Calendar,
  },
  {
    type: "institution",
    title: "New institution registered: ISKCON Mumbai",
    time: "15 minutes ago",
    icon: Building2,
  },
  {
    type: "order",
    title: "Marketplace order #12543 completed",
    time: "32 minutes ago",
    icon: ShoppingBag,
  },
  {
    type: "stream",
    title: "Live darshan started at Tirupati Temple",
    time: "1 hour ago",
    icon: Video,
  },
  {
    type: "user",
    title: "50 new users registered today",
    time: "2 hours ago",
    icon: Users,
  },
];

const pendingApprovals = [
  {
    name: "Siddhivinayak Temple",
    location: "Mumbai, MH",
    type: "Institution",
    date: "Dec 20, 2024",
  },
  {
    name: "Meenakshi Temple",
    location: "Madurai, TN",
    type: "Institution",
    date: "Dec 19, 2024",
  },
  {
    name: "Jagannath Temple",
    location: "Puri, OD",
    type: "Institution",
    date: "Dec 18, 2024",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's what's happening on DevBhakti today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-warm transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}
                  >
                    <stat.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm font-medium ${
                      stat.trend === "up" ? "text-success" : "text-destructive"
                    }`}
                  >
                    {stat.trend === "up" ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              <button className="text-sm text-primary hover:underline flex items-center gap-1">
                View all
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <activity.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Approvals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Pending Approvals</CardTitle>
              <span className="text-xs font-medium bg-destructive/10 text-destructive px-2 py-1 rounded-full">
                {pendingApprovals.length} pending
              </span>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApprovals.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/30 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.location}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs bg-muted px-2 py-1 rounded-full">
                        {item.type}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-sm text-primary hover:underline">
                Review all pending
              </button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Add Institution", icon: Building2, color: "bg-primary" },
                { label: "Manage Users", icon: Users, color: "bg-secondary" },
                { label: "View Reports", icon: TrendingUp, color: "bg-accent" },
                { label: "Payment Settings", icon: CreditCard, color: "bg-success" },
              ].map((action) => (
                <button
                  key={action.label}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/50 transition-all group"
                >
                  <div
                    className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <action.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
