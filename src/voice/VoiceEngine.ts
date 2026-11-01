
import { NexoraEventBus } from '../core/eventbus/NexoraEventBus';
import { TaskStateManager } from '../core/state/TaskStateManager';
import { TaskState } from '../types';

type VoiceState = {
  isListening: boolean;
  transcript: string;
  feedback: string;
};

type VoiceListener = (state: VoiceState) => void;

export class VoiceEngine {
  private recognition: any = null;

  private isListening = false;
  private isStarting = false;
  private isDestroyed = false;

  private selectedLanguage: 'bn-IN' | 'en-US' = 'bn-IN';

  private synthesisVoice: SpeechSynthesisVoice | null = null;

  private listeners: Set<VoiceListener> = new Set();

  private currentTranscript = '';
  private lastFeedback = '';

  private audioCtx: AudioContext | null = null;

  private eventBusUnsubscribe: (() => void) | null = null;

  private voicesChangedHandler: (() => void) | null = null;

  constructor(private taskStateManager: TaskStateManager) {
    this.initTts();
    this.initStt();
    this.observeEvents();
  }

  // -----------------------------------------
  // INITIAL STATE
  // -----------------------------------------

  private getState(): VoiceState {
    return {
      isListening: this.isListening,
      transcript: this.currentTranscript,
      feedback: this.lastFeedback,
    };
  }

