import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Square, Play, Pause, Loader2, Sparkles, FileText, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { v4 as uuidv4 } from 'uuid';

interface Note {
  id: string;
  title: string;
  content: string | null;
  audio_url: string | null;
  transcription: string | null;
  duration: number | null;
}

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  onSave: () => void;
}

export const NoteDialog = ({ open, onOpenChange, note, onSave }: NoteDialogProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content || "");
      setAudioUrl(note.audio_url);
      setTranscription(note.transcription);
      setDuration(note.duration || 0);
    } else {
      setTitle("");
      setContent("");
      setAudioUrl(null);
      setTranscription(null);
      setDuration(0);
    }
  }, [note]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const recordingDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(recordingDuration);
        
        // Upload to storage with UUID filename
        const fileName = `${user?.id}/${uuidv4()}.webm`;
        const { error: uploadError } = await supabase.storage
          .from("recordings")
          .upload(fileName, audioBlob);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error("Failed to upload recording");
          return;
        }

        // Get signed URL (1 hour expiry)
        const { data: urlData, error: urlError } = await supabase.storage
          .from("recordings")
          .createSignedUrl(fileName, 3600);

        if (urlError) {
          console.error("URL error:", urlError);
          toast.error("Failed to get recording URL");
          return;
        }

        setAudioUrl(urlData.signedUrl);
      };

      startTimeRef.current = Date.now();
      mediaRecorder.start();
      setIsRecording(true);
      toast.success("Recording started");
    } catch (error) {
      console.error("Recording error:", error);
      toast.error("Failed to start recording");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      toast.success("Recording stopped");
    }
  };

  const togglePlayback = async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      // Refresh signed URL if needed
      if (note?.audio_url && audioUrl) {
        const pathMatch = audioUrl.match(/sign\/recordings\/(.+)\?/);
        if (pathMatch) {
          const { data: urlData, error } = await supabase.storage
            .from("recordings")
            .createSignedUrl(pathMatch[1], 3600);
          
          if (!error && urlData) {
            if (audioRef.current) {
              audioRef.current.src = urlData.signedUrl;
            } else {
              audioRef.current = new Audio(urlData.signedUrl);
              audioRef.current.onended = () => setIsPlaying(false);
            }
            setAudioUrl(urlData.signedUrl);
          }
        }
      }

      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl || undefined);
        audioRef.current.onended = () => setIsPlaying(false);
      }
      
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const transcribeAudio = async (noteId: string) => {
    if (!audioUrl) return;

    setIsTranscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke("transcribe-audio", {
        body: { audioUrl, noteId },
      });

      if (error) throw error;

      setTranscription(data.transcription);
      toast.success("Audio transcribed successfully!");
    } catch (error) {
      console.error("Transcription error:", error);
      toast.error("Failed to transcribe audio");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleAIAction = async (action: string, noteId: string) => {
    if (!transcription && !content) {
      toast.error("No content to process");
      return;
    }

    setIsProcessing(true);
    try {
      const textToProcess = transcription || content;
      let prompt = "";

      switch (action) {
        case "summarize":
          prompt = `Summarize these lecture notes concisely:\n\n${textToProcess}`;
          break;
        case "keypoints":
          prompt = `Extract the key points from these lecture notes as a bullet list:\n\n${textToProcess}`;
          break;
        case "quiz":
          prompt = `Generate 5 quiz questions based on these lecture notes:\n\n${textToProcess}`;
          break;
      }

      const { data, error } = await supabase.functions.invoke("ai-agent", {
        body: {
          taskType: "text_generation",
          prompt,
        },
      });

      if (error) throw error;

      // Append AI result to content
      setContent(prev => `${prev}\n\n--- ${action.toUpperCase()} ---\n${data.result}`);
      toast.success(`${action} generated!`);
    } catch (error) {
      console.error("AI action error:", error);
      toast.error("Failed to process with AI");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setIsSaving(true);
    try {
      if (note) {
        const { error } = await supabase
          .from("notes")
          .update({
            title,
            content,
            audio_url: audioUrl,
            duration,
            transcription,
          })
          .eq("id", note.id);

        if (error) throw error;
        toast.success("Note updated!");
      } else {
        const { data: newNote, error } = await supabase
          .from("notes")
          .insert({
            user_id: user?.id,
            title,
            content,
            audio_url: audioUrl,
            duration,
            transcription,
          })
          .select()
          .single();

        if (error) throw error;

        // Transcribe if we have audio but no transcription
        if (audioUrl && !transcription && newNote) {
          await transcribeAudio(newNote.id);
        }

        toast.success("Note created!");
      }

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{note ? "Edit Note" : "New Note"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Recording Controls */}
          <div className="flex gap-2 items-center p-4 bg-muted/50 rounded-lg">
            {!isRecording && !audioUrl && (
              <Button onClick={startRecording} variant="outline" size="sm">
                <Mic className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
            )}

            {isRecording && (
              <Button onClick={stopRecording} variant="destructive" size="sm">
                <Square className="w-4 h-4 mr-2" />
                Stop Recording
              </Button>
            )}

            {audioUrl && !isRecording && (
              <>
                <Button onClick={togglePlayback} variant="outline" size="sm">
                  {isPlaying ? (
                    <><Pause className="w-4 h-4 mr-2" /> Pause</>
                  ) : (
                    <><Play className="w-4 h-4 mr-2" /> Play Recording</>
                  )}
                </Button>
                {duration > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                  </span>
                )}
                {note && !transcription && (
                  <Button 
                    onClick={() => transcribeAudio(note.id)} 
                    variant="outline" 
                    size="sm"
                    disabled={isTranscribing}
                  >
                    {isTranscribing ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Transcribing...</>
                    ) : (
                      <><FileText className="w-4 h-4 mr-2" /> Transcribe</>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Transcription */}
          {transcription && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Transcription</label>
              <Textarea
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
          )}

          {/* Manual Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              placeholder="Type your notes here or record audio above..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
            />
          </div>

          {/* AI Actions */}
          {(transcription || content) && note && (
            <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium w-full mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Features
              </p>
              <Button 
                onClick={() => handleAIAction("summarize", note.id)} 
                variant="outline" 
                size="sm"
                disabled={isProcessing}
              >
                <Wand2 className="w-3 h-3 mr-1" />
                Summarize
              </Button>
              <Button 
                onClick={() => handleAIAction("keypoints", note.id)} 
                variant="outline" 
                size="sm"
                disabled={isProcessing}
              >
                <Wand2 className="w-3 h-3 mr-1" />
                Key Points
              </Button>
              <Button 
                onClick={() => handleAIAction("quiz", note.id)} 
                variant="outline" 
                size="sm"
                disabled={isProcessing}
              >
                <Wand2 className="w-3 h-3 mr-1" />
                Generate Quiz
              </Button>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                "Save Note"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
