import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function Privacy() {
  return (
    <AppLayout title="Privacy Policy">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Privacy Policy</h1>
        
        <Card className="mb-6">
          <CardContent className="p-6">
            <p className="text-muted-foreground mb-4">
              Last Updated: May 10, 2025
            </p>
            
            <p className="text-muted-foreground mb-6">
              At DebateMate, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information when you use our platform.
            </p>
            
            <h2 className="text-xl font-medium mt-6 mb-3 text-foreground">1. Information We Collect</h2>
            <p className="text-muted-foreground mb-2">
              We collect the following types of information:
            </p>
            <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-1">
              <li><strong>Account Information:</strong> When you register, we collect your username, email address, and password.</li>
              <li><strong>Profile Information:</strong> This includes your display name and any optional information you provide.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our platform, including debate participation, responses, and browsing activity.</li>
              <li><strong>Device Information:</strong> Information about the device you use to access DebateMate, including browser type, IP address, and operating system.</li>
            </ul>
            
            <h2 className="text-xl font-medium mt-6 mb-3 text-foreground">2. How We Use Your Information</h2>
            <p className="text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 mb-2">
              We use your information for the following purposes:
            </p>
            <ul className="list-disc pl-6 mb-4 text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 space-y-1">
              <li>To provide and maintain our service</li>
              <li>To personalize your experience and improve our platform</li>
              <li>To communicate with you about updates, changes, or support</li>
              <li>To analyze usage patterns and optimize performance</li>
              <li>To detect and prevent fraudulent or abusive use</li>
            </ul>
            
            <h2 className="text-xl font-medium mt-6 mb-3 text-foreground">3. Information Sharing and Disclosure</h2>
            <p className="text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 mb-4">
              We do not sell your personal information to third parties. We may share your information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 mb-4 text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 space-y-1">
              <li>With service providers who help us operate our platform</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights, privacy, safety, or property</li>
              <li>In connection with a business transfer or acquisition</li>
            </ul>
            
            <h2 className="text-xl font-medium mt-6 mb-3 text-foreground">4. Data Security</h2>
            <p className="text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 mb-4">
              We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, and destruction. However, no method of transmission over the Internet or electronic storage is completely secure, and we cannot guarantee absolute security.
            </p>
            
            <h2 className="text-xl font-medium mt-6 mb-3 text-foreground">5. Your Rights</h2>
            <p className="text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 mb-4">
              Depending on your location, you may have certain rights regarding your personal information, including:
            </p>
            <ul className="list-disc pl-6 mb-4 text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 space-y-1">
              <li>The right to access your personal information</li>
              <li>The right to correct inaccurate information</li>
              <li>The right to delete your information</li>
              <li>The right to restrict processing</li>
              <li>The right to data portability</li>
              <li>The right to object to processing</li>
            </ul>
            
            <h2 className="text-xl font-medium mt-6 mb-3 text-foreground">6. Changes to This Policy</h2>
            <p className="text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date. We encourage you to review this Privacy Policy periodically.
            </p>
            
            <h2 className="text-xl font-medium mt-6 mb-3 text-foreground">7. Contact Us</h2>
            <p className="text-foreground text-opacity-80 dark:text-foreground dark:text-opacity-80 mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us at dev.debatemate@gmail.com.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}