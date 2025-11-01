import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AddContactDialog } from "@/components/AddContactDialog";
import { MessageSquare, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  full_name: string;
  user_id: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

const Chat = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [myUserId, setMyUserId] = useState("");
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [pendingContacts, setPendingContacts] = useState<Contact[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadContacts();
      loadMyUserId();
      loadAllMessages();
    }
  }, [user]);

  useEffect(() => {
    if (selectedContact && user) {
      loadMessages();
      
      const channel = supabase
        .channel(`messages:${selectedContact.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `sender_id=eq.${selectedContact.id},recipient_id=eq.${user.id}`,
          },
          () => {
            loadMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedContact, user]);

  const loadMyUserId = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("id", user.id)
      .single();
    
    if (data) {
      setMyUserId(data.user_id);
    }
  };

  const loadContacts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("contacts")
      .select("contact_id, profiles!contacts_contact_id_fkey(id, full_name, user_id)")
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Error loading contacts",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const contactsList = data.map((c: any) => ({
      id: c.profiles.id,
      full_name: c.profiles.full_name,
      user_id: c.profiles.user_id,
    }));

    setContacts(contactsList);
  };

  const loadAllMessages = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*, sender:profiles!messages_sender_id_fkey(full_name, user_id)")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setAllMessages(data || []);
    
    // Find pending contacts (people who messaged you but aren't in contacts)
    const senderIds = new Set(data?.filter((m: any) => m.recipient_id === user.id).map((m: any) => m.sender_id));
    const contactIds = new Set(contacts.map(c => c.id));
    const pendingIds = Array.from(senderIds).filter(id => !contactIds.has(id as string));
    
    if (pendingIds.length > 0) {
      const { data: pendingData } = await supabase
        .from("profiles")
        .select("id, full_name, user_id")
        .in("id", pendingIds);
      
      if (pendingData) {
        setPendingContacts(pendingData as Contact[]);
      }
    }
  };

  const loadMessages = async () => {
    if (!selectedContact || !user) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},recipient_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedContact || !user) return;

    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      recipient_id: selectedContact.id,
      content: messageInput.trim(),
    });

    if (error) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setMessageInput("");
    loadMessages();
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 h-[calc(100vh-4rem)]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <MessageSquare className="w-8 h-8" />
              Peer Chat
            </h1>
            <p className="text-muted-foreground">
              Your ID: <span className="font-mono font-bold">{myUserId}</span>
            </p>
          </div>
          <AddContactDialog />
        </div>

        <div className="grid grid-cols-4 gap-6 h-[calc(100%-8rem)]">
          <Card className="col-span-1 p-4 overflow-y-auto">
            <h3 className="font-semibold mb-4">Contacts</h3>
            <div className="space-y-2">
              {pendingContacts.length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground font-semibold mb-2">Pending Messages</p>
                  {pendingContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors border-2 border-warning ${
                        selectedContact?.id === contact.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <p className="font-medium">{contact.full_name}</p>
                      <p className="text-xs opacity-70">ID: {contact.user_id}</p>
                      <p className="text-xs text-warning">New message!</p>
                    </div>
                  ))}
                  <div className="my-3 border-t" />
                </>
              )}
              
              {contacts.length === 0 && pendingContacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No contacts yet. Add a friend using their ID!
                </p>
              ) : (
                <>
                  {contacts.length > 0 && <p className="text-xs text-muted-foreground font-semibold mb-2">My Contacts</p>}
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedContact?.id === contact.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <p className="font-medium">{contact.full_name}</p>
                      <p className="text-xs opacity-70">ID: {contact.user_id}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </Card>

          <Card className="col-span-3 flex flex-col">
            {selectedContact ? (
              <>
                <div className="p-4 border-b">
                  <h3 className="font-semibold">{selectedContact.full_name}</h3>
                  <p className="text-xs text-muted-foreground">ID: {selectedContact.user_id}</p>
                </div>
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex animate-fade-in",
                        message.sender_id === user?.id ? "justify-end" : "justify-start"
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl p-4 shadow-md hover-scale group relative",
                          message.sender_id === user?.id
                            ? "gradient-primary text-white"
                            : "glass-card"
                        )}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className={cn(
                          "text-xs mt-2 opacity-0 group-hover:opacity-70 transition-opacity",
                          message.sender_id === user?.id ? "text-white/90" : "text-muted-foreground"
                        )}>
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <Button size="icon" onClick={sendMessage}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a contact to start messaging
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
