document.addEventListener('DOMContentLoaded', () => {
    console.log("🔵 2단계 main.js가 시작되었습니다! ('레벨별 발음연습' 기능 추가) 🔵");

    // --- 모든 HTML 요소들을 elements 라는 큰 상자에 담아두기 ---
    const elements = {
        wordDisplay: document.getElementById('word-to-practice'),
        listenButton: document.getElementById('listen-button'),
        recordButton: document.getElementById('record-button'),
        feedbackArea: document.getElementById('my-feedback'),
        loadingMessage: document.getElementById('loading-message'),
        wordTimerDisplay: document.getElementById('timer-display'),
        overallTimerDisplay: document.getElementById('overall-timer-display'),
        scoreBoard: document.getElementById('score-board'),
        modeSelectionArea: document.getElementById('mode-selection-area'),
        levelSelectionArea: document.getElementById('level-selection-area'),
        gamePlayArea: document.getElementById('game-play-area'),
        endGameArea: document.getElementById('end-game-area'),
        leaderboardArea: document.getElementById('leaderboard-area'),
        saveScoreArea: document.getElementById('save-score-area'),
        startLevelPracticeButton: document.getElementById('start-level-practice-btn'),
        startScoreAttackButton: document.getElementById('start-score-attack-btn'),
        showRankingButton: document.getElementById('show-ranking-btn'),
        startLevel1Button: document.getElementById('start-level-1-btn'),
        startLevel2Button: document.getElementById('start-level-2-btn'),
        startLevel3Button: document.getElementById('start-level-3-btn'),
        backToModeButton: document.getElementById('back-to-mode-btn'),
        backToModeFromRankingButton: document.getElementById('back-to-mode-from-ranking-btn'),
        restartGameButton: document.getElementById('restart-game-btn'),
        changeModeButton: document.getElementById('change-mode-btn'),
        finalMessage: document.getElementById('final-message'),
        finalScoreDisplay: document.getElementById('final-score-display'),
        shareResultButton: document.getElementById('share-result-btn'),
        nicknameInput: document.getElementById('nickname-input'),
        saveScoreButton: document.getElementById('save-score-btn'),
        rankingList: document.getElementById('ranking-list')
    };

    // --- 게임 기본 재료들 ---
    const wordLevels = {
        level1: ["안녕하세요", "감사합니다", "이거 얼마예요?", "화장실 어디예요?", "닭갈비", "진짜 예쁘다", "다시 한번 말해주세요."],
        level2: ["민주주의의 의의", "책을 읊조리다", "흙을 밟다", "고려고 교복은 고급 교복이다.", "백화점 세일 마지막 날이라서 사람이 많아요.", "앞 집 팥죽은 붉은 팥 풋팥죽이다.", "저는 대한민국 서울특별시에 살고 있습니다."],
        level3: ["간장 공장 공장장은 강 공장장이고 된장 공장 공장장은 공 공장장이다.", "경찰청 철창살은 외철창살이냐 쌍철창살이냐.", "내가 그린 기린 그림은 잘 그린 기린 그림이다.", "한영양장점 옆 한양양장점.", "서울특별시 특허허가과 허가과장 허과장.", "저기 저 뜀틀이 내가 뛸 뜀틀인가 내가 안 뛸 뜀틀인가.", "챠프포프킨과 치스챠코프는 라흐마니노프의 피아노 콘체르토를 연주했다."]
    };
    const MODE_LEVEL_PRACTICE = 'LEVEL_PRACTICE';
    const MODE_SCORE_ATTACK = 'SCORE_ATTACK';
    let currentGameMode = null; let currentWordList = [];
    let currentWordToPractice = ""; let currentWordIndex = 0; let wordsPassedCount = 0; let gameIsActive = false;
    let mediaRecorderTool; let recordedAudioChunks = []; let isCurrentlyRecording = false; let currentAudioStream = null;
    const WORD_TIMER_SECONDS = 15; let wordTimeLeftInSeconds = WORD_TIMER_SECONDS; let wordTimerInterval;
    let voices = []; // 소리 듣기용 목소리 목록

    // --- 우리가 사용할 모든 마법 주문(함수)들을 미리 다 가르쳐주기! ---
    function showScreen(screenToShow) {
        Object.values(elements).forEach(el => {
            if (el && el.id && el.id.includes('-area')) {
                el.style.display = 'none';
            }
        });
        if (elements[screenToShow + 'Area']) {
            elements[screenToShow + 'Area'].style.display = 'block';
        }
    }

    function updateScoreBoard() {
        if(!elements.scoreBoard) return;
        if (currentGameMode === MODE_LEVEL_PRACTICE) {
            elements.scoreBoard.textContent = `통과: ${wordsPassedCount}개 / 총 ${currentWordList.length}개`;
        } else { // 다른 모드들은 나중에 추가!
            elements.scoreBoard.textContent = '점수';
        }
    }

    function stopWordTimer() { clearInterval(wordTimerInterval); }
    function resetWordTimerDisplay(){ if (elements.wordTimerDisplay) { elements.wordTimerDisplay.textContent = `단어 시간: ${WORD_TIMER_SECONDS}초`; elements.wordTimerDisplay.style.color = '#c0392b'; } }
    function resetWordTimer() { wordTimeLeftInSeconds = WORD_TIMER_SECONDS; resetWordTimerDisplay(); }
    function startWordTimer() {
        if (currentGameMode !== MODE_LEVEL_PRACTICE || !gameIsActive) return;
        stopWordTimer(); 
        wordTimerInterval = setInterval(() => {
            if (!gameIsActive) { stopWordTimer(); return; }
            wordTimeLeftInSeconds--;
            if (elements.wordTimerDisplay) elements.wordTimerDisplay.textContent = `단어 시간: ${wordTimeLeftInSeconds}초`;
            if (wordTimeLeftInSeconds <= 0) {
                // 이 함수는 아직 안 만들었지만, '단어 실패'와 같음
                handleWordFailure(); 
            } else if (wordTimeLeftInSeconds <= 5) {
                if(elements.wordTimerDisplay) elements.wordTimerDisplay.style.color = 'orange';
            }
        }, 1000);
    }
    
    function presentNextWord() {
        if (!gameIsActive) return;
        // '얼마나 많이' 모드에서는 모든 단어를 통과하면 게임 클리어!
        if (currentWordIndex >= currentWordList.length) {
            handleGameEnd(); 
            return;
        }
        currentWordToPractice = currentWordList[currentWordIndex];
        if (elements.wordDisplay) elements.wordDisplay.textContent = currentWordToPractice;
        if (elements.feedbackArea) elements.feedbackArea.innerHTML = "<p>발음해보세요!</p>";
        if (elements.recordButton) {
            elements.recordButton.textContent = '🔴 녹음 시작';
            elements.recordButton.disabled = false; 
            elements.recordButton.classList.remove('recording');
        }
        isCurrentlyRecording = false; 
        if (currentGameMode === MODE_LEVEL_PRACTICE) {
            stopWordTimer(); 
            resetWordTimer(); 
            startWordTimer(); 
        }
    }
    
    function handleWordSuccess() {
        stopWordTimer(); // 성공했으니 단어 타이머 멈춤!
        wordsPassedCount++;
        updateScoreBoard();
        currentWordIndex++;
        if(elements.feedbackArea) elements.feedbackArea.innerHTML = `<p style="color: green; font-weight: bold;">성공! 🎉 다음 문제로 넘어갑니다!</p>`;
        if(elements.wordTimerDisplay) elements.wordTimerDisplay.style.color = 'green';
        if(elements.recordButton) elements.recordButton.disabled = true; // 잠시 버튼 비활성화
        setTimeout(() => { if (gameIsActive) presentNextWord(); }, 1500); // 1.5초 후 다음 단어
    }

    function handleWordFailure() {
        if (!gameIsActive) return;
        stopWordTimer();
        if(elements.feedbackArea) elements.feedbackArea.innerHTML = `<p style="color: red; font-weight: bold;">실패! ⏰</p>`;
        handleGameEnd(); // 레벨 모드에서는 한번 실패하면 바로 게임 끝!
    }

    function handleGameEnd() {
        gameIsActive = false;
        stopAllTimers();
        if(elements.listenButton) elements.listenButton.disabled = true;
        if(elements.recordButton) elements.recordButton.disabled = true;
        
        const isClear = wordsPassedCount === currentWordList.length;
        if(elements.finalMessage) elements.finalMessage.textContent = isClear ? "🎉 레벨 클리어! 🎉" : "GAME OVER! 😭";
        if(elements.finalScoreDisplay) elements.finalScoreDisplay.textContent = `총 ${wordsPassedCount}개의 단어를 통과했어요!`;
        
        // 아직 랭킹 기능이 없으니, 점수 저장 화면은 숨겨요.
        if(elements.saveScoreArea) elements.saveScoreArea.style.display = 'none';
        if(elements.shareResultButton) elements.shareResultButton.style.display = 'inline-block';
        if(elements.restartGameButton) elements.restartGameButton.style.display = 'inline-block';
        if(elements.changeModeButton) elements.changeModeButton.style.display = 'inline-block';
        
        showScreen('endGame');
    }

    function startGame(mode) {
        currentGameMode = mode;
        gameIsActive = true;
        wordsPassedCount = 0;
        currentWordIndex = 0;
        updateScoreBoard();

        if (elements.wordTimerDisplay && currentGameMode === MODE_LEVEL_PRACTICE) {
            elements.wordTimerDisplay.style.display = 'block';
        }

        showScreen('gamePlay');
        if (elements.listenButton) elements.listenButton.disabled = false;
        if (elements.recordButton) elements.recordButton.disabled = false;
        isCurrentlyRecording = false;
        if(elements.loadingMessage) elements.loadingMessage.style.display = 'none';
        presentNextWord();
    }
    
    function initializeGame() {
        gameIsActive = false;
        stopAllTimers();
        currentWordList = [];
        updateScoreBoard();
        if(elements.wordDisplay) elements.wordDisplay.textContent = "게임 모드를 선택해주세요!";
        if(elements.feedbackArea) elements.feedbackArea.innerHTML = "<p>어떤 모드로 도전할까요?</p>";
        showScreen('modeSelection');
    }

    async function sendVoiceToRobotForGrading(voiceAudioBlob) {
        if (!gameIsActive) return;
        if(elements.loadingMessage) elements.loadingMessage.style.display = 'block';
        if(elements.feedbackArea) elements.feedbackArea.innerHTML = "";
        if (currentGameMode === MODE_LEVEL_PRACTICE) stopWordTimer(); // "잠시만요" 동안 타이머 멈춤

        const mailForm = new FormData();
        mailForm.append('userAudio', voiceAudioBlob, 'my_voice_recording.webm');
        mailForm.append('koreanWord', currentWordToPractice);
        try {
            const responseFromServer = await fetch('/assess-my-voice', { method: 'POST', body: mailForm });
            if(elements.loadingMessage) elements.loadingMessage.style.display = 'none';
            if (!gameIsActive) return;
            const resultFromServer = await responseFromServer.json();
            if (!responseFromServer.ok) throw new Error(resultFromServer.errorMessage || '로봇 응답 이상');
            handleRobotResponse(resultFromServer);
        } catch (error) {
            if (!gameIsActive) return;
            if(elements.loadingMessage) elements.loadingMessage.style.display = 'none';
            if(elements.feedbackArea) elements.feedbackArea.innerHTML = `<p style="color: red;">앗! 문제 발생: ${error.message}</p>`;
            if(elements.recordButton) { elements.recordButton.textContent = '🔴 녹음 시작'; elements.recordButton.disabled = false; }
            if (currentGameMode === MODE_LEVEL_PRACTICE && wordTimeLeftInSeconds > 0) startWordTimer(); // 오류 시 타이머 다시 시작
        }
    }
    
    function handleRobotResponse(resultFromServer) {
        if (!gameIsActive) return;
        const isCorrectAnswer = resultFromServer.feedbackMessage.includes("정확해요!");
        if (isCorrectAnswer) {
            handleWordSuccess();
        } else {
            if(elements.feedbackArea) elements.feedbackArea.innerHTML = `<p style="color: orange;">${resultFromServer.feedbackMessage}</p>`;
            handleWordFailure(); // 레벨 모드에서는 틀리면 바로 실패 처리
        }
    }

    function loadVoices() { if ('speechSynthesis' in window) { voices = window.speechSynthesis.getVoices(); if (voices.length === 0) { window.speechSynthesis.onvoiceschanged = () => { voices = window.speechSynthesis.getVoices(); }; } } }
    loadVoices();

    // --- 버튼 누르는 약속(이벤트 리스너) 정하기 ---
    if (elements.listenButton) {
        elements.listenButton.addEventListener('click', () => {
            if (!gameIsActive || !currentWordToPractice) return;
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(currentWordToPractice);
                utterance.lang = 'ko-KR';
                utterance.rate = 0.85;
                let koreanVoice = voices.find(voice => voice.lang === 'ko-KR');
                if (koreanVoice) utterance.voice = koreanVoice;
                window.speechSynthesis.speak(utterance);
            }
        });
    }

    if (elements.recordButton) {
        elements.recordButton.addEventListener('click', async () => {
            if (elements.recordButton.disabled || !gameIsActive) return;
            if (currentGameMode === MODE_LEVEL_PRACTICE && wordTimeLeftInSeconds <= 0) return;
            if (!isCurrentlyRecording) {
                try {
                    currentAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaRecorderTool = new MediaRecorder(currentAudioStream, { mimeType: 'audio/webm;codecs=opus' });
                    recordedAudioChunks = [];
                    mediaRecorderTool.addEventListener('dataavailable', event => { if (event.data.size > 0) recordedAudioChunks.push(event.data); });
                    mediaRecorderTool.addEventListener('stop', () => {
                        if (currentAudioStream) { currentAudioStream.getTracks().forEach(track => track.stop()); currentAudioStream = null; }
                        const completeAudioBlob = new Blob(recordedAudioChunks, { type: mediaRecorderTool.mimeType });
                        if (gameIsActive && completeAudioBlob.size > 0) sendVoiceToRobotForGrading(completeAudioBlob);
                        else if (gameIsActive && completeAudioBlob.size === 0) {
                            if(elements.feedbackArea) elements.feedbackArea.innerHTML = "<p>앗! 녹음된 목소리가 없어요.</p>";
                            elements.recordButton.textContent = '🔴 녹음 시작'; elements.recordButton.disabled = false; elements.recordButton.classList.remove('recording');
                            isCurrentlyRecording = false;
                            if (currentGameMode === MODE_LEVEL_PRACTICE) startWordTimer();
                        }
                    });
                    mediaRecorderTool.start();
                    elements.recordButton.textContent = '⏹️ 녹음 중지'; elements.recordButton.classList.add('recording');
                    if(elements.feedbackArea) elements.feedbackArea.innerHTML = "<p>지금 말해보세요...🎙️</p>";
                    isCurrentlyRecording = true;
                } catch (error) {
                    alert("마이크 사용 불가! 😭");
                    isCurrentlyRecording = false;
                }
            } else {
                if (mediaRecorderTool && mediaRecorderTool.state === 'recording') {
                    isCurrentlyRecording = false; 
                    mediaRecorderTool.stop();
                }
                elements.recordButton.textContent = '잠시만요...'; elements.recordButton.disabled = true; 
            }
        });
    }

    // 메인 화면 버튼들
    if (elements.startLevelPracticeButton) elements.startLevelPracticeButton.addEventListener('click', () => { showScreen('levelSelection'); });
    if (elements.startScoreAttackButton) elements.startScoreAttackButton.addEventListener('click', () => { alert("스코어 어택 모드는 다음 단계에서 만들 거예요!"); });
    if (elements.showRankingButton) elements.showRankingButton.addEventListener('click', () => { alert("랭킹 기능은 다음 단계에서 만들 거예요!"); });
    
    // 레벨 선택 화면 버튼들
    if (elements.startLevel1Button) elements.startLevel1Button.addEventListener('click', () => { currentWordList = wordLevels.level1; startGame(MODE_LEVEL_PRACTICE); });
    if (elements.startLevel2Button) elements.startLevel2Button.addEventListener('click', () => { currentWordList = wordLevels.level2; startGame(MODE_LEVEL_PRACTICE); });
    if (elements.startLevel3Button) elements.startLevel3Button.addEventListener('click', () => { currentWordList = wordLevels.level3; startGame(MODE_LEVEL_PRACTICE); });
    if (elements.backToModeButton) elements.backToModeButton.addEventListener('click', () => showScreen('modeSelection'));
    
    // 게임 종료 화면 버튼들
    if (elements.restartGameButton) elements.restartGameButton.addEventListener('click', () => { if(currentGameMode) startGame(currentGameMode); else initializeGame(); });
    if (elements.changeModeButton) elements.changeModeButton.addEventListener('click', () => initializeGame());
    if (elements.shareResultButton) elements.shareResultButton.addEventListener('click', () => alert("공유 기능은 다음 단계에 만들 거예요!"));
    
    // 페이지 처음 열릴 때 게임 초기화
    initializeGame();
});
