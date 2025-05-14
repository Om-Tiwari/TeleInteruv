"use client";

// app/interview/page.tsx
import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Mic, MicOff, Play, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Message {
  speaker: "ai" | "candidate";
  text: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function InterviewPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Start interview: call backend, get first AI prompt
  async function handleStartInterview() {
    setIsThinking(true);
    try {
      const res = await fetch(`${API_URL}/api/start_interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedJD: localStorage.getItem("selectedJD") }),
      });
      
      const { result, conversation_id } = await res.json();
      setConversationId(conversation_id);
      setMessages([{ speaker: "ai", text: result }]);
      playTTS(result);
    } catch (error) {
      console.error("Failed to start interview:", error);
    } finally {
      setIsThinking(false);
    }
  }

  // Text-to-speech
  async function playTTS(text: string) {
    setIsSpeaking(true);
    try {
      const res = await fetch(`${API_URL}/api/tts-wav`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.onended = () => setIsSpeaking(false);
        audioRef.current.play();
      } else {
        const audio = new Audio(url);
        audio.onended = () => setIsSpeaking(false);
        audio.play();
        audioRef.current = audio;
      }
    } catch (error) {
      console.error("TTS failed:", error);
      setIsSpeaking(false);
    }
  }

  // Start recording candidate voice
  async function handleRecordStart() {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  }

  // Stop recording and send to STT + chat
  async function handleRecordStop() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    
    recorder.stop();
    setIsRecording(false);
    setIsThinking(true);
    
    recorder.onstop = async () => {
      try {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        
        // STT
        const sttRes = await fetch(`${API_URL}/api/stt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: base64 }),
        });
        
        const { text } = await sttRes.json();
        setMessages(ms => [...ms, { speaker: "candidate", text }]);

        // Chat
        const chatRes = await fetch(`${API_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            conversation_id: conversationId, 
            messages: [{ role: "user", content: text }]
          }),
        });
        
        const { result, conversation_id } = await chatRes.json();
        setConversationId(conversation_id);
        setMessages(ms => [...ms, { speaker: "ai", text: result }]);
        playTTS(result);
      } catch (error) {
        console.error("Processing recording failed:", error);
      } finally {
        setIsThinking(false);
      }
    };
  }

  // End the interview
  async function handleEndInterview() {
    try {
      if (!conversationId) return;
      
      await fetch(`${API_URL}/api/end_interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          conversation_id: conversationId,
          add_conclusion: true 
        }),
      });
      
      // Reset state or navigate away
      // For now, just adding a conclusion message
      setMessages(ms => [...ms, { 
        speaker: "ai", 
        text: "Thank you for participating in this interview. Your responses have been recorded." 
      }]);
    } catch (error) {
      console.error("Failed to end interview:", error);
    }
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-4">
      <audio ref={audioRef} className="hidden" />
      
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full space-y-8">
          <h1 className="text-3xl font-bold text-center">Welcome to Recrew.AI Interview</h1>
          <p className="text-lg text-center text-muted-foreground max-w-lg">
            You'll have a voice conversation with our AI interviewer who will ask you 
            technical and behavioral questions based on the job description.
          </p>
          
          <div className="flex justify-center items-center gap-6 w-full max-w-3xl">
            <Card className="border-2 w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 bg-neutral-800">
                      <AvatarFallback>
                        <span className="text-xl">🤖</span>
                      </AvatarFallback>
                    </Avatar>
                    <Avatar className="w-16 h-16">
                      <AvatarFallback>
                        <span className="text-xl">👤</span>
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <span>AI Interview Session</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">Practice your interview skills with our AI interviewer</p>
                <Button 
                  size="lg" 
                  onClick={handleStartInterview}
                  className="w-full"
                >
                  <Play className="mr-2 h-4 w-4" /> Start Interview
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Interview in Progress</h2>
              <p className="text-sm text-muted-foreground">
                {messages.filter(m => m.speaker === "candidate").length} responses recorded
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              {isSpeaking && (
                <Badge variant="outline" className="bg-green-100 text-green-800 animate-pulse">
                  AI Speaking...
                </Badge>
              )}
              {isRecording && (
                <Badge variant="outline" className="bg-red-100 text-red-800 animate-pulse">
                  Recording...
                </Badge>
              )}
              <Button variant="outline" onClick={handleEndInterview}>
                End Interview
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1 px-4 py-2 border rounded-md bg-slate-50 dark:bg-slate-900">
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.speaker === 'ai' ? 'justify-start' : 'justify-end'}`}
                >
                  <div 
                    className={`p-4 rounded-lg max-w-[80%] ${
                      msg.speaker === 'ai' 
                        ? 'bg-neutral-200 dark:bg-neutral-800 text-left' 
                        : 'bg-blue-500 text-white text-right'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="w-6 h-6">
                        {msg.speaker === 'ai' ? (
                          <AvatarFallback className="text-xs">🤖</AvatarFallback>
                        ) : (
                          <AvatarImage src="/avatars/adrian.jpg" alt="Candidate" />
                        )}
                      </Avatar>
                      <span className="text-xs font-medium">
                        {msg.speaker === 'ai' ? 'AI Interviewer' : 'You'}
                      </span>
                    </div>
                    <p>{msg.text}</p>
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="p-4 rounded-lg max-w-[80%] bg-neutral-200 dark:bg-neutral-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">🤖</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">AI Interviewer</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">Thinking</span>
                      <Progress value={66} className="w-24" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <div className="flex justify-center py-4">
            {!isRecording ? (
              <Button 
                size="lg"
                onClick={handleRecordStart}
                disabled={isSpeaking || isThinking}
                className="rounded-full h-16 w-16"
              >
                <Mic className="h-6 w-6" />
              </Button>
            ) : (
              <Button 
                variant="destructive"
                size="lg"
                onClick={handleRecordStop}
                className="rounded-full h-16 w-16"
              >
                <MicOff className="h-6 w-6" />
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}