import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, PiggyBank, Shield, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-primary">AsterFinance</div>
          <div className="space-x-4">
            <Button variant="ghost" asChild>
              <Link to="/partners">Partner Login</Link>
            </Button>
            <Button variant="default" asChild>
              <Link to="/login">User Login</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Empower Your Financial Future
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AsterFinance combines smart savings with matched contributions to help you achieve your financial goals faster.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/login">
                Start Saving <ArrowRight className="ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/partners">Become a Partner</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background p-6 rounded-lg shadow-sm">
              <PiggyBank className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Smart Savings</h3>
              <p className="text-muted-foreground">
                Set up automatic deposits and watch your savings grow with our intelligent saving strategies.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg shadow-sm">
              <Users className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Partner Matching</h3>
              <p className="text-muted-foreground">
                Get your savings matched by our network of trusted partners, accelerating your wealth building.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg shadow-sm">
              <Shield className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure Lending</h3>
              <p className="text-muted-foreground">
                Access loans based on your savings history with competitive rates and flexible terms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">For Partners</h2>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xl mb-8">
              Join our network of impact-driven partners and help create financial opportunities for ambitious savers.
            </p>
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div>
                <h4 className="text-lg font-semibold mb-2">Benefits</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Access to verified, committed savers</li>
                  <li>• Transparent impact tracking</li>
                  <li>• Automated matching programs</li>
                  <li>• Real-time analytics dashboard</li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2">Requirements</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Minimum capital commitment</li>
                  <li>• Long-term partnership vision</li>
                  <li>• Compliance with our standards</li>
                  <li>• Regular engagement with platform</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold mb-4">AsterFinance</h3>
              <p className="text-sm text-muted-foreground">
                Building financial futures through smart savings and partnerships.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Products</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Savings Account</li>
                <li>Partner Matching</li>
                <li>Loans</li>
                <li>Analytics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About Us</li>
                <li>Careers</li>
                <li>Press</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Security</li>
                <li>Compliance</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2024 AsterFinance. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}