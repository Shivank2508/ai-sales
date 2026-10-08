import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCampaigns, useCallLeadWithAI } from "../../campaigns/hooks/useCampaigns";
import { useSurveys, useSurvey } from "../../surveys/hooks/useSurveys";
import { useLeads } from "../../leads/hooks/useLeads";
import {
  ArrowLeft,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  CheckCircle2,
  Headphones,
  Sparkles,
  Clock,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Layers,
  User,
  Phone,
  Check,
} from "lucide-react";

type CallActivityState = "idle" | "connecting" | "speaking" | "listening" | "processing" | "completed";

interface LiveCaption {
  speaker: "ai" | "user" | "system" | "listening";
  text: string;
  isInterim?: boolean;
}

export const AgentExecutionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns();
  const { data: surveys, isLoading: surveysLoading } = useSurveys();
  const { data: leads } = useLeads();
  const callLeadMutation = useCallLeadWithAI();

  // Campaign, Survey & Lead Selections
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>("");
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [customLeadName, setCustomLeadName] = useState<string>("Alex Morgan (Prospect)");
  const [customLeadPhone, setCustomLeadPhone] = useState<string>("+91 98765 43210");
  const [selectedLang, setSelectedLang] = useState<string>("en-IN");

  // Load detailed survey data (milestones & questions)
  const { data: activeSurveyDetail } = useSurvey(selectedSurveyId);

  // Call Telephony State
  const [callActive, setCallActive] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [callActivityState, setCallActivityState] = useState<CallActivityState>("idle");
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [surveySessionId, setSurveySessionId] = useState<string | undefined>(undefined);

  // Survey Milestones Tracking
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(1);
  const [currentQuestionId, setCurrentQuestionId] = useState<string>("");
  const [isCallCompleted, setIsCallCompleted] = useState<boolean>(false);

  // Voice Controls State
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState<boolean>(false);

  // Live Spoken Caption
  const [liveCaption, setLiveCaption] = useState<LiveCaption>({
    speaker: "system",
    text: "Telephony Line Ready. Click 'Start Phone Call' to begin hands-free conversation.",
  });

  // Reference pointers to completely eliminate stale closures in async callbacks
  const callActiveRef = useRef<boolean>(false);
  const isPlayingVoiceRef = useRef<boolean>(false);
  const isSendingRef = useRef<boolean>(false);
  const isMutedRef = useRef<boolean>(false);
  const isSpeakerMutedRef = useRef<boolean>(false);
  const selectedCampaignIdRef = useRef<string>("");
  const selectedSurveyIdRef = useRef<string>("");
  const selectedLeadIdRef = useRef<string>("");
  const conversationIdRef = useRef<string | undefined>(undefined);
  const surveySessionIdRef = useRef<string | undefined>(undefined);
  const currentQuestionIndexRef = useRef<number>(1);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Handler Ref to allow recognition.onresult to always invoke the latest function instance
  const handleSendVoiceReplyRef = useRef<(text: string) => Promise<void>>(async () => {});

  // Sync ref values
  useEffect(() => {
    callActiveRef.current = callActive;
  }, [callActive]);

  useEffect(() => {
    isPlayingVoiceRef.current = isPlayingVoice;
  }, [isPlayingVoice]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isSpeakerMutedRef.current = isSpeakerMuted;
  }, [isSpeakerMuted]);

  useEffect(() => {
    selectedCampaignIdRef.current = selectedCampaignId;
  }, [selectedCampaignId]);

  useEffect(() => {
    selectedSurveyIdRef.current = selectedSurveyId;
  }, [selectedSurveyId]);

  useEffect(() => {
    selectedLeadIdRef.current = selectedLeadId;
  }, [selectedLeadId]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    surveySessionIdRef.current = surveySessionId;
  }, [surveySessionId]);

  useEffect(() => {
    currentQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  // Pre-initialize reusable audio element on component mount
  useEffect(() => {
    if (!activeAudioRef.current && typeof window !== "undefined") {
      activeAudioRef.current = new Audio();
    }
  }, []);

  // Auto-select initial campaign, survey & lead with query param priority
  useEffect(() => {
    const paramCampId = searchParams.get("campaignId");
    const paramSurveyId = searchParams.get("surveyId");

    if (paramCampId && campaigns && campaigns.length > 0) {
      const foundCamp = campaigns.find((c) => c._id === paramCampId);
      if (foundCamp) {
        setSelectedCampaignId(foundCamp._id);
        selectedCampaignIdRef.current = foundCamp._id;

        if (paramSurveyId) {
          setSelectedSurveyId(paramSurveyId);
          selectedSurveyIdRef.current = paramSurveyId;
        } else if (foundCamp.surveyId) {
          setSelectedSurveyId(foundCamp.surveyId.toString());
          selectedSurveyIdRef.current = foundCamp.surveyId.toString();
        }
        return;
      }
    }

    if (campaigns && campaigns.length > 0 && !selectedCampaignId) {
      const camp = campaigns[0];
      setSelectedCampaignId(camp._id);
      selectedCampaignIdRef.current = camp._id;
      if (camp.surveyId) {
        setSelectedSurveyId(camp.surveyId.toString());
        selectedSurveyIdRef.current = camp.surveyId.toString();
      }
    }
  }, [campaigns, searchParams, selectedCampaignId]);

  useEffect(() => {
    const paramSurveyId = searchParams.get("surveyId");
    if (paramSurveyId && surveys && surveys.length > 0) {
      const foundSurvey = surveys.find((s) => s._id === paramSurveyId);
      if (foundSurvey) {
        setSelectedSurveyId(foundSurvey._id);
        selectedSurveyIdRef.current = foundSurvey._id;
        return;
      }
    }

    if (selectedCampaignId && surveys && surveys.length > 0 && !selectedSurveyId) {
      const campaign = campaigns?.find((c) => c._id === selectedCampaignId);
      if (campaign?.surveyId) {
        setSelectedSurveyId(campaign.surveyId.toString());
        selectedSurveyIdRef.current = campaign.surveyId.toString();
      } else {
        const match = surveys.find(
          (s) => s.campaignId === selectedCampaignId || (campaign && s.name.toLowerCase().includes(campaign.name.toLowerCase()))
        );
        if (match) {
          setSelectedSurveyId(match._id);
          selectedSurveyIdRef.current = match._id;
        }
      }
    }

    if (surveys && surveys.length > 0 && !selectedSurveyId) {
      setSelectedSurveyId(surveys[0]._id);
      selectedSurveyIdRef.current = surveys[0]._id;
    }
  }, [surveys, searchParams, selectedCampaignId, selectedSurveyId, campaigns]);

  useEffect(() => {
    if (leads && leads.length > 0 && !selectedLeadId) {
      setSelectedLeadId(leads[0]._id);
      selectedLeadIdRef.current = leads[0]._id;
      setCustomLeadName(`${leads[0].firstName || ""} ${leads[0].lastName || ""}`.trim() || "Alex Morgan");
      setCustomLeadPhone(leads[0].phone || "+91 98765 43210");
    }
  }, [leads, selectedLeadId]);

  // When campaign changes, auto-link to matching survey if possible
  const handleCampaignChange = (cId: string) => {
    setSelectedCampaignId(cId);
    selectedCampaignIdRef.current = cId;
    const campaign = campaigns?.find((c) => c._id === cId);
    if (campaign && campaign.surveyId) {
      setSelectedSurveyId(campaign.surveyId.toString());
      selectedSurveyIdRef.current = campaign.surveyId.toString();
    } else if (surveys && surveys.length > 0) {
      const match = surveys.find(
        (s) => s.campaignId === cId || (campaign && s.name.toLowerCase().includes(campaign.name.toLowerCase()))
      );
      if (match) {
        setSelectedSurveyId(match._id);
        selectedSurveyIdRef.current = match._id;
      }
    }
  };

  // Call timer increment
  useEffect(() => {
    let interval: any = null;
    if (callActive) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callActive]);

  // Stop current active audio
  const stopAudio = useCallback(() => {
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch (e) {}
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    isPlayingVoiceRef.current = false;
    setIsPlayingVoice(false);
  }, []);

  // Stop microphone listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsMicListening(false);
  }, []);

  // Fallback Web Speech Synthesis if TTS audio is unavailable or blocked
  const fallbackSpeechSynthesis = useCallback(
    (text: string, onDone?: () => void) => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume(); // Fix known Chromium queue lock bug
        const cleanText = text.replace(/[*_#`]/g, "");
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.lang = selectedLang.startsWith("hi") ? "hi-IN" : "en-IN";

        utterance.onstart = () => {
          isPlayingVoiceRef.current = true;
          setIsPlayingVoice(true);
          setCallActivityState("speaking");
        };

        utterance.onend = () => {
          isPlayingVoiceRef.current = false;
          setIsPlayingVoice(false);
          if (onDone) {
            onDone();
          } else if (callActiveRef.current) {
            setCallActivityState("listening");
            setLiveCaption({
              speaker: "listening",
              text: "Listening to your voice... (Hands-free active)",
            });
            setTimeout(() => startContinuousListening(), 250);
          }
        };

        utterance.onerror = () => {
          isPlayingVoiceRef.current = false;
          setIsPlayingVoice(false);
          if (onDone) {
            onDone();
          } else if (callActiveRef.current) {
            setCallActivityState("listening");
            setTimeout(() => startContinuousListening(), 300);
          }
        };

        window.speechSynthesis.speak(utterance);
      } else {
        isPlayingVoiceRef.current = false;
        setIsPlayingVoice(false);
        if (onDone) {
          onDone();
        } else if (callActiveRef.current) {
          setCallActivityState("listening");
          setTimeout(() => startContinuousListening(), 300);
        }
      }
    },
    [selectedLang]
  );

  // Play audio streamed from backend TTS
  const speakWithAI = useCallback(
    (text: string, base64Audio?: string, mimeType: string = "audio/wav", onDone?: () => void) => {
      stopListening();
      setLiveCaption({ speaker: "ai", text, isInterim: false });
      setCallActivityState("speaking");

      if (isSpeakerMutedRef.current) {
        if (callActiveRef.current) {
          setCallActivityState("listening");
          setTimeout(() => startContinuousListening(), 300);
        }
        if (onDone) onDone();
        return;
      }

      if (base64Audio) {
        try {
          const audio = activeAudioRef.current || new Audio();
          activeAudioRef.current = audio;

          // Reset audio element state
          audio.pause();
          audio.src = `data:${mimeType};base64,${base64Audio}`;
          audio.currentTime = 0;
          audio.volume = 1.0;

          isPlayingVoiceRef.current = true;
          setIsPlayingVoice(true);

          audio.onended = () => {
            isPlayingVoiceRef.current = false;
            setIsPlayingVoice(false);
            if (onDone) {
              onDone();
            } else if (callActiveRef.current) {
              setCallActivityState("listening");
              setLiveCaption({
                speaker: "listening",
                text: "Listening to your voice... (Hands-free active)",
              });
              setTimeout(() => {
                startContinuousListening();
              }, 200);
            }
          };

          audio.onerror = (e) => {
            console.warn("Audio element error, falling back to speech synthesis:", e);
            fallbackSpeechSynthesis(text, onDone);
          };

          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn("Audio play() blocked, using speech synthesis fallback:", err);
              fallbackSpeechSynthesis(text, onDone);
            });
          }
          return;
        } catch (e) {
          fallbackSpeechSynthesis(text, onDone);
          return;
        }
      }

      fallbackSpeechSynthesis(text, onDone);
    },
    [fallbackSpeechSynthesis]
  );

  // Continuous Hands-free Speech Recognition (No Click to Speak, Ever)
  const startContinuousListening = useCallback(() => {
    if (!callActiveRef.current || isMutedRef.current || isPlayingVoiceRef.current || isSendingRef.current) {
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in browser");
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = selectedLang;

      recognition.onstart = () => {
        setIsMicListening(true);
        setCallActivityState("listening");
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim) {
          setLiveCaption({ speaker: "user", text: interim, isInterim: true });
        }

        if (final && final.trim()) {
          const spokenText = final.trim();
          setLiveCaption({ speaker: "user", text: spokenText, isInterim: false });
          setIsMicListening(false);
          try {
            recognition.abort();
          } catch (e) {}
          // ALWAYS invoke latest function via handleSendVoiceReplyRef
          handleSendVoiceReplyRef.current(spokenText);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== "no-speech" && event.error !== "aborted") {
          console.warn("Speech recognition notice:", event.error);
        }
        setIsMicListening(false);
        // Automatically restart listening if call remains active
        if (callActiveRef.current && !isPlayingVoiceRef.current && !isSendingRef.current && !isMutedRef.current) {
          setTimeout(() => {
            if (callActiveRef.current && !isPlayingVoiceRef.current && !isSendingRef.current && !isMutedRef.current) {
              startContinuousListening();
            }
          }, 200);
        }
      };

      recognition.onend = () => {
        setIsMicListening(false);
        // Continuous hands-free loop restart
        if (callActiveRef.current && !isPlayingVoiceRef.current && !isSendingRef.current && !isMutedRef.current) {
          setTimeout(() => {
            if (callActiveRef.current && !isPlayingVoiceRef.current && !isSendingRef.current && !isMutedRef.current) {
              startContinuousListening();
            }
          }, 150);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Speech recognition start error:", err);
      setIsMicListening(false);
    }
  }, [selectedLang]);

  // Send Recognized Spoken Answer to Backend (Natural Conversation Turn)
  const handleSendVoiceReply = async (spokenText: string) => {
    const campaignId = selectedCampaignIdRef.current;
    if (!spokenText.trim() || !campaignId || isSendingRef.current) return;

    isSendingRef.current = true;
    stopAudio();
    stopListening();
    setCallActivityState("processing");
    setLiveCaption({ speaker: "user", text: spokenText.trim(), isInterim: false });

    try {
      const targetLeadId = selectedLeadIdRef.current || (leads && leads[0]?._id) || "6ac4e70c918d6edfb2f61424";
      const res = await callLeadMutation.mutateAsync({
        campaignId,
        surveyId: selectedSurveyIdRef.current,
        leadId: targetLeadId,
        customerReply: spokenText.trim(),
        conversationId: conversationIdRef.current,
        surveySessionId: surveySessionIdRef.current,
      });

      if (res.conversationId) {
        setConversationId(res.conversationId);
        conversationIdRef.current = res.conversationId;
      }
      if (res.surveySessionId) {
        setSurveySessionId(res.surveySessionId);
        surveySessionIdRef.current = res.surveySessionId;
      }
      if (res.currentQuestionIndex) {
        setCurrentQuestionIndex(res.currentQuestionIndex);
        currentQuestionIndexRef.current = res.currentQuestionIndex;
      }
      if (res.currentQuestionId) {
        setCurrentQuestionId(res.currentQuestionId);
      }

      // Check if survey has reached conclusion
      if (res.completed) {
        setIsCallCompleted(true);
        speakWithAI(
          res.openingSpeech || "Thank you so much for your time and feedback. Have a great day!",
          res.audioBase64,
          res.mimeType || "audio/wav",
          () => {
            setCallActive(false);
            callActiveRef.current = false;
            setCallActivityState("completed");
            setLiveCaption({
              speaker: "system",
              text: "Survey call completed & response recorded to database.",
              isInterim: false,
            });
          }
        );
        return;
      }

      // Normal next question turn
      speakWithAI(res.openingSpeech || "Thank you.", res.audioBase64, res.mimeType || "audio/wav");
    } catch (err: any) {
      setCallActivityState("listening");
      setLiveCaption({
        speaker: "system",
        text: `Voice processing notice: ${err.message || "Line active. Please continue speaking."}`,
        isInterim: false,
      });
      if (callActiveRef.current && !isMutedRef.current) {
        setTimeout(() => {
          if (!isSendingRef.current) {
            startContinuousListening();
          }
        }, 800);
      }
    } finally {
      isSendingRef.current = false;
    }
  };

  // Keep handleSendVoiceReplyRef always updated to latest function instance
  useEffect(() => {
    handleSendVoiceReplyRef.current = handleSendVoiceReply;
  });

  // Start Call Handler
  const handleStartCall = async () => {
    const campaignId = selectedCampaignIdRef.current || selectedCampaignId;
    if (!campaignId) return;

    const targetLeadId = selectedLeadIdRef.current || selectedLeadId || (leads && leads[0]?._id) || "6ac4e70c918d6edfb2f61424";

    // Unlock audio context on user gesture
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.load();
      } catch (e) {}
    }

    setCallActive(true);
    callActiveRef.current = true;
    setIsCallCompleted(false);
    setCurrentQuestionIndex(1);
    currentQuestionIndexRef.current = 1;
    setCallDuration(0);
    setCallActivityState("connecting");
    setLiveCaption({
      speaker: "system",
      text: "Connecting to caller provider line...",
      isInterim: false,
    });

    try {
      const res = await callLeadMutation.mutateAsync({
        campaignId,
        surveyId: selectedSurveyIdRef.current || selectedSurveyId,
        leadId: targetLeadId,
      });

      if (res.conversationId) {
        setConversationId(res.conversationId);
        conversationIdRef.current = res.conversationId;
      }
      if (res.surveySessionId) {
        setSurveySessionId(res.surveySessionId);
        surveySessionIdRef.current = res.surveySessionId;
      }
      if (res.currentQuestionIndex) {
        setCurrentQuestionIndex(res.currentQuestionIndex);
        currentQuestionIndexRef.current = res.currentQuestionIndex;
      }
      if (res.currentQuestionId) {
        setCurrentQuestionId(res.currentQuestionId);
      }

      // Speak opening question and once finished, automatically start continuous listening!
      speakWithAI(
        res.openingSpeech || "Hello! Calling from the sales team.",
        res.audioBase64,
        res.mimeType || "audio/wav"
      );
    } catch (err: any) {
      setCallActivityState("listening");
      setLiveCaption({
        speaker: "system",
        text: `Line notice: ${err.message || "Connected via audio channel."}`,
        isInterim: false,
      });
      setTimeout(() => {
        startContinuousListening();
      }, 500);
    }
  };

  // End Call Handler
  const handleEndCall = () => {
    stopAudio();
    stopListening();
    setCallActive(false);
    callActiveRef.current = false;
    setCallActivityState("idle");
    setLiveCaption({
      speaker: "system",
      text: `Call ended. Total duration: ${Math.floor(callDuration / 60)}m ${callDuration % 60}s.`,
      isInterim: false,
    });
  };

  // Toggle Mute Microphone
  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      isMutedRef.current = false;
      if (callActive && !isPlayingVoice) {
        startContinuousListening();
      }
    } else {
      setIsMuted(true);
      isMutedRef.current = true;
      stopListening();
    }
  };

  const surveyQuestions = activeSurveyDetail?.questions || [];
  const activeQuestion = surveyQuestions[currentQuestionIndex - 1];

  return (
    <div className="d-flex flex-column gap-3" style={{ maxWidth: "1280px", margin: "0 auto", minHeight: "85vh" }}>
      {/* Top Telephony Header Strip */}
      <div className="card shadow-sm border-0 bg-white">
        <div className="card-body p-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="d-flex align-items-center gap-3">
            <Link to="/campaigns" className="btn btn-outline-secondary btn-sm p-2 rounded-circle" title="Back to Campaigns">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h1 className="h5 fw-bold mb-0 text-dark">AI Voice Telephony Station</h1>
                <span className="badge bg-success-subtle text-success border border-success-subtle small d-flex align-items-center gap-1 py-1 px-2">
                  <Radio size={12} className={callActive ? "animate-pulse" : ""} />
                  <span>Caller Provider Line: Ready</span>
                </span>
              </div>
              <span className="text-secondary small" style={{ fontSize: "12px" }}>
                Direct full-duplex voice stream. No chat, no typing — simply talk hands-free.
              </span>
            </div>
          </div>

          {/* Quick Target Settings */}
          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Campaign Selector */}
            <div className="d-flex align-items-center gap-1 bg-light px-2 py-1 rounded-2 border">
              <span className="text-secondary small fw-bold" style={{ fontSize: "11px" }}>
                Campaign:
              </span>
              <select
                className="form-select form-select-sm border-0 bg-transparent py-0 fw-semibold"
                style={{ fontSize: "12px", width: "190px" }}
                value={selectedCampaignId}
                onChange={(e) => handleCampaignChange(e.target.value)}
                disabled={callActive}
              >
                {campaigns?.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Selector */}
            <div className="d-flex align-items-center gap-1 bg-light px-2 py-1 rounded-2 border">
              <span className="text-secondary small fw-bold" style={{ fontSize: "11px" }}>
                Language:
              </span>
              <select
                className="form-select form-select-sm border-0 bg-transparent py-0 fw-semibold"
                style={{ fontSize: "12px", width: "135px" }}
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                disabled={callActive}
              >
                <option value="en-IN">English (India)</option>
                <option value="en-US">English (US)</option>
                <option value="hi-IN">Hindi (India)</option>
              </select>
            </div>

            {/* Test Voice Speaker */}
            <button
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
              onClick={() => {
                speakWithAI("Hello! Caller provider voice link is active and ready.");
              }}
              disabled={callActive}
              title="Test audio speaker"
            >
              <Volume2 size={14} />
              <span className="small">Test Speaker</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CALLER STATION CONSOLE */}
      <div
        className="card shadow-lg border-0 rounded-4 overflow-hidden position-relative d-flex flex-column justify-content-between"
        style={{
          background: "radial-gradient(ellipse at 50% 20%, #172033 0%, #0c1220 50%, #060911 100%)",
          minHeight: "680px",
          color: "#f8fafc",
        }}
      >
        {/* Top Status Bar in Phone Window */}
        <div
          className="p-3 px-4 d-flex justify-content-between align-items-center"
          style={{ background: "rgba(15, 23, 42, 0.65)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}
        >
          <div className="d-flex align-items-center gap-2">
            <span
              className={`rounded-circle d-inline-block ${
                callActive ? "bg-success animate-pulse" : "bg-secondary"
              }`}
              style={{ width: "10px", height: "10px" }}
            />
            <span className="fw-semibold text-light small font-monospace">
              {callActive
                ? `LINE CONNECTED • ${String(Math.floor(callDuration / 60)).padStart(2, "0")}:${String(
                    callDuration % 60
                  ).padStart(2, "0")}`
                : "LINE STANDBY • READY TO DIAL"}
            </span>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-dark bg-opacity-75 text-secondary border border-secondary border-opacity-25 small px-2 py-1 font-monospace">
              WebRTC Audio Trunk • 24kHz HD
            </span>
            <span className="badge bg-dark bg-opacity-75 text-info border border-info border-opacity-25 small px-2 py-1 font-monospace">
              Latency: &lt;300ms
            </span>
          </div>
        </div>

        {/* Center Stage: Callee Profile & Animated Voice Visualizer */}
        <div className="p-4 p-md-5 d-flex flex-column align-items-center justify-content-center text-center my-auto">
          {/* Callee Identity */}
          <div className="d-flex flex-column align-items-center mb-4">
            {/* Caller Avatar with Animated Rings */}
            <div className="position-relative mb-3">
              {/* Outer Pulsing Waves */}
              {callActive && (callActivityState === "speaking" || callActivityState === "listening") && (
                <div
                  className="position-absolute top-50 start-50 translate-middle rounded-circle"
                  style={{
                    width: "160px",
                    height: "160px",
                    background:
                      callActivityState === "speaking"
                        ? "radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(56, 189, 248, 0) 70%)"
                        : "radial-gradient(circle, rgba(34, 197, 94, 0.25) 0%, rgba(34, 197, 94, 0) 70%)",
                    animation: "pulseSpeaking 1.8s infinite ease-out",
                  }}
                />
              )}

              <div
                className={`rounded-circle d-flex align-items-center justify-content-center shadow-lg transition-all ${
                  callActive
                    ? callActivityState === "speaking"
                      ? "border border-4 border-info text-info"
                      : callActivityState === "listening"
                      ? "border border-4 border-success text-success"
                      : "border border-4 border-primary text-primary"
                    : "border border-secondary border-opacity-25 text-secondary"
                }`}
                style={{
                  width: "100px",
                  height: "100px",
                  background: "rgba(15, 23, 42, 0.8)",
                  boxShadow:
                    callActive && callActivityState === "speaking"
                      ? "0 0 35px rgba(56, 189, 248, 0.4)"
                      : callActive && callActivityState === "listening"
                      ? "0 0 35px rgba(34, 197, 94, 0.4)"
                      : "0 10px 25px rgba(0, 0, 0, 0.5)",
                }}
              >
                {callActive ? (
                  callActivityState === "speaking" ? (
                    <Headphones size={46} />
                  ) : callActivityState === "listening" ? (
                    <Mic size={46} />
                  ) : (
                    <Phone size={46} />
                  )
                ) : (
                  <User size={46} />
                )}
              </div>
            </div>

            <h2 className="h4 fw-bold text-white mb-1">{customLeadName}</h2>
            <div className="d-flex align-items-center gap-2 text-secondary small">
              <span>{customLeadPhone}</span>
              <span>•</span>
              <span className="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-25">
                {campaigns?.find((c) => c._id === selectedCampaignId)?.name || "CP/Rurban – Guard"}
              </span>
            </div>
          </div>

          {/* Central Animated Equalizer Soundwave Bars */}
          <div
            className="d-flex align-items-center justify-content-center gap-2 my-3 p-3 rounded-4"
            style={{
              height: "75px",
              width: "100%",
              maxWidth: "460px",
              background: "rgba(15, 23, 42, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
            }}
          >
            {[18, 35, 52, 28, 48, 64, 32, 58, 44, 60, 36, 50, 24, 42, 30].map((h, i) => {
              const isAnim = callActive && (callActivityState === "speaking" || callActivityState === "listening");
              const barColor =
                callActivityState === "speaking"
                  ? "#38bdf8"
                  : callActivityState === "listening"
                  ? "#4ade80"
                  : callActivityState === "processing"
                  ? "#c084fc"
                  : "#64748b";

              return (
                <div
                  key={i}
                  className="rounded-pill transition-all"
                  style={{
                    width: "5px",
                    height: isAnim ? `${h}px` : "12px",
                    backgroundColor: barColor,
                    opacity: isAnim ? 0.95 : 0.35,
                    boxShadow: isAnim ? `0 0 10px ${barColor}` : "none",
                    transition: "height 0.2s ease, background-color 0.3s ease",
                    animation: isAnim ? `pulseSpeaking ${1 + (i % 5) * 0.2}s infinite alternate` : "none",
                  }}
                />
              );
            })}
          </div>

          {/* Voice State Status Badge */}
          <div className="my-2">
            {callActivityState === "speaking" && (
              <span className="badge rounded-pill bg-info bg-opacity-20 text-info border border-info border-opacity-50 px-3 py-2 fs-6 fw-semibold d-inline-flex align-items-center gap-2">
                <Headphones size={16} />
                <span>AI Caller Speaking...</span>
              </span>
            )}
            {callActivityState === "listening" && (
              <span className="badge rounded-pill bg-success bg-opacity-20 text-success border border-success border-opacity-50 px-3 py-2 fs-6 fw-semibold d-inline-flex align-items-center gap-2 animate-pulse">
                <Mic size={16} />
                <span>Listening to You (Speak Naturally)</span>
              </span>
            )}
            {callActivityState === "processing" && (
              <span className="badge rounded-pill bg-purple bg-opacity-20 text-purple border border-purple border-opacity-50 px-3 py-2 fs-6 fw-semibold d-inline-flex align-items-center gap-2">
                <Sparkles size={16} />
                <span>Processing Voice Response...</span>
              </span>
            )}
            {callActivityState === "connecting" && (
              <span className="badge rounded-pill bg-warning bg-opacity-20 text-warning border border-warning border-opacity-50 px-3 py-2 fs-6 fw-semibold d-inline-flex align-items-center gap-2">
                <Radio size={16} className="animate-pulse" />
                <span>Connecting to Caller Line...</span>
              </span>
            )}
            {callActivityState === "completed" && (
              <span className="badge rounded-pill bg-primary bg-opacity-20 text-primary border border-primary border-opacity-50 px-3 py-2 fs-6 fw-semibold d-inline-flex align-items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Survey Completed & Recorded</span>
              </span>
            )}
            {callActivityState === "idle" && (
              <span className="badge rounded-pill bg-secondary bg-opacity-20 text-secondary border border-secondary border-opacity-50 px-3 py-2 fs-6 fw-semibold d-inline-flex align-items-center gap-2">
                <PhoneCall size={16} />
                <span>Ready to Connect Voice Call</span>
              </span>
            )}
          </div>

          {/* Live Spoken Closed Caption (Subtitle Bar) */}
          <div
            className="w-100 mt-3 p-3 rounded-4 shadow-sm text-center"
            style={{
              maxWidth: "680px",
              background: "rgba(15, 23, 42, 0.75)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(12px)",
              minHeight: "78px",
            }}
          >
            <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
              {liveCaption.speaker === "ai" && (
                <span className="badge bg-info text-dark fw-bold small py-1 px-2" style={{ fontSize: "10px" }}>
                  AI VOICE
                </span>
              )}
              {liveCaption.speaker === "user" && (
                <span className="badge bg-success text-white fw-bold small py-1 px-2" style={{ fontSize: "10px" }}>
                  YOU (VOICE)
                </span>
              )}
              {liveCaption.speaker === "listening" && (
                <span className="badge bg-success bg-opacity-50 text-white small py-1 px-2" style={{ fontSize: "10px" }}>
                  LISTENING
                </span>
              )}
              {liveCaption.speaker === "system" && (
                <span className="badge bg-secondary text-white small py-1 px-2" style={{ fontSize: "10px" }}>
                  SYSTEM
                </span>
              )}
            </div>

            <p
              className="mb-0 fs-6 text-light fw-medium"
              style={{
                lineHeight: "1.5",
                fontStyle: liveCaption.isInterim ? "italic" : "normal",
                opacity: liveCaption.isInterim ? 0.8 : 1,
              }}
            >
              "{liveCaption.text}"
            </p>
          </div>

          {/* Current Survey Question Step (Minimalist Indicator) */}
          {surveyQuestions.length > 0 && (
            <div className="mt-3 text-secondary small d-flex align-items-center gap-2">
              <span className="fw-semibold text-white-50">Survey Progression:</span>
              <div className="d-flex align-items-center gap-1">
                {surveyQuestions.map((_, idx) => {
                  const stepNum = idx + 1;
                  const isCurrent = stepNum === currentQuestionIndex && callActive;
                  const isPassed = stepNum < currentQuestionIndex || isCallCompleted;
                  return (
                    <span
                      key={idx}
                      className={`badge rounded-pill ${
                        isPassed
                          ? "bg-success text-white"
                          : isCurrent
                          ? "bg-info text-dark fw-bold animate-pulse"
                          : "bg-secondary bg-opacity-50 text-white-50"
                      }`}
                      style={{ fontSize: "10px", padding: "4px 8px" }}
                    >
                      {isPassed ? <Check size={10} /> : `Q${stepNum}`}
                    </span>
                  );
                })}
              </div>
              {activeQuestion && callActive && (
                <span className="text-info small ms-2 fw-medium">
                  • {activeQuestion.text?.slice(0, 45)}...
                </span>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM TELEPHONY CALL CONTROLS */}
        <div
          className="p-4 px-md-5 d-flex justify-content-center align-items-center gap-4"
          style={{ background: "rgba(10, 15, 29, 0.9)", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}
        >
          {callActive ? (
            <>
              {/* Mute Microphone Button */}
              <button
                type="button"
                className={`btn rounded-circle d-flex align-items-center justify-content-center p-0 shadow ${
                  isMuted ? "btn-danger" : "btn-outline-light"
                }`}
                style={{ width: "52px", height: "52px" }}
                onClick={handleToggleMute}
                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>

              {/* End Call / Hang Up Button */}
              <button
                type="button"
                className="btn btn-danger btn-lg rounded-pill px-5 py-3 fw-bold shadow-lg d-flex align-items-center gap-2"
                style={{ fontSize: "17px", minWidth: "220px", justifyContent: "center" }}
                onClick={handleEndCall}
              >
                <PhoneOff size={22} />
                <span>Hang Up</span>
              </button>

              {/* Mute Speaker Output Button */}
              <button
                type="button"
                className={`btn rounded-circle d-flex align-items-center justify-content-center p-0 shadow ${
                  isSpeakerMuted ? "btn-danger" : "btn-outline-light"
                }`}
                style={{ width: "52px", height: "52px" }}
                onClick={() => {
                  if (!isSpeakerMuted) {
                    stopAudio();
                  }
                  setIsSpeakerMuted(!isSpeakerMuted);
                }}
                title={isSpeakerMuted ? "Unmute Speaker" : "Mute Speaker"}
              >
                {isSpeakerMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
              </button>
            </>
          ) : (
            <>
              {/* Start Phone Call Button */}
              <button
                type="button"
                className="btn btn-success btn-lg rounded-pill px-5 py-3 fw-bold shadow-lg d-flex align-items-center gap-3 transition-all hover-shadow"
                style={{
                  fontSize: "18px",
                  minWidth: "260px",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                  border: "none",
                }}
                onClick={handleStartCall}
                disabled={!selectedCampaignId || callLeadMutation.isPending}
              >
                {callLeadMutation.isPending ? (
                  <span className="spinner-border spinner-border-sm" role="status" />
                ) : (
                  <PhoneCall size={24} />
                )}
                <span>Start Phone Call</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
