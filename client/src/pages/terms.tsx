import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function Terms() {
  return (
    <AppLayout title="Terms of Service">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Terms of Service</h1>
        
        <Card className="mb-6">
          <CardContent className="p-6">
            <p className="text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 mb-4">
              Last Updated: May 10, 2025
            </p>
            
            <h2 className="text-xl font-medium mt-6 mb-3 text-foreground">1. Acceptance of Terms</h2>
            <p className="text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 mb-4">
              By accessing or using DebateMate, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, you may not access or use our services.
            </p>
            
            <h2 className="text-xl font-medium mt-6 mb-3 text-foreground">2. Description of Service</h2>
            <p className="text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 mb-4">
              DebateMate is a platform that facilitates online debates between users on various topics. Users can participate in debates, receive AI-driven feedback, and track their performance statistics.
            </p>
            
            <h2 className="text-xl font-medium mt-6 mb-3 text-foreground">3. User Accounts</h2>
            <p className="text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 mb-4">
              To use certain features of DebateMate, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate information when creating your account and to promptly update any changes.
            </p>
            
            <h2 className="text-xl font-medium mt-6 mb-3 text-foreground">4. User Content</h2>
            <p className="text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 mb-4">
              You retain ownership of any content you submit to DebateMate. By submitting content, you grant DebateMate a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, publish, and distribute your content for the purpose of providing and improving our services.
            </p>
            
            <h2 className="text-xl font-medium mt-6 mb-3 text-foreground">5. Prohibited Conduct</h2>
            <p className="text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 mb-4">
              When using DebateMate, you agree not to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 space-y-1">
              <li>Use the service for any illegal purpose or in violation of any laws</li>
              <li>Post content that is offensive, harmful, threatening, or promotes discrimination</li>
              <li>Impersonate another person or entity</li>
              <li>Attempt to gain unauthorized access to other user accounts or DebateMate systems</li>
              <li>Use the service to transmit spam, malware, or other harmful content</li>
              <li>Interfere with or disrupt the service or servers connected to the service</li>
            </ul>
            
            <h2 className="text-xl font-medium mt-6 mb-3 text-foreground">6. Termination</h2>
            <p className="text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 mb-4">
              DebateMate reserves the right to suspend or terminate your account and access to the service at any time for violations of these Terms or for any other reason at our sole discretion.
            </p>
            
            <h2 className="text-xl font-medium mt-6 mb-3 text-foreground">7. Changes to Terms</h2>
            <p className="text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 mb-4">
              We may update these Terms from time to time. If we make material changes, we will notify you through the service or by other means. Your continued use of DebateMate after such notice constitutes your acceptance of the revised Terms.
            </p>
            
            <h2 className="text-xl font-medium mt-6 mb-3 text-foreground">8. Contact Information</h2>
            <p className="text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 mb-4">
              If you have any questions about these Terms, please contact us at app.debatemate@gmail.com.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}