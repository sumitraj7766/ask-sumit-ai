interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;

  start(): void;
  stop(): void;

  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}
/* eslint-disable no-var */
declare var SpeechRecognition: {
  prototype: ISpeechRecognition;
  new (): ISpeechRecognition;
};

declare var webkitSpeechRecognition: {
  prototype: ISpeechRecognition;
  new (): ISpeechRecognition;
};

interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof webkitSpeechRecognition;
}