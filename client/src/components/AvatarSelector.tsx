import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Define a set of avatar URLs - same as in UserAvatar component
const avatarUrls = [
  "https://images.unsplash.com/photo-1568602471122-7832951cc4c5",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61"
];

interface AvatarSelectorProps {
  userId: number;
  currentAvatarId: number;
  className?: string;
}

export default function AvatarSelector({ userId, currentAvatarId, className }: AvatarSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState(currentAvatarId);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Update avatar mutation
  const updateAvatarMutation = useMutation({
    mutationFn: async (avatarId: number) => {
      return apiRequest("PATCH", `/api/users/${userId}/avatar`, { avatarId });
    },
    onSuccess: () => {
      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully.",
      });
      setIsOpen(false);
      
      // Invalidate queries that contain user data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/debates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Could not update your avatar",
        variant: "destructive",
      });
    }
  });
  
  const handleAvatarSelect = (avatarId: number) => {
    setSelectedAvatarId(avatarId);
  };
  
  const handleSave = () => {
    updateAvatarMutation.mutate(selectedAvatarId);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`absolute bottom-0 right-0 rounded-full bg-primary text-white p-1 ${className}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Profile Picture</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-4 py-4">
          {avatarUrls.map((url, index) => {
            const avatarId = index + 1;
            return (
              <div 
                key={avatarId} 
                className={`cursor-pointer flex justify-center ${selectedAvatarId === avatarId ? 'ring-2 ring-primary rounded-full' : ''}`}
                onClick={() => handleAvatarSelect(avatarId)}
              >
                <Avatar className="h-16 w-16">
                  <AvatarImage 
                    src={`${url}?auto=format&fit=crop&w=150&h=150&q=80`} 
                    alt={`Avatar ${avatarId}`} 
                  />
                  <AvatarFallback className="bg-primary text-white">
                    {avatarId}
                  </AvatarFallback>
                </Avatar>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={updateAvatarMutation.isPending || selectedAvatarId === currentAvatarId}
          >
            {updateAvatarMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}