import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Mic, Play, Trash2, Edit, Search, SortAsc, Filter, BarChart3, Clock, FileAudio, Loader2 } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "title" | "duration">("date");
  const [filterBy, setFilterBy] = useState<"all" | "audio" | "text" | "transcribed">("all");

  useEffect(() => {
    if (user) {
      loadNotes();
      setupRealtimeSubscription();
    }
    return () => {
      supabase.removeAllChannels();
    };
  }, [user]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('notes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Real-time update:', payload);
          if (payload.eventType === 'INSERT') {
            setNotes(prev => [payload.new as Note, ...prev]);
            toast.success("New note added!");
          } else if (payload.eventType === 'UPDATE') {
            setNotes(prev => prev.map(note => 
              note.id === payload.new.id ? payload.new as Note : note
            ));
          } else if (payload.eventType === 'DELETE') {
            setNotes(prev => prev.filter(note => note.id !== payload.old.id));
          }
        }
      )
      .subscribe();
  };

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
      
      // Track analytics
      if (data && data.length > 0) {
        await supabase.from("usage_analytics").insert({
          user_id: user?.id,
          action_type: "notes_viewed",
          metadata: { count: data.length }
        });
      }
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
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Filtered and sorted notes
  const filteredNotes = useMemo(() => {
    let filtered = notes;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.transcription?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (filterBy !== "all") {
      filtered = filtered.filter(note => {
        if (filterBy === "audio") return note.audio_url !== null;
        if (filterBy === "text") return note.audio_url === null && note.content !== null;
        if (filterBy === "transcribed") return note.transcription !== null;
        return true;
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      } else if (sortBy === "duration") {
        return (b.duration || 0) - (a.duration || 0);
      }
      return 0;
    });

    return sorted;
  }, [notes, searchQuery, filterBy, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const totalNotes = notes.length;
    const audioNotes = notes.filter(n => n.audio_url).length;
    const transcribedNotes = notes.filter(n => n.transcription).length;
    const totalDuration = notes.reduce((sum, n) => sum + (n.duration || 0), 0);
    
    return {
      totalNotes,
      audioNotes,
      transcribedNotes,
      totalDuration: formatDuration(totalDuration),
      avgDuration: totalNotes > 0 ? formatDuration(Math.floor(totalDuration / totalNotes)) : "0:00"
    };
  }, [notes]);

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              Voice Notes & Transcription
            </h1>
            <p className="text-muted-foreground mt-1">
              Record, transcribe, and organize your lecture notes with AI
            </p>
          </div>
          <Button onClick={openNewNote} size="lg" className="hover-scale w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Button>
        </div>

        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="notes">My Notes ({notes.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-6 animate-fade-in mt-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select value={filterBy} onValueChange={(v: any) => setFilterBy(v)}>
                      <SelectTrigger>
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Notes</SelectItem>
                        <SelectItem value="audio">Audio Only</SelectItem>
                        <SelectItem value="text">Text Only</SelectItem>
                        <SelectItem value="transcribed">Transcribed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                      <SelectTrigger>
                        <SortAsc className="mr-2 h-4 w-4" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">By Date</SelectItem>
                        <SelectItem value="title">By Title</SelectItem>
                        <SelectItem value="duration">By Duration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p className="text-muted-foreground">Loading notes...</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Mic className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center px-4">
                    {searchQuery || filterBy !== "all" 
                      ? "No notes match your filters. Try adjusting your search."
                      : "No notes yet. Create your first note!"}
                  </p>
                  {!searchQuery && filterBy === "all" && (
                    <Button onClick={openNewNote} className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Note
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredNotes.map((note, index) => (
                  <Card 
                    key={note.id} 
                    className="group relative hover:shadow-lg transition-all duration-300 hover-scale cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => openEditNote(note)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <CardTitle className="line-clamp-1 text-base">{note.title}</CardTitle>
                            {note.audio_url && <Badge variant="secondary" className="text-xs"><FileAudio className="h-3 w-3" /></Badge>}
                            {note.transcription && <Badge variant="outline" className="text-xs">Transcribed</Badge>}
                          </div>
                          <CardDescription className="flex items-center gap-2 text-xs">
                            <Clock className="h-3 w-3" />
                            {new Date(note.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditNote(note);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => handleDelete(note.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {note.content && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {note.content}
                        </p>
                      )}
                      {note.transcription && (
                        <p className="text-sm text-muted-foreground line-clamp-2 border-l-2 border-primary pl-2">
                          <strong className="text-xs">Transcription:</strong> {note.transcription}
                        </p>
                      )}
                      {note.audio_url && note.duration && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Play className="h-4 w-4" />
                          <span>{formatDuration(note.duration)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 animate-fade-in mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="hover-scale">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
                  <FileAudio className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalNotes}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>

              <Card className="hover-scale">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Audio Notes</CardTitle>
                  <Mic className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.audioNotes}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalNotes > 0 ? Math.round((stats.audioNotes / stats.totalNotes) * 100) : 0}% of total
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-scale">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Transcribed</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.transcribedNotes}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.audioNotes > 0 ? Math.round((stats.transcribedNotes / stats.audioNotes) * 100) : 0}% of audio
                  </p>
                </CardContent>
              </Card>

              <Card className="hover-scale">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDuration}</div>
                  <p className="text-xs text-muted-foreground">Avg: {stats.avgDuration}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Transcription Tips</CardTitle>
                <CardDescription>Get the best results from your voice notes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Badge className="h-6 shrink-0">1</Badge>
                  <div>
                    <p className="font-medium">Choose the right quality</p>
                    <p className="text-sm text-muted-foreground">Medium quality (64kbps) is perfect for lectures. Use low for quick notes.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Badge className="h-6 shrink-0">2</Badge>
                  <div>
                    <p className="font-medium">Record in a quiet environment</p>
                    <p className="text-sm text-muted-foreground">Background noise can affect transcription accuracy.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Badge className="h-6 shrink-0">3</Badge>
                  <div>
                    <p className="font-medium">Keep recordings under 10 minutes</p>
                    <p className="text-sm text-muted-foreground">Shorter recordings transcribe faster and more accurately.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Badge className="h-6 shrink-0">4</Badge>
                  <div>
                    <p className="font-medium">Watch the waveform</p>
                    <p className="text-sm text-muted-foreground">The waveform shows if your audio is being captured correctly.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
