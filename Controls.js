import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Controls {
    constructor(wheelchair) {
        this.wheelchair = wheelchair;
        this.isListening = false;

        this.btn = document.getElementById("voice-control-btn");
        this.status = document.getElementById("voice-status");
        this.output = document.getElementById("command-output");
        this.languageSelect = document.getElementById("language-select");

        this.SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = null;

        this.synth = window.speechSynthesis;
        // NEW: Store specific voices for English, Hindi, and Telugu
        this.englishUSVoice = null;
        this.englishINVoice = null;
        this.hindiVoice = null;
        this.teluguVoice = null;

        this.currentLanguage = this.languageSelect ? this.languageSelect.value : 'en-US';

        this.commandMaps = {
            'en-US': {
                'stop': ['stop', 'halt', 'freeze', 'stop moving', 'stop the chair', 'cease', 'hold'],
                'go_continuous': ['go', 'move', 'start', 'begin', 'drive'],
                'forward_momentary': ['forward', 'move forward', 'go forward', 'drive forward', 'just forward', 'a bit forward', 'nudge forward', 'little forward', 'move a little forward'],
                'backward_momentary': ['backward', 'back', 'move backward', 'go backward', 'drive backward', 'just back', 'a bit back', 'nudge back', 'little back', 'move a little back'],
                'left_momentary': ['left', 'turn left', 'move left', 'go left', 'just left', 'a bit left', 'nudge left', 'little left', 'move a little left'],
                'right_momentary': ['right', 'turn right', 'move right', 'go right', 'just right', 'a bit right', 'nudge right', 'little right', 'move a little right'],
                // Speech responses (for the system to say aloud)
                'speech_stop': "Stopping.",
                'speech_go_continuous': "Going forward continuously.",
                'speech_forward': "Moving forward.",
                'speech_backward': "Moving backward.",
                'speech_left': "Turning left.",
                'speech_right': "Turning right.",
                'speech_no_command': "Command not recognized."
            },
            'en-IN': { // Indian English
                'stop': ['stop', 'ruk jao', 'roko', 'band karo'],
                'go_continuous': ['go', 'chalo', 'move', 'aage badho'],
                'forward_momentary': ['forward', 'aage', 'go forward', 'move forward', 'seedha jao'],
                'backward_momentary': ['backward', 'peechhe', 'go back', 'move back', 'peeche jao'],
                'left_momentary': ['left', 'baaye', 'turn left', 'left side'],
                'right_momentary': ['right', 'daaye', 'turn right', 'right side'],
                'speech_stop': "Stopping.",
                'speech_go_continuous': "Going forward continuously.",
                'speech_forward': "Moving forward.",
                'speech_backward': "Moving backward.",
                'speech_left': "Turning left.",
                'speech_right': "Turning right.",
                'speech_no_command': "Command not recognized."
            },
            'hi-IN': { // Hindi
                'stop': ['रुको', 'रुक जाओ', 'बंद करो', 'ठहर जाओ'],
                'go_continuous': ['जाओ', 'चलो', 'आगे चलो', 'बढ़ो'],
                'forward_momentary': ['आगे', 'आगे बढ़ो', 'आगे चलो', 'सीधा जाओ'],
                'backward_momentary': ['पीछे', 'पीछे जाओ', 'पीछे हट', 'पीछे हट जाओ'],
                'left_momentary': ['बाएं', 'बाएं मुड़ो', 'बाईं ओर'],
                'right_momentary': ['दाएं', 'दाएं मुड़ो', 'दाईं ओर'],
                'speech_stop': "रुक रही है।",
                'speech_go_continuous': "लगातार आगे बढ़ रही है।",
                'speech_forward': "आगे बढ़ रही है।",
                'speech_backward': "पीछे जा रही है।",
                'speech_left': "बाएं मुड़ रही है।",
                'speech_right': "दाएं मुड़ रही है।",
                'speech_no_command': "कमांड समझ नहीं आई।"
            },
            'bn-IN': { // Bengali
                'stop': ['থামুন', 'বন্ধ করুন', 'দাঁড়াও'],
                'go_continuous': ['যান', 'চলো', 'শুরু করুন'],
                'forward_momentary': ['সামনে', 'সামনে যান', 'এগিয়ে যান'],
                'backward_momentary': ['পিছনে', 'পিছনে যান', 'ফিরে যান'],
                'left_momentary': ['বামে', 'বামে ঘুরুন'],
                'right_momentary': ['ডানে', 'ডানে ঘুরুন'],
                'speech_stop': "থামছে।",
                'speech_go_continuous': "সামনে চলেছে।",
                'speech_forward': "সামনে চলছে।",
                'speech_backward': "পিছনে চলছে।",
                'speech_left': "বামে ঘুরছে।",
                'speech_right': "ডানে ঘুরছে।",
                'speech_no_command': "কমান্ড বোঝা যায়নি।"
            },
            'mr-IN': { // Marathi
                'stop': ['थांब', 'थांबा', 'बंद करा'],
                'go_continuous': ['जा', 'चला', 'सुरू करा'],
                'forward_momentary': ['पुढे', 'पुढे जा', 'पुढं जा'],
                'backward_momentary': ['मागे', 'मागे जा', 'मागं जा'],
                'left_momentary': ['डावीकडे', 'डावीकडे वळा'],
                'right_momentary': ['उजवीकडे', 'उजवीकडे वळा'],
                'speech_stop': "थांबत आहे.",
                'speech_go_continuous': "पुढे जात आहे.",
                'speech_forward': "पुढे जात आहे.",
                'speech_backward': "मागे जात आहे.",
                'speech_left': "डावीकडे वळत आहे.",
                'speech_right': "उजवीकडे वळत आहे.",
                'speech_no_command': "आदेश ओळखला नाही."
            },
            'te-IN': { // Telugu
                'stop': ['ఆపు', 'ఆపు చేయండి', 'ఆపండి', 'ఆగిపోండి'],
                'go_continuous': ['వెళ్ళండి', 'కదలండి', 'ప్రారంభించండి', 'పోండి'],
                'forward_momentary': ['ముందుకు', 'ముందుకు వెళ్ళండి', 'ముందుకు కదలండి', 'నేరుగా వెళ్ళండి'],
                'backward_momentary': ['వెనక్కి', 'వెనక్కి వెళ్ళండి', 'వెనక్కి కదలండి'],
                'left_momentary': ['ఎడమకు', 'ఎడమకు తిరగండి', 'ఎడమ వైపు'],
                'right_momentary': ['కుడికి', 'కుడికి తిరగండి', 'కుడి వైపు'],
                'speech_stop': "ఆగుతోంది.",
                'speech_go_continuous': "ముందుకు వెళ్తోంది.",
                'speech_forward': "ముందుకు వెళ్తోంది.",
                'speech_backward': "వెనక్కి వెళ్తోంది.",
                'speech_left': "ఎడమకు తిరుగుతోంది.",
                'speech_right': "కుడికి తిరుగుతోంది.",
                'speech_no_command': "కమాండ్ అర్థం కాలేదు."
            },
            'ta-IN': { // Tamil
                'stop': ['நிறுத்து', 'நிறுத்துங்கள்', 'நில்'],
                'go_continuous': ['செல்லுங்கள்', 'போ', 'தொடங்கு'],
                'forward_momentary': ['முன்னால்', 'முன்னால் செல்லுங்கள்', 'நேராக செல்லுங்கள்'],
                'backward_momentary': ['பின்னால்', 'பின்னால் செல்லுங்கள்', 'பின்புறம் செல்லுங்கள்'],
                'left_momentary': ['இடது', 'இடதுபுறம் திரும்பு', 'இடது பக்கம்'],
                'right_momentary': ['வலது', 'வலதுபுறம் திரும்பு', 'வலது பக்கம்'],
                'speech_stop': "நிறுத்தப்படுகிறது.",
                'speech_go_continuous': "முன்னால் செல்கிறது.",
                'speech_forward': "முன்னால் நகர்கிறது.",
                'speech_backward': "பின்னால் நகர்கிறது.",
                'speech_left': "இடதுபுறம் திரும்புகிறது.",
                'speech_right': "வலதுபுறம் திரும்புகிறது.",
                'speech_no_command': "கட்டளை புரியவில்லை."
            }
        };

        this.momentaryDurationForwardBack = 0.8;
        this.momentaryDurationTurn = 0.4;

        this.lastMomentaryActionTime = 0;
        this.activeMomentaryActionKey = null;

        this.initKeyboard();
        this.SpeechRec ? this.initVoice() : (this.status.textContent = "Voice unsupported");
    }

    /* ---------- Keyboard ---------- */
    initKeyboard() {
        const change = (e, v) => {
            const k = e.key.toLowerCase();

            if (["arrowup", "w"].includes(k)) this.wheelchair.setMoveState("f", v);
            if (["arrowdown", "s"].includes(k)) this.wheelchair.setMoveState("b", v);
            if (["arrowleft", "a"].includes(k)) this.wheelchair.setMoveState("l", v);
            if (["arrowright", "d"].includes(k)) this.wheelchair.setMoveState("r", v);

            if (k.startsWith("arrow")) e.preventDefault();
        };
        document.addEventListener("keydown", (e) => change(e, true));
        document.addEventListener("keyup", (e) => change(e, false));
    }


    /* ---------- Voice ---------- */
    initVoice() {
        if (!this.synth) {
            this.status.textContent = "Speech Synthesis unsupported";
            console.warn("Web Speech Synthesis API not supported in this browser.");
        } else {
            // Load all necessary voices when voices are changed or available
            this.synth.onvoiceschanged = () => {
                this.loadAllTargetVoices();
            };
            if (this.synth.getVoices().length > 0) {
                this.loadAllTargetVoices();
            }
        }

        this.recognition = new this.SpeechRec();
        this.recognition.continuous = true;
        this.recognition.lang = this.currentLanguage;
        this.recognition.interimResults = false;

        this.recognition.onstart = () => {
            this.isListening = true;
            this.status.textContent = `Status: Listening in ${this.currentLanguageDisplayName(this.currentLanguage)}…`;
            this.btn.textContent = "Stop Voice Control";
            this.btn.classList.add('listening');
            // Initial speak for activation, potentially in multiple languages
            this.speakMultiLang("Voice control activated. I am listening.", "नियंत्रण सक्रिय है। मैं सुन रहा हूँ।", "వాయిస్ నియంత్రణ సక్రియం చేయబడింది. నేను వింటున్నాను.");
        };
        this.recognition.onend = () => {
            this.isListening = false;
            this.status.textContent = "Status: Idle. Click to start.";
            this.btn.textContent = "Start Voice Control";
            this.btn.classList.remove('listening');
            this.speakMultiLang("Voice control deactivated.", "नियंत्रण నిష్క్రియ ఉంది.", "వాయిస్ నియంత్రణ నిష్క్రియం చేయబడింది.");
        };
        this.recognition.onerror = (e) => {
            this.status.textContent = `Error: ${e.error}. Try again.`;
            console.error("Speech Recognition Error:", e);
            this.speakMultiLang(`Error: ${e.error}. Please try again.`);
        };
        this.recognition.onresult = (e) => {
            const lastResultIndex = e.results.length - 1;
            const commandText = e.results[lastResultIndex][0].transcript.trim().toLowerCase();
            this.output.textContent = `Heard: "${commandText}"`;
            this.processCommand(commandText);
        };

        this.btn.addEventListener("click", () => {
            if (this.isListening) {
                this.recognition.stop();
            } else {
                this.recognition.lang = this.currentLanguage;
                this.recognition.start();
            }
        });

        if (this.languageSelect) {
            this.languageSelect.addEventListener('change', (event) => {
                this.currentLanguage = event.target.value;
                // No need to reload specific voices here as they are loaded once
                // but if recognition is active, we restart it for new input language
                if (this.isListening) {
                    this.recognition.stop();
                    setTimeout(() => {
                        this.recognition.lang = this.currentLanguage;
                        this.recognition.start();
                    }, 100);
                } else {
                    this.status.textContent = `Status: Idle. Language set to ${this.currentLanguageDisplayName(this.currentLanguage)}. Click to start.`;
                }
                this.speakMultiLang(`Language set to ${this.currentLanguageDisplayName(this.currentLanguage)}.`, `भाषा ${this.currentLanguageDisplayName(this.currentLanguage)} पर सेट है।`, `భాష ${this.currentLanguageDisplayName(this.currentLanguage)} కు సెట్ చేయబడింది.`);
            });
        }

        this.updateMomentaryActions();
    }

    currentLanguageDisplayName(langCode) {
        const displayNames = {
            'en-US': 'English (US)',
            'en-IN': 'English (India)',
            'hi-IN': 'Hindi',
            'bn-IN': 'Bengali',
            'mr-IN': 'Marathi',
            'te-IN': 'Telugu',
            'ta-IN': 'Tamil',
            'kn-IN': 'Kannada',
            'gu-IN': 'Gujarati',
            'ml-IN': 'Malayalam',
            'pa-IN': 'Punjabi'
        };
        return displayNames[langCode] || langCode;
    }

    /**
     * Loads specific English, Hindi, and Telugu voices if available.
     * These will be used for multi-language confirmation.
     */
    loadAllTargetVoices() {
        if (!this.synth) return;

        const voices = this.synth.getVoices();

        this.englishUSVoice = voices.find(voice => voice.lang === 'en-US' && voice.name.includes('Google')) || voices.find(voice => voice.lang === 'en-US');
        this.englishINVoice = voices.find(voice => voice.lang === 'en-IN' && voice.name.includes('Google')) || voices.find(voice => voice.lang === 'en-IN');
        this.hindiVoice = voices.find(voice => voice.lang === 'hi-IN' && voice.name.includes('Google')) || voices.find(voice => voice.lang === 'hi-IN');
        this.teluguVoice = voices.find(voice => voice.lang === 'te-IN' && voice.name.includes('Google')) || voices.find(voice => voice.lang === 'te-IN');

        // Optional: Log which voices were found for debugging
        console.log("Loaded Voices:");
        console.log("English (US):", this.englishUSVoice ? this.englishUSVoice.name : "Not found");
        console.log("English (IN):", this.englishINVoice ? this.englishINVoice.name : "Not found");
        console.log("Hindi (IN):", this.hindiVoice ? this.hindiVoice.name : "Not found");
        console.log("Telugu (IN):", this.teluguVoice ? this.teluguVoice.name : "Not found");
    }


    /**
     * Speaks the given text in English (US/IN), Hindi, and Telugu sequentially.
     * @param {string} enText English text to speak (US or IN).
     * @param {string} hiText Hindi text to speak.
     * @param {string} teText Telugu text to speak.
     */
    speakMultiLang(enText, hiText = null, teText = null) {
        if (!this.synth) {
            console.warn("Speech Synthesis not ready.");
            return;
        }

        // Cancel any ongoing speech before starting new ones
        if (this.synth.speaking) {
            this.synth.cancel();
        }

        const utterances = [];

        // 1. English (Prioritize IN, then US)
        let primaryEnglishVoice = this.englishINVoice || this.englishUSVoice;
        if (primaryEnglishVoice && enText) {
            const utt = new SpeechSynthesisUtterance(enText);
            utt.voice = primaryEnglishVoice;
            utt.lang = primaryEnglishVoice.lang;
            utterances.push(utt);
        } else if (enText) {
            console.warn("No English voice found for multi-language output.");
        }

        // 2. Hindi
        if (this.hindiVoice && hiText) {
            const utt = new SpeechSynthesisUtterance(hiText);
            utt.voice = this.hindiVoice;
            utt.lang = this.hindiVoice.lang;
            utterances.push(utt);
        } else if (hiText) {
            console.warn("No Hindi voice found for multi-language output.");
        }

        // 3. Telugu
        if (this.teluguVoice && teText) {
            const utt = new SpeechSynthesisUtterance(teText);
            utt.voice = this.teluguVoice;
            utt.lang = this.teluguVoice.lang;
            utterances.push(utt);
        } else if (teText) {
            console.warn("No Telugu voice found for multi-language output.");
        }

        // Speak the utterances sequentially
        // This simple loop will speak them one after another
        const speakNext = (index) => {
            if (index < utterances.length) {
                const currentUtterance = utterances[index];
                currentUtterance.onend = () => speakNext(index + 1); // Speak next when current is done
                this.synth.speak(currentUtterance);
            }
        };

        if (utterances.length > 0) {
            speakNext(0); // Start the sequence
        }
    }


    /**
     * Processes the recognized voice command to determine the wheelchair action.
     * @param {string} commandText The recognized speech transcript.
     */
    processCommand(commandText) {
        const w = this.wheelchair;
        let commandExecuted = false;

        // NEW: Text for multi-language output
        let enResponse = "";
        let hiResponse = "";
        let teResponse = "";

        const currentCommandMap = this.commandMaps[this.currentLanguage] || this.commandMaps['en-US'];

        const resetVoiceMovement = () => {
            Object.keys(w.move).forEach((k) => (w.move[k] = false));
            w.speed = 0;
        };

        // --- Priority Order for Voice Commands ---

        // 1. Explicit STOP command
        for (const keyword of currentCommandMap['stop']) {
            if (commandText.includes(keyword)) {
                resetVoiceMovement();
                this.clearMomentaryAction();
                enResponse = "Stopping.";
                hiResponse = "रुक रही है।";
                teResponse = "ఆగుతోంది.";
                this.output.textContent += ` -> Executing: STOP`;
                commandExecuted = true;
                this.speakMultiLang(enResponse, hiResponse, teResponse); // Multi-language speak
                return;
            }
        }

        // 2. Continuous FORWARD command
        for (const keyword of currentCommandMap['go_continuous']) {
            if (commandText.includes(keyword)) {
                resetVoiceMovement();
                this.clearMomentaryAction();
                w.setMoveState('f', 1);
                enResponse = "Going forward continuously.";
                hiResponse = "लगातार आगे बढ़ रही है।";
                teResponse = "ముందుకు వెళ్తోంది.";
                this.output.textContent += ` -> Executing: GO CONTINUOUS`;
                commandExecuted = true;
                this.speakMultiLang(enResponse, hiResponse, teResponse); // Multi-language speak
                return;
            }
        }

        // 3. Momentary commands
        const momentaryDirectionalCommands = [
            'forward_momentary', 'backward_momentary',
            'left_momentary', 'right_momentary'
        ];

        for (const actionType of momentaryDirectionalCommands) {
            for (const keyword of currentCommandMap[actionType]) {
                if (commandText.includes(keyword)) {
                    resetVoiceMovement();

                    const baseDirection = actionType.split('_')[0];
                    const moveStateKey = {
                        'forward': 'f',
                        'backward': 'b',
                        'left': 'l',
                        'right': 'r'
                    }[baseDirection];

                    this.lastMomentaryActionTime = performance.now() / 1000;
                    this.activeMomentaryActionKey = moveStateKey;

                    const durationToApply = (baseDirection === 'forward' || baseDirection === 'backward') ?
                        this.momentaryDurationForwardBack : this.momentaryDurationTurn;

                    if (this.activeMomentaryActionKey) {
                        w.setMoveState(this.activeMomentaryActionKey, 1);
                        if (this.activeMomentaryActionKey === 'f') w.speed = w.max;
                        else if (this.activeMomentaryActionKey === 'b') w.speed = -w.max / 2;
                        else w.speed = 0;
                    }

                    // Set dynamic speech response for all target languages
                    switch (baseDirection) {
                        case 'forward':
                            enResponse = "Moving forward.";
                            hiResponse = "आगे बढ़ रही है।";
                            teResponse = "ముందుకు వెళ్తోంది.";
                            break;
                        case 'backward':
                            enResponse = "Moving backward.";
                            hiResponse = "पीछे जा रही है।";
                            teResponse = "వెనక్కి వెళ్తోంది.";
                            break;
                        case 'left':
                            enResponse = "Turning left.";
                            hiResponse = "बाएं मुड़ रही है।";
                            teResponse = "ఎడమకు తిరుగుతోంది.";
                            break;
                        case 'right':
                            enResponse = "Turning right.";
                            hiResponse = "दाएं मुड़ रही है।";
                            teResponse = "కుడికి తిరుగుతోంది.";
                            break;
                        default:
                            enResponse = "Command executed.";
                            hiResponse = "कमांड निष्पादित की गई।";
                            teResponse = "కమాండ్ అమలు చేయబడింది.";
                    }

                    this.output.textContent += ` -> Executing: ${actionType.toUpperCase()}`;
                    commandExecuted = true;
                    this.speakMultiLang(enResponse, hiResponse, teResponse); // Multi-language speak
                    return;
                }
            }
        }

        if (!commandExecuted) {
            enResponse = "Command not recognized.";
            hiResponse = "कमांड समझ नहीं आई।";
            teResponse = "కమాండ్ అర్థం కాలేదు.";
            this.output.textContent += ` -> No command recognized.`;
            this.speakMultiLang(enResponse, hiResponse, teResponse); // Multi-language speak
        }
    }

    clearMomentaryAction() {
        if (this.activeMomentaryActionKey) {
            const w = this.wheelchair;
            w.setMoveState(this.activeMomentaryActionKey, 0);
            w.speed = 0;
            this.activeMomentaryActionKey = null;
            this.lastMomentaryActionTime = 0;
        }
    }

    updateMomentaryActions = () => {
        if (this.activeMomentaryActionKey) {
            const currentTime = performance.now() / 1000;
            let effectiveDuration = 0;

            if (this.activeMomentaryActionKey === 'f' || this.activeMomentaryActionKey === 'b') {
                effectiveDuration = this.momentaryDurationForwardBack;
            } else if (this.activeMomentaryActionKey === 'l' || this.activeMomentaryActionKey === 'r') {
                effectiveDuration = this.momentaryDurationTurn;
            }

            if (currentTime - this.lastMomentaryActionTime >= effectiveDuration) {
                this.clearMomentaryAction();
                // Optional: You can add an audible "Action complete." in multiple languages here
                // this.speakMultiLang("Action complete.");
            }
        }
        requestAnimationFrame(this.updateMomentaryActions);
    }
}