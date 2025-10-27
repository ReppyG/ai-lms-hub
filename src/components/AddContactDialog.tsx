import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus } from "lucide-react";

export const AddContactDialog = () => {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddContact = async () => {
    if (!userId.trim() || userId.length !== 9) {
      toast({
        title: "Invalid ID",
        description: "Please enter a valid 9-digit user ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Find the contact by user_id
      const { data: contactProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("user_id", userId)
        .single();

      if (profileError || !contactProfile) {
        toast({
          title: "User not found",
          description: "No user found with that ID",
          variant: "destructive",
        });
        return;
      }

      // Check if already a contact
      const { data: existing } = await supabase
        .from("contacts")
        .select("id")
        .eq("user_id", user.id)
        .eq("contact_id", contactProfile.id)
        .single();

      if (existing) {
        toast({
          title: "Already a contact",
          description: "This user is already in your contacts",
        });
        return;
      }

      // Add contact
      const { error } = await supabase
        .from("contacts")
        .insert({ user_id: user.id, contact_id: contactProfile.id });

      if (error) throw error;

      toast({
        title: "Contact added!",
        description: `${contactProfile.full_name} has been added to your contacts`,
      });

      setUserId("");
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="w-4 h-4" />
          Add Contact
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
          <DialogDescription>
            Enter your friend's 9-digit user ID to add them to your contacts
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              placeholder="123456789"
              value={userId}
              onChange={(e) => setUserId(e.target.value.replace(/\D/g, "").slice(0, 9))}
              maxLength={9}
            />
          </div>
          <Button onClick={handleAddContact} disabled={loading} className="w-full">
            {loading ? "Adding..." : "Add Contact"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
