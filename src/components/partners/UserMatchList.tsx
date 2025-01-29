import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import { useTheme } from 'next-themes';
import { 
  BanknoteIcon, 
  CalendarCheckIcon, 
  BarChartIcon,
  ClockIcon,
  StarIcon
} from "lucide-react";

const mockUsers = [
  {
    id: 1,
    name: "Dr. Ada Lovelace",
    avatar: "/avatars/ada.png",
    savingsGoal: 15000,
    currentSavings: 8750,
    matchRequested: 6250,
    creditScore: 789,
    savingsStreak: 8,
    riskLevel: "Low",
    educationField: "Computer Science",
    university: "University of Cambridge",
    deadline: "2024-09-01"
  },
  {
    id: 2,
    name: "Prof. Alan Turing",
    avatar: "/avatars/alan.png",
    savingsGoal: 20000,
    currentSavings: 14200,
    matchRequested: 5800,
    creditScore: 812,
    savingsStreak: 12,
    riskLevel: "Very Low",
    educationField: "Mathematics",
    university: "Princeton University",
    deadline: "2025-01-15"
  },
  {
    id: 3,
    name: "Marie Curie",
    avatar: "/avatars/marie.png",
    savingsGoal: 18000,
    currentSavings: 9200,
    matchRequested: 8800,
    creditScore: 654,
    savingsStreak: 5,
    riskLevel: "Medium",
    educationField: "Physics",
    university: "Sorbonne Université",
    deadline: "2024-12-01"
  }
];

export const UserMatchList = () => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  const handleMatch = (userId: number) => {
    toast({
      title: "Match Proposal Sent",
      description: "Your terms have been submitted for review. Average response time: 24hrs.",
    });
  };

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50'
    }`}>
      <div className="container mx-auto px-4 py-8">
        <Card className={`backdrop-blur-lg ${
          isDarkMode 
            ? 'bg-slate-800/40 border-white/10' 
            : 'bg-white/80 border-gray-200'
        }`}>
          <CardHeader className={`border-b ${
            isDarkMode ? 'border-white/10' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <CardTitle className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Student Match Proposals
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" className={`gap-2 ${
                  isDarkMode 
                    ? 'border-white/10 hover:bg-white/10 text-white' 
                    : 'border-gray-200 hover:bg-gray-100'
                }`}>
                  <BarChartIcon className="h-4 w-4" />
                  Filter Matches
                </Button>
                <Button variant="outline" className={`gap-2 ${
                  isDarkMode 
                    ? 'border-white/10 hover:bg-white/10 text-white' 
                    : 'border-gray-200 hover:bg-gray-100'
                }`}>
                  <ClockIcon className="h-4 w-4" />
                  Sort by Deadline
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockUsers.map((user) => (
              <div key={user.id} className={`group relative rounded-xl p-6 transition-all ${
                isDarkMode 
                  ? 'bg-slate-700/30 hover:bg-slate-700/50 border-white/10' 
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              } border`}>
                <div className="flex gap-4">
                  <Avatar className="h-16 w-16 border-2 border-purple-200">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-lg font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {user.name}
                      </h3>
                      <Badge className={
                        user.riskLevel === 'Very Low'
                          ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                          : 'bg-red-400/10 text-red-400 border-red-400/20'
                      }>
                        {user.riskLevel} Risk
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-sm">
                        <div className={`flex items-center gap-1 ${
                          isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                        }`}>
                          <BanknoteIcon className="h-4 w-4" />
                          <span>${user.matchRequested.toLocaleString()} Needed</span>
                        </div>
                        <div className={`flex items-center gap-1 ${
                          isDarkMode ? 'text-amber-400' : 'text-amber-600'
                        }`}>
                          <CalendarCheckIcon className="h-4 w-4" />
                          <span>{user.savingsStreak} Month Streak</span>
                        </div>
                        <div className={`flex items-center gap-1 ${
                          isDarkMode ? 'text-purple-400' : 'text-purple-600'
                        }`}>
                          <StarIcon className="h-4 w-4" />
                          <span>Credit: {user.creditScore}</span>
                        </div>
                      </div>

                      <Progress 
                        value={(user.currentSavings / user.savingsGoal) * 100} 
                        className={`h-2 ${
                          isDarkMode ? 'bg-slate-700' : 'bg-gray-100'
                        }`}
                      />
                      <div className={`flex justify-between text-sm ${
                        isDarkMode ? 'text-slate-300' : 'text-gray-600'
                      }`}>
                        <span>Saved: ${user.currentSavings.toLocaleString()}</span>
                        <span>Goal: ${user.savingsGoal.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className={`pt-4 border-t ${
                      isDarkMode ? 'border-white/10' : 'border-gray-200'
                    }`}>
                      <div className="flex gap-4 text-sm">
                        <div className="space-y-1">
                          <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
                            Education
                          </p>
                          <p className={`font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {user.educationField}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
                            University
                          </p>
                          <p className={`font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {user.university}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>
                            Deadline
                          </p>
                          <p className={`font-medium ${
                            isDarkMode ? 'text-amber-400' : 'text-amber-700'
                          }`}>
                            {user.deadline}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button 
                        onClick={() => handleMatch(user.id)}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      >
                        Propose Match
                      </Button>
                      <Button variant="outline" className={
                        isDarkMode 
                          ? 'border-white/10 hover:bg-white/10 text-white' 
                          : 'border-purple-200 text-purple-600 hover:bg-purple-50'
                      }>
                        View Full Profile
                      </Button>
                    </div>
                  </div>
                </div>

                <div className={`absolute top-4 right-4 flex items-center gap-1 text-sm ${
                  isDarkMode ? 'text-slate-400' : 'text-gray-500'
                }`}>
                  <ClockIcon className="h-4 w-4" />
                  <span>48h remaining</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserMatchList;