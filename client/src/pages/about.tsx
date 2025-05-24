import AppLayout from "@/components/AppLayout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function About() {
  return (
    <AppLayout title="About">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-foreground">About DebateMate</h1>
        
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-medium mb-4 text-foreground">Our Mission</h2>
            <p className="text-foreground dark:text-foreground text-opacity-80 dark:text-opacity-90 mb-4">
              DebateMate is an innovative platform designed to enhance critical thinking, logical reasoning, and persuasive communication skills through structured, competitive debates. Our mission is to create a space where individuals can engage in thoughtful discussions, challenge their perspectives, and develop their argumentative abilities in a supportive and educational environment.
            </p>
            
            <h2 className="text-xl font-medium mt-6 mb-4 text-foreground">How It Works</h2>
            <p className="text-foreground dark:text-foreground text-opacity-80 dark:text-opacity-90 mb-4">
              Our platform facilitates turn-based debates between two participants on a wide range of topics. Each debate consists of multiple rounds where participants present their arguments and counterarguments. At the end of each debate, our advanced AI evaluation system assesses the quality of arguments based on logic, evidence, and persuasiveness to determine a winner.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-muted dark:bg-muted/30 p-4 rounded-lg border border-border">
                <h3 className="font-medium mb-2 text-foreground">Skills Development</h3>
                <p className="text-foreground dark:text-foreground text-opacity-80 dark:text-opacity-90 text-sm">
                  Participants develop critical thinking, research abilities, and persuasive communication through structured debate formats.
                </p>
              </div>
              
              <div className="bg-muted dark:bg-muted/30 p-4 rounded-lg border border-border">
                <h3 className="font-medium mb-2 text-foreground">Fair Evaluation</h3>
                <p className="text-foreground dark:text-foreground text-opacity-80 dark:text-opacity-90 text-sm">
                  Our AI system provides unbiased assessment of debates, focusing purely on argument quality and logical reasoning.
                </p>
              </div>
              
              <div className="bg-muted dark:bg-muted/30 p-4 rounded-lg border border-border">
                <h3 className="font-medium mb-2 text-foreground">Diverse Topics</h3>
                <p className="text-foreground dark:text-foreground text-opacity-80 dark:text-opacity-90 text-sm">
                  Engage with a wide variety of topics spanning politics, science, philosophy, ethics, and contemporary issues.
                </p>
              </div>
              
              <div className="bg-muted dark:bg-muted/30 p-4 rounded-lg border border-border">
                <h3 className="font-medium mb-2 text-foreground">Competitive Element</h3>
                <p className="text-foreground dark:text-foreground text-opacity-80 dark:text-opacity-90 text-sm">
                  Track your progress, earn points, climb the leaderboard, and compete with debaters from around the world.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center mt-8 mb-6">
          <h2 className="text-2xl font-bold mb-6 text-white">Ready to Start Debating?</h2>
          <Link href="/auth">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
              Join DebateMate Today
            </Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}