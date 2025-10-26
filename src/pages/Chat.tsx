import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send } from "lucide-react";

const Chat = () => {
  return (
    <Layout>
      <div className="p-8 h-[calc(100vh-4rem)]">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <MessageSquare className="w-8 h-8" />
            Peer Chat
          </h1>
          <p className="text-muted-foreground">
            Connect with classmates and study together
          </p>
        </div>

        <div className="grid grid-cols-4 gap-6 h-[calc(100%-8rem)]">
          {/* Contacts */}
          <Card className="col-span-1 p-4">
            <h3 className="font-semibold mb-4">Contacts</h3>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-muted cursor-pointer hover:bg-muted/80 transition-colors">
                <p className="font-medium">Study Group 1</p>
                <p className="text-xs text-muted-foreground">3 members</p>
              </div>
            </div>
          </Card>

          {/* Chat Area */}
          <Card className="col-span-3 flex flex-col">
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a chat to start messaging
              </div>
            </div>
            <div className="p-4 border-t flex gap-2">
              <Input placeholder="Type a message..." />
              <Button size="icon" className="gradient-primary">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
