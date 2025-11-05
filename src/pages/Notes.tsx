import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Mic, Play, Trash2, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { NoteDialog } from "@/components/NoteDialog";

interface Note {
  id: string;
  title: string;
  content: string | null;
  audio_url: string | null;
  transcription: string | null;
  duration: number | null;
  created_at: string;
}

const Notes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  useEffect(() => {
    if (user) {
      loadNotes();
    }
  }, [user]);

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Error loading notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this note?")) return;

    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Note deleted");
      loadNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    }
  };

  const openNewNote = () => {
    setSelectedNote(null);
    setDialogOpen(true);
  };

  const openEditNote = (note: Note) => {
    setSelectedNote(note);
    setDialogOpen(true);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              Notes
            </h1>
            <p className="text-muted-foreground">
              Record lectures, transcribe, and enhance with AI
            </p>
          </div>
          <Button className="gradient-primary" onClick={openNewNote}>
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="grid grid-cols-1 gap-4">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all border-dashed border-2"
              onClick={openNewNote}
            >
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mic className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Create your first note or recording</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <Card 
                key={note.id} 
                className="cursor-pointer hover:shadow-lg transition-all group"
                onClick={() => openEditNote(note)}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">
                      {note.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(note.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditNote(note);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => handleDelete(note.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {note.audio_url && (
                    <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                      <Play className="w-4 h-4" />
                      <span>Recording {formatDuration(note.duration)}</span>
                    </div>
                  )}
                  {note.content && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {note.content}
                    </p>
                  )}
                  {note.transcription && !note.content && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {note.transcription}
                    </p>
                  )}
                  {!note.content && !note.transcription && note.audio_url && (
                    <p className="text-sm text-muted-foreground italic">
                      Audio recording (not yet transcribed)
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <NoteDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          note={selectedNote}
          onSave={loadNotes}
        />
      </div>
    </Layout>
  );
};

export default Notes;
