import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Pricing = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "Canvas Integration",
        "Assignment Tracking",
        "Calendar View",
        "Basic AI Chat (5 messages/day)",
        "Note Taking"
      ],
      cta: "Current Plan",
      highlighted: false
    },
    {
      name: "Pro",
      price: "$9.99",
      period: "per month",
      description: "Unlock full AI-powered study tools",
      features: [
        "Everything in Free",
        "Unlimited AI Chat",
        "AI Study Plan Generator",
        "Assignment Summarizer",
        "Essay Outline Generator",
        "Practice Problems Generator",
        "Time Estimation Tool",
        "Priority Support"
      ],
      cta: "Coming Soon",
      highlighted: true
    },
    {
      name: "Team",
      price: "$24.99",
      period: "per month",
      description: "For study groups and teams",
      features: [
        "Everything in Pro",
        "Up to 5 team members",
        "Shared study plans",
        "Team chat",
        "Admin dashboard",
        "Analytics & insights"
      ],
      cta: "Coming Soon",
      highlighted: false
    }
  ];

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Upgrade to unlock powerful AI tools and take your studying to the next level
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={plan.highlighted ? "border-primary shadow-glow" : ""}
            >
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full ${plan.highlighted ? "gradient-primary shadow-glow" : ""}`}
                  variant={plan.highlighted ? "default" : "outline"}
                  onClick={() => {
                    if (plan.cta === "Current Plan") {
                      navigate("/");
                    }
                  }}
                  disabled={plan.cta === "Coming Soon"}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Have questions? <a href="/chat" className="text-primary hover:underline">Contact us</a>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Pricing;
