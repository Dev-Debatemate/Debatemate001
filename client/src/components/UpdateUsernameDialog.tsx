import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

// Schema for username update
const usernameSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20, "Username cannot exceed 20 characters"),
  password: z.string().min(1, "Password is required to confirm this change"),
});

type UsernameFormValues = z.infer<typeof usernameSchema>;

interface UpdateUsernameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUsername: string;
}

export default function UpdateUsernameDialog({ 
  open, 
  onOpenChange,
  currentUsername
}: UpdateUsernameDialogProps) {
  const { toast } = useToast();
  const { user, refreshUserData } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: currentUsername,
      password: "",
    },
  });
  
  const onSubmit = async (data: UsernameFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Update the username on the server
      const updatedUser = await apiRequest(
        "PUT", 
        `/api/users/${user.id}/username`, 
        {
          username: data.username,
          password: data.password,
        }
      );
      
      // Update local storage directly with the complete updatedUser object
      localStorage.setItem("debateUser", JSON.stringify(updatedUser));
      
      // Invalidate all cached queries to ensure data consistency
      queryClient.invalidateQueries();
      
      // Refresh user data in auth context to update all UI components
      if (refreshUserData) {
        await refreshUserData(user.id);
      }
      
      toast({
        title: "Username updated",
        description: "Your username has been successfully updated.",
      });
      
      // Close the dialog
      onOpenChange(false);
      
      // Reset form
      form.reset();
      
      // Redirect to dashboard to see the changes
      window.location.href = "/dashboard";
      
    } catch (error: any) {
      console.error("Failed to update username:", error);
      toast({
        title: "Error updating username",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background text-foreground border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Change Username</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update your username. You'll need to enter your password to confirm this change.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="current-username" className="text-foreground">Current username</Label>
            <Input 
              id="current-username" 
              value={currentUsername} 
              disabled 
              className="bg-muted/50 text-muted-foreground"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-username" className="text-foreground">New username</Label>
            <Input 
              id="new-username" 
              {...form.register("username")} 
              placeholder="Enter new username"
              autoComplete="off"
              className="bg-background text-foreground border-border focus:border-primary"
            />
            {form.formState.errors.username && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.username.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <Input 
              id="password" 
              type="password" 
              {...form.register("password")} 
              placeholder="Enter your current password"
              autoComplete="current-password"
              className="bg-background text-foreground border-border focus:border-primary"
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.password.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter your current password to validate the username change.
            </p>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="text-foreground border-border hover:bg-muted"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? "Updating..." : "Update Username"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}