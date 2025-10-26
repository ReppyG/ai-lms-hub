import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

const Notes = () => {
  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <FileText className="w-8 h-8" />
              Notes
            </h1>
            <p className="text-muted-foreground">
              Keep track of your personal study notes
            </p>
          </div>
          <Button className="gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-all border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Plus className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Create your first note</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Notes;
