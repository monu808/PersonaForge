import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BrainCircuitIcon,
  MessageSquareText,
  PlusCircleIcon,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data
const stats = [
  {
    name: "Total Personas",
    value: "12",
    change: "+20%",
    icon: BrainCircuitIcon,
    positive: true,
  },
  {
    name: "Active Users",
    value: "2,453",
    change: "+15.3%",
    icon: Users,
    positive: true,
  },
  {
    name: "Interactions",
    value: "43.2k",
    change: "+32.8%",
    icon: MessageSquareText,
    positive: true,
  },
  {
    name: "Avg. Session",
    value: "4.2m",
    change: "-3.1%",
    icon: BarChart3,
    positive: false,
  },
];

const recentPersonas = [
  {
    id: "1",
    name: "Customer Support Agent",
    status: "active",
    usageToday: 245,
    lastUpdated: "2 hours ago",
  },
  {
    id: "2",
    name: "Medical Consultant",
    status: "active",
    usageToday: 132,
    lastUpdated: "5 hours ago",
  },
  {
    id: "3",
    name: "Financial Advisor",
    status: "maintenance",
    usageToday: 0,
    lastUpdated: "1 day ago",
  },
  {
    id: "4",
    name: "Personal Assistant",
    status: "active",
    usageToday: 78,
    lastUpdated: "3 hours ago",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your personas and track their performance
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button asChild>
              <Link to="/create">
                <PlusCircleIcon className="mr-2 h-4 w-4" />
                Create New Persona
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    {stat.name}
                  </CardTitle>
                  <stat.icon className="h-5 w-5 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p
                    className={`text-xs font-medium mt-1 flex items-center ${
                      stat.positive
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {stat.change}
                    <span className="text-gray-500 ml-1">from last month</span>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent personas */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Personas</CardTitle>
                <CardDescription>
                  Your recently updated or most active personas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-3 border-b">Name</th>
                        <th className="px-4 py-3 border-b">Status</th>
                        <th className="px-4 py-3 border-b">Usage Today</th>
                        <th className="px-4 py-3 border-b">Last Updated</th>
                        <th className="px-4 py-3 border-b">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPersonas.map((persona) => (
                        <tr key={persona.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                <BrainCircuitIcon className="h-4 w-4 text-primary-600" />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {persona.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                persona.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {persona.status === "active" ? "Active" : "Maintenance"}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {persona.usageToday.toLocaleString()} interactions
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {persona.lastUpdated}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <Button
                              variant="link"
                              size="sm"
                              className="text-primary-600"
                              asChild
                            >
                              <Link to={`/personas/${persona.id}`}>
                                View Details
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-right">
                  <Link
                    to="/personas"
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 inline-flex items-center"
                  >
                    View all personas
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start" asChild>
                  <Link to="/create">
                    <PlusCircleIcon className="mr-2 h-5 w-5" />
                    Create New Persona
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  View Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquareText className="mr-2 h-5 w-5" />
                  View Interactions
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-5 w-5" />
                  User Management
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Usage Summary</CardTitle>
                <CardDescription>
                  Your usage this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">API Calls</span>
                      <span className="font-medium">18,452 / 25,000</span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-primary-600 h-2.5 rounded-full"
                        style={{ width: "74%" }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Storage</span>
                      <span className="font-medium">2.4 GB / 5 GB</span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-secondary-600 h-2.5 rounded-full"
                        style={{ width: "48%" }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Active Personas</span>
                      <span className="font-medium">12 / 15</span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-accent-500 h-2.5 rounded-full"
                        style={{ width: "80%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}