import { useState } from "react";
import { useLocation, Link as WouterLink } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Step 1: Request password reset
const requestResetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Step 2: Verify code and reset password
const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  token: z.string().min(6, "Verification code must be at least 6 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetStep = "request" | "verify" | "success";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { requestPasswordReset, resetPassword, loading } = useAuth();
  const [resetStep, setResetStep] = useState<ResetStep>("request");
  const [email, setEmail] = useState<string>("");
  
  // Step 1: Request reset form
  const requestResetForm = useForm<z.infer<typeof requestResetSchema>>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: {
      email: "",
    },
  });
  
  // Step 2: Reset password form
  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      token: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  // Handle request password reset
  const onRequestReset = async (values: z.infer<typeof requestResetSchema>) => {
    try {
      await requestPasswordReset(values.email);
      setEmail(values.email);
      setResetStep("verify");
      resetPasswordForm.setValue("email", values.email);
      toast({
        title: "Verification Code Sent",
        description: "A verification code has been sent to your email address.",
      });
    } catch (error) {
      toast({
        title: "Request Failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };
  
  // Handle reset password
  const onResetPassword = async (values: z.infer<typeof resetPasswordSchema>) => {
    try {
      await resetPassword(values.email, values.token, values.password);
      setResetStep("success");
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset successfully.",
      });
      // Navigate to login after a delay
      setTimeout(() => {
        navigate("/auth?action=login");
      }, 3000);
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-body">
      {/* Header */}
      <header className="bg-white text-gray-800 shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <WouterLink href="/">
              <h1 className="text-2xl font-bold cursor-pointer">
                <span className="text-amber-500">Debate</span>
                <span className="text-gray-800">Mate</span>
              </h1>
            </WouterLink>
          </div>
          <div>
            <WouterLink href="/auth">
              <button className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md transition">
                Back to Login
              </button>
            </WouterLink>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {resetStep === "request" && (
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
                <CardDescription>
                  Enter your email address to receive a password reset verification code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...requestResetForm}>
                  <form onSubmit={requestResetForm.handleSubmit(onRequestReset)} className="space-y-4">
                    <FormField
                      control={requestResetForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="your@email.com" 
                              {...field} 
                              disabled={loading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-amber-500 hover:bg-amber-600" 
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Verification Code"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <div className="text-sm text-center text-gray-500">
                  Remember your password?{" "}
                  <WouterLink href="/auth">
                    <a className="text-amber-500 hover:underline font-medium">
                      Back to Login
                    </a>
                  </WouterLink>
                </div>
              </CardFooter>
            </Card>
          )}
          
          {resetStep === "verify" && (
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                <CardDescription>
                  Enter the verification code sent to {email} and your new password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...resetPasswordForm}>
                  <form onSubmit={resetPasswordForm.handleSubmit(onResetPassword)} className="space-y-4">
                    <FormField
                      control={resetPasswordForm.control}
                      name="token"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verification Code</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter verification code" 
                              {...field} 
                              disabled={loading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={resetPasswordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password"
                              placeholder="Enter new password" 
                              {...field} 
                              disabled={loading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={resetPasswordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password"
                              placeholder="Confirm new password" 
                              {...field} 
                              disabled={loading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex space-x-2">
                      <Button 
                        type="button" 
                        variant="outline"
                        className="flex-1" 
                        disabled={loading}
                        onClick={() => {
                          setResetStep("request");
                          requestResetForm.reset();
                        }}
                      >
                        Back
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1 bg-amber-500 hover:bg-amber-600" 
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Resetting...
                          </>
                        ) : (
                          "Reset Password"
                        )}
                      </Button>
                    </div>
                    
                    <div className="text-center pt-2">
                      <Button
                        type="button"
                        variant="link"
                        className="text-amber-500 text-sm"
                        onClick={async () => {
                          const email = requestResetForm.getValues().email || resetPasswordForm.getValues().email;
                          if (email) {
                            try {
                              await requestPasswordReset(email);
                              toast({
                                title: "New Code Sent",
                                description: "A new verification code has been sent to your email address.",
                              });
                            } catch (error) {
                              toast({
                                title: "Failed to Send Code",
                                description: error instanceof Error ? error.message : "Something went wrong",
                                variant: "destructive",
                              });
                            }
                          }
                        }}
                      >
                        Send New Code
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
          
          {resetStep === "success" && (
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-green-600">Success!</CardTitle>
                <CardDescription>
                  Your password has been reset successfully
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="bg-green-100 text-green-800 p-4 rounded-md mb-4">
                  <p>Your password has been updated. You will be redirected to the login page in a few seconds.</p>
                </div>
                <WouterLink href="/auth">
                  <Button className="bg-amber-500 hover:bg-amber-600">
                    Back to Login
                  </Button>
                </WouterLink>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-white text-gray-600 py-4 border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm">© {new Date().getFullYear()} DebateMate. All rights reserved.</p>
            </div>
            <div className="flex space-x-4 text-sm">
              <WouterLink href="/about"><a className="hover:text-amber-500">About</a></WouterLink>
              <WouterLink href="/terms"><a className="hover:text-amber-500">Terms</a></WouterLink>
              <WouterLink href="/privacy"><a className="hover:text-amber-500">Privacy</a></WouterLink>
              <WouterLink href="/contact"><a className="hover:text-amber-500">Contact</a></WouterLink>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}