  private notify(): void {
    const state = this.getState();

    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        console.error('Voice listener error:', error);
      }
    });
  }

  private setFeedback(message: string): void {
    this.lastFeedback = message;
    this.notify();
  }

  // -----------------------------------------
  // TEXT TO SPEECH INITIALIZATION
  // -----------------------------------------

  private initTts(): void {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      return;
    }

    const updateVoices = () => {
      if (this.isDestroyed) return;

      const voices = window.speechSynthesis.getVoices();

      const bnVoice = voices.find(
        (voice) => voice.lang.toLowerCase().startsWith('bn')
      );

      const enVoice = voices.find(
        (voice) =>
          voice.lang.toLowerCase().includes('en-in') ||
          voice.lang.toLowerCase().includes('en-us')
      );

      this.synthesisVoice =
        this.selectedLanguage === 'bn-IN'
          ? bnVoice || enVoice || voices[0] || null
          : enVoice || bnVoice || voices[0] || null;
    };

    this.voicesChangedHandler = updateVoices;

    updateVoices();

    window.speechSynthesis.addEventListener(
      'voiceschanged',
      updateVoices
    );
  }

  // -----------------------------------------
  // SPEECH RECOGNITION INITIALIZATION
  // -----------------------------------------

  private initStt(): void {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.setFeedback(
        'এই Browser Speech Recognition support করে না।'
      );
      return;
    }

    try {
      this.recognition = new SpeechRecognition();

      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = this.selectedLanguage;

      // Recognition successfully started
      this.recognition.onstart = () => {
        if (this.isDestroyed) return;

        this.isStarting = false;
        this.isListening = true;

        this.notify();
      };

      // Recognition result received
      this.recognition.onresult = (event: any) => {
        if (this.isDestroyed) return;

        let transcript = '';
        let finalTranscript = '';

        for (
          let i = event.resultIndex;
          i < event.results.length;
          i++
        ) {
          const result = event.results[i];

          if (!result || !result[0]) continue;

          const text = result[0].transcript || '';

          transcript += text;

          if (result.isFinal) {
            finalTranscript += text;
          }
        }

        this.currentTranscript = transcript.trim();

        this.notify();

        if (finalTranscript.trim()) {
          this.handleSpokenTranscript(
            finalTranscript.trim()
          );
        }
      };

      // Recognition error
      this.recognition.onerror = (event: any) => {
        if (this.isDestroyed) return;

        this.isStarting = false;
        this.isListening = false;

        const error = event?.error || 'unknown';

        console.warn(
          'Speech Recognition Error:',
          error
        );

        switch (error) {
          case 'not-allowed':
          case 'service-not-allowed':
            this.lastFeedback =
              'Microphone permission allow করুন।';
            break;

          case 'no-speech':
            this.lastFeedback =
              'কোনো কথা শোনা যায়নি। আবার চেষ্টা করুন।';
            break;

          case 'audio-capture':
            this.lastFeedback =
              'Microphone পাওয়া যাচ্ছে না।';
            break;

          case 'network':
            this.lastFeedback =
              'Network সমস্যা হয়েছে। Internet পরীক্ষা করুন।';
            break;

          case 'aborted':
            this.lastFeedback =
              'Voice recognition বন্ধ করা হয়েছে।';
            break;

          default:
            this.lastFeedback =
              'Voice recognition-এ সমস্যা হয়েছে।';
        }

        this.notify();
      };

      // Recognition stopped
      this.recognition.onend = () => {
        if (this.isDestroyed) return;

        this.isStarting = false;
        this.isListening = false;

        this.notify();
      };

    } catch (error) {
      console.error(
        'Speech Recognition initialization failed:',
        error
      );

      this.recognition = null;

      this.setFeedback(
        'Voice Engine initialize করা যায়নি।'
      );
    }
  }

  // -----------------------------------------
  // AUDIO CHIME
  // -----------------------------------------

  private playChime(freq: number = 880): void {
    if (
      typeof window === 'undefined' ||
      this.isDestroyed
    ) {
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as any).webkitAudioContext;

      if (!AudioCtx) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }

      if (this.audioCtx.state === 'closed') {
        return;
      }

      if (this.audioCtx.state === 'suspended') {
        void this.audioCtx.resume().catch(() => {});
      }

      const oscillator =
        this.audioCtx.createOscillator();

      const gain = this.audioCtx.createGain();

      oscillator.type = 'sine';

      oscillator.frequency.setValueAtTime(
        freq,
        this.audioCtx.currentTime
      );

      gain.gain.setValueAtTime(
        0.08,
        this.audioCtx.currentTime
      );

      gain.gain.exponentialRampToValueAtTime(
        0.001,
        this.audioCtx.currentTime + 0.25
      );

      oscillator.connect(gain);
      gain.connect(this.audioCtx.destination);

      oscillator.start();

      oscillator.stop(
        this.audioCtx.currentTime + 0.25
      );

    } catch (error) {
      console.warn('Audio chime error:', error);
    }
  }

  // -----------------------------------------
  // EVENT BUS SUBSCRIPTION
  // -----------------------------------------

  private observeEvents(): void {
    // Save unsubscribe callback for cleanup.
    this.eventBusUnsubscribe = NexoraEventBus.subscribe(
      (event) => {
        if (this.isDestroyed) return;

        if (event.type === 'SpeakFeedback') {
          this.lastFeedback = event.text;

          this.speak(event.text);

          this.notify();

        } else if (event.type === 'StopRequested') {
          this.stopAll();
        }
      }
    );
  }

  // -----------------------------------------
  // LANGUAGE SETTINGS
  // -----------------------------------------

  setLanguage(lang: 'bn-IN' | 'en-US'): void {
    if (this.isDestroyed) return;

    this.selectedLanguage = lang;

    if (this.recognition) {
      this.recognition.lang = lang;
    }

    if (typeof window !== 'undefined') {
      const voices = window.speechSynthesis?.getVoices() || [];

      const matchingVoice = voices.find((voice) =>
        lang === 'bn-IN'
          ? voice.lang.toLowerCase().startsWith('bn')
          : voice.lang.toLowerCase().includes('en')
      );

      this.synthesisVoice = matchingVoice || null;
    }

    this.notify();
  }

  getLanguage(): 'bn-IN' | 'en-US' {
    return this.selectedLanguage;
  }

  // -----------------------------------------
  // START LISTENING
  // -----------------------------------------

  startListening(): void {
    if (this.isDestroyed) return;

    if (!this.recognition) {
      this.setFeedback(
        'এই Browser-এ Speech Recognition available নয়।'
      );
      return;
    }

    if (this.isListening || this.isStarting) {
      return;
    }

    this.currentTranscript = '';
    this.lastFeedback = '';

    this.isStarting = true;

    this.taskStateManager.transitionTo(
      TaskState.LISTENING
    );

    this.playChime(950);

    this.notify();

    try {
      this.recognition.lang = this.selectedLanguage;

      this.recognition.start();

    } catch (error: any) {
      this.isStarting = false;
      this.isListening = false;

      console.warn(
        'Recognition start failed:',
        error
      );

      this.lastFeedback =
        'Microphone চালু করা যায়নি। আবার চেষ্টা করুন।';

      this.notify();
    }
  }

  // -----------------------------------------
  // STOP LISTENING
  // -----------------------------------------

  stopListening(): void {
    if (this.isDestroyed) return;

    const wasActive =
      this.isListening || this.isStarting;

    this.isStarting = false;
    this.isListening = false;

    if (this.recognition && wasActive) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.warn(
          'Recognition stop warning:',
          error
        );
      }
    }

    if (wasActive) {
      this.playChime(440);
    }

    this.notify();
  }

  // -----------------------------------------
  // HANDLE SPOKEN COMMAND
  // -----------------------------------------

  handleSpokenTranscript(transcript: string): void {
    if (this.isDestroyed) return;

    const cleanTranscript = transcript.trim();

    if (!cleanTranscript) return;

    this.isStarting = false;
    this.isListening = false;

    this.currentTranscript = cleanTranscript;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Recognition may already have stopped.
      }
    }

    this.taskStateManager.transitionTo(
      TaskState.UNDERSTANDING
    );

    NexoraEventBus.emit({
      type: 'UserSpokenInput',
      transcript: cleanTranscript,
    });

    this.notify();
  }

  // -----------------------------------------
  // TEXT TO SPEECH
  // -----------------------------------------

  speak(text: string): void {
    if (
      this.isDestroyed ||
      typeof window === 'undefined' ||
      !('speechSynthesis' in window)
    ) {
      return;
    }

    const message = text.trim();

    if (!message) return;

    try {
      window.speechSynthesis.cancel();

      const utterance =
        new SpeechSynthesisUtterance(message);

      if (this.synthesisVoice) {
        utterance.voice = this.synthesisVoice;
      }

      utterance.lang = this.selectedLanguage;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onerror = (event) => {
        console.warn(
          'Speech synthesis error:',
          event.error
        );
      };

      window.speechSynthesis.speak(utterance);

    } catch (error) {
      console.error(
        'Text to Speech error:',
        error
      );
    }
  }

  // -----------------------------------------
  // STOP ALL VOICE OPERATIONS
  // -----------------------------------------

  stopAll(): void {
    if (this.isDestroyed) return;

    this.stopListening();

    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window
    ) {
      window.speechSynthesis.cancel();
    }
  }

  // -----------------------------------------
  // SUBSCRIBE TO VOICE STATE
  // -----------------------------------------

  subscribe(fn: VoiceListener): () => void {
    if (this.isDestroyed) {
      return () => {};
    }

    this.listeners.add(fn);

    fn(this.getState());

    return () => {
      this.listeners.delete(fn);
    };
  }

  // -----------------------------------------
  // COMPLETE CLEANUP
  // -----------------------------------------

  destroy(): void {
    if (this.isDestroyed) return;

    this.isDestroyed = true;

    // Remove EventBus subscription
    if (this.eventBusUnsubscribe) {
      this.eventBusUnsubscribe();
      this.eventBusUnsubscribe = null;
    }

    // Stop Speech Recognition
    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;

        this.recognition.abort();

      } catch (error) {
        console.warn(
          'Recognition cleanup warning:',
          error
        );
      }

      this.recognition = null;
    }

    // Stop Text to Speech
    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window
    ) {
      window.speechSynthesis.cancel();

      if (this.voicesChangedHandler) {
        window.speechSynthesis.removeEventListener(
          'voiceschanged',
          this.voicesChangedHandler
        );

        this.voicesChangedHandler = null;
      }
    }

    // Close Audio Context
    if (this.audioCtx) {
      if (this.audioCtx.state !== 'closed') {
        void this.audioCtx.close().catch(() => {});
      }

      this.audioCtx = null;
    }

    // Clear subscribers
    this.listeners.clear();

    this.isListening = false;
    this.isStarting = false;
  }
}
