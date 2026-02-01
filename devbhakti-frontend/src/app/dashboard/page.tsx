"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Heart,
  ShoppingBag,
  Clock,
  MapPin,
  Video,
  IndianRupee,
  Settings,
  Bell,
  Gift,
  Bookmark,
  Star,
} from "lucide-react";

const user = {
  name: "Rajesh Kumar",
  email: "rajesh.kumar@email.com",
  avatar: "",
  memberSince: "January 2024",
};

const stats = [
  { label: "Temple Visits", value: 12, icon: MapPin },
  { label: "Poojas Booked", value: 8, icon: Calendar },
  { label: "Donations Made", value: 5, icon: Gift },
  { label: "Orders Placed", value: 15, icon: ShoppingBag },
];

const upcomingBookings = [
  {
    id: 1,
    temple: "Kashi Vishwanath Temple",
    pooja: "Rudrabhishek",
    date: "Dec 25, 2024",
    time: "6:00 AM",
    status: "confirmed",
    price: 1100,
  },
  {
    id: 2,
    temple: "Siddhivinayak Temple",
    pooja: "Ganesh Abhishek",
    date: "Dec 28, 2024",
    time: "10:00 AM",
    status: "pending",
    price: 751,
  },
];

const recentOrders = [
  {
    id: "ORD001",
    items: ["Rudraksha Mala", "Brass Diya"],
    total: 1748,
    date: "Dec 18, 2024",
    status: "delivered",
  },
  {
    id: "ORD002",
    items: ["Premium Incense Sticks"],
    total: 199,
    date: "Dec 15, 2024",
    status: "shipped",
  },
];

const favoriteTemples = [
  {
    id: 1,
    name: "Kashi Vishwanath Temple",
    location: "Varanasi",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=200",
    liveStatus: true,
  },
  {
    id: 2,
    name: "Tirupati Balaji",
    location: "Tirupati",
    image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=200",
    liveStatus: false,
  },
  {
    id: 3,
    name: "Siddhivinayak Temple",
    location: "Mumbai",
    image: "https://images.unsplash.com/photo-1609947017136-9daf32a00321?w=200",
    liveStatus: true,
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-12">
        {/* Header */}
        <section className="bg-gradient-to-b from-primary/10 to-background py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                    Namaste, {user.name.split(" ")[0]}! 🙏
                  </h1>
                  <p className="text-muted-foreground">{user.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Member since {user.memberSince}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {stats.map((stat, index) => (
                <Card key={index} className="border-border/50">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="container mx-auto px-4 mt-8">
          <Tabs defaultValue="bookings" className="w-full">
            <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-lg overflow-x-auto">
              <TabsTrigger value="bookings" className="gap-2">
                <Calendar className="h-4 w-4" />
                Bookings
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-2">
                <ShoppingBag className="h-4 w-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-2">
                <Heart className="h-4 w-4" />
                Favorites
              </TabsTrigger>
              <TabsTrigger value="donations" className="gap-2">
                <Gift className="h-4 w-4" />
                Donations
              </TabsTrigger>
            </TabsList>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="mt-6">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-xl">Upcoming Bookings</CardTitle>
                      <Link href="/temples">
                        <Button variant="outline" size="sm">
                          Book New Pooja
                        </Button>
                      </Link>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {upcomingBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/30 rounded-lg gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-foreground">
                                {booking.pooja}
                              </h4>
                              <Badge
                                variant={
                                  booking.status === "confirmed"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {booking.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {booking.temple}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {booking.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {booking.time}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center font-semibold text-primary">
                              <IndianRupee className="h-4 w-4" />
                              {booking.price}
                            </span>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full justify-start gap-2" variant="outline">
                        <Video className="h-4 w-4" />
                        Watch Live Darshan
                      </Button>
                      <Button className="w-full justify-start gap-2" variant="outline">
                        <Bookmark className="h-4 w-4" />
                        Track Prasad Delivery
                      </Button>
                      <Button className="w-full justify-start gap-2" variant="outline">
                        <Star className="h-4 w-4" />
                        Leave a Review
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="mt-6">
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">Recent Orders</CardTitle>
                  <Link href="/marketplace">
                    <Button variant="outline" size="sm">
                      Shop More
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/30 rounded-lg gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">
                            Order #{order.id}
                          </h4>
                          <Badge
                            variant={
                              order.status === "delivered" ? "default" : "secondary"
                            }
                          >
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.items.join(", ")}
                        </p>
                        <p className="text-sm text-muted-foreground">{order.date}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center font-semibold text-foreground">
                          <IndianRupee className="h-4 w-4" />
                          {order.total}
                        </span>
                        <Button variant="outline" size="sm">
                          Track Order
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Favorites Tab */}
            <TabsContent value="favorites" className="mt-6">
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl">Favorite Temples</CardTitle>
                  <Link href="/temples">
                    <Button variant="outline" size="sm">
                      Explore More
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favoriteTemples.map((temple) => (
                      <Link key={temple.id} href={`/temples/${temple.id}`}>
                        <div className="group relative rounded-lg overflow-hidden aspect-video">
                          <img
                            src={temple.image}
                            alt={temple.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                          {temple.liveStatus && (
                            <Badge className="absolute top-2 right-2 bg-red-500 text-white animate-pulse">
                              LIVE
                            </Badge>
                          )}
                          <div className="absolute bottom-3 left-3">
                            <h4 className="font-semibold text-white">{temple.name}</h4>
                            <p className="text-white/70 text-sm">{temple.location}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Donations Tab */}
            <TabsContent value="donations" className="mt-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-xl">Donation History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Your generous donations
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Track all your temple donations and contributions here
                    </p>
                    <Link href="/temples">
                      <Button>Make a Donation</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </div>

      <Footer />
    </div>
  );
}
