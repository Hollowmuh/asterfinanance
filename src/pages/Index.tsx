import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  PiggyBank, 
  Shield, 
  Users, 
  TrendingUp, 
  Award,
  BadgeDollarSign,
  LineChart,
  Sun,
  Moon,
  GraduationCap,
  HandshakeIcon
} from "lucide-react";

export default function Index() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50'
    }`}>
      {/* Navigation */}
      <nav className={`border-b backdrop-blur-md sticky top-0 z-50 transition-colors duration-300 ${
        isDarkMode 
          ? 'border-white/10 bg-slate-900/50' 
          : 'border-gray-200 bg-white/50'
      }`}>
        <div className="container mx-auto flex justify-between items-center py-4 px-4">
          <div className={`text-2xl font-bold bg-gradient-to-r text-transparent bg-clip-text ${
            isDarkMode 
              ? 'from-purple-400 to-pink-400' 
              : 'from-purple-600 to-pink-600'
          }`}>
            AsterFinance
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              className={isDarkMode ? "hover:bg-white/10 text-white" : "hover:bg-gray-100 text-gray-900"}
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button 
              variant="ghost" 
              className={isDarkMode ? "hover:bg-white/10 text-white" : "text-gray-900 hover:bg-gray-100"} 
              asChild>
              <Link to="/partner/dashboard">Partner Portal</Link>
            </Button>
            <Button 
              variant="default" 
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" 
              asChild>
              <Link to="/user/dashboard">Start Saving</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-32 px-4 overflow-hidden">
        <div className={`absolute inset-0 transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20' 
            : 'bg-gradient-to-br from-purple-100 to-pink-100'
        }`} />
        <div className="container mx-auto text-center relative">
          <div className={`inline-block mb-2 px-4 py-1 backdrop-blur-sm rounded-full ${
            isDarkMode 
              ? 'bg-white/10 text-purple-300' 
              : 'bg-gray-800/10 text-purple-600'
          }`}>
            Decentralized Savings & Impact Platform
          </div>
          <h1 className={`text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r text-transparent bg-clip-text ${
            isDarkMode 
              ? 'from-purple-300 to-pink-300' 
              : 'from-purple-600 to-pink-600'
          }`}>
            Build Wealth Through Matched Savings
          </h1>
          <p className={`text-xl mb-8 max-w-2xl mx-auto ${
            isDarkMode ? 'text-slate-300' : 'text-gray-600'
          }`}>
            Join a community where consistent savers get matched by impact partners. Earn up to 1.5x on your savings through partner matches, access flexible loans, and unlock educational opportunities.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" asChild>
              <Link to="/login">
                Start Saving Now <ArrowRight className="ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className={`${
              isDarkMode 
                ? 'border-purple-400 text-purple-400 hover:bg-purple-400/10' 
                : 'border-purple-600 text-purple-600 hover:bg-purple-100'
            }`} asChild>
              <Link to="/partners">Become an Impact Partner</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* User Features */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4 relative">
          <h2 className={`text-3xl font-bold text-center mb-12 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            For Savers
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: PiggyBank,
                title: "Streak-Based Savings",
                description: "Build your savings streak with minimum deposits of 10 DAI. The longer your streak, the better your benefits."
              },
              {
                icon: Users,
                title: "Partner Matches",
                description: "Get matched up to 1.5x your savings by verified impact partners. Match rates based on your saving consistency."
              },
              {
                icon: BadgeDollarSign,
                title: "Smart Loans",
                description: "Coming Soon: Access flexible loans based on your savings history and match performance."
              }
            ].map((feature, index) => (
              <div key={index} className={`backdrop-blur-sm p-6 rounded-xl border transition-all ${
                isDarkMode 
                  ? 'bg-slate-800/50 border-white/10 hover:border-purple-400/50' 
                  : 'bg-white/50 border-gray-200 hover:border-purple-600/50'
              }`}>
                <feature.icon className={`w-12 h-12 mb-4 ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`} />
                <h3 className={`text-xl font-semibold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {feature.title}
                </h3>
                <p className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Features */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4 relative">
          <h2 className={`text-3xl font-bold text-center mb-12 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            For Impact Partners
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: LineChart,
                title: "Investment Management",
                description: "Track investments and manage matching funds with comprehensive analytics. Average 10% APY on matched funds."
              },
              {
                icon: Shield,
                title: "Risk Management",
                description: "Access KYC-verified savers with proven savings habits. Advanced analytics for risk assessment."
              },
              {
                icon: HandshakeIcon,
                title: "Flexible Matching",
                description: "Set custom match rates up to 150% and investment limits. Control your impact strategy."
              },
              {
                icon: GraduationCap,
                title: "Scholarship Programs",
                description: "Coming Soon: Sponsor educational opportunities for consistent savers through our scholarship marketplace."
              }
            ].map((feature, index) => (
              <div key={index} className={`backdrop-blur-sm p-6 rounded-xl border transition-all ${
                isDarkMode 
                  ? 'bg-slate-800/50 border-white/10 hover:border-pink-400/50' 
                  : 'bg-white/50 border-gray-200 hover:border-pink-600/50'
              }`}>
                <feature.icon className={`w-12 h-12 mb-4 ${
                  isDarkMode ? 'text-pink-400' : 'text-pink-600'
                }`} />
                <h3 className={`text-xl font-semibold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {feature.title}
                </h3>
                <p className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4 text-center relative">
          <h2 className={`text-3xl font-bold mb-12 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Platform Metrics
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { value: "0.25%", label: "Platform Fee" },
              { value: "10 DAI", label: "Min. Deposit" },
              { value: "150%", label: "Max Match Rate" },
              { value: "365 Days", label: "Max Match Duration" }
            ].map((stat, index) => (
              <div key={index} className={`backdrop-blur-sm p-6 rounded-xl border ${
                isDarkMode 
                  ? 'bg-slate-800/50 border-white/10' 
                  : 'bg-white/50 border-gray-200'
              }`}>
                <div className={`text-4xl font-bold bg-gradient-to-r mb-2 text-transparent bg-clip-text ${
                  isDarkMode 
                    ? 'from-purple-400 to-pink-400' 
                    : 'from-purple-600 to-pink-600'
                }`}>
                  {stat.value}
                </div>
                <div className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative py-12 border-t transition-colors duration-300 ${
        isDarkMode 
          ? 'border-white/10' 
          : 'border-gray-200'
      }`}>
        <div className={`absolute inset-0 backdrop-blur-sm transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-slate-900/50' 
            : 'bg-white/50'
        }`} />
        <div className="container mx-auto px-4 relative">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className={`font-bold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                AsterFinance
              </h3>
              <p className={`text-sm ${
                isDarkMode ? 'text-slate-300' : 'text-gray-600'
              }`}>
                Empowering financial futures through smart savings and impact partnerships.
              </p>
            </div>
            {[
              {
                title: "Platform",
                links: ["Savings Dashboard", "Partner Matching", "Investment Portal", "Analytics"]
              },
              {
                title: "Company",
                links: ["About Us", "Impact Report", "Careers", "Contact"]
              },
              {
                title: "Legal",
                links: ["Privacy Policy", "Terms of Service", "Security", "Compliance"]
              }
            ].map((section, index) => (
              <div key={index}>
                <h4 className={`font-semibold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {section.title}
                </h4>
                <ul className="space-y-2 text-sm">
                  {section.links.map((link, linkIndex) => (
                    <li 
                      key={linkIndex} 
                      className={`cursor-pointer transition-colors ${
                        isDarkMode 
                          ? 'text-slate-300 hover:text-purple-400' 
                          : 'text-gray-600 hover:text-purple-600'
                      }`}
                    >
                      {link}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className={`mt-8 pt-8 text-center text-sm transition-colors ${
            isDarkMode 
              ? 'border-t border-white/10 text-slate-300' 
              : 'border-t border-gray-200 text-gray-600'
          }`}>
            © 2024 AsterFinance. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}