document.addEventListener('DOMContentLoaded', () => {
    console.log("페이지 로딩 완료! main.js 시작! (타이머 충돌 오류 수정 버전)");

    // --- 🥇 1단계: HTML 요소들 먼저 찾아오기 ---
    const wordDisplayElement = document.getElementById('word-to-practice');
    const listenButtonElement = document.getElementById('listen-button');
    const recordButtonElement = document.getElementById('record-button');
    const feedbackResultArea = document.getElementById('my-feedback');
    const loadingMessageElement = document.getElementById('loading-message');
    const wordTimerDisplayElement = document.getElementById('timer-display');
    const overallTimerDisplayElement = document.getElementById('overall-timer-display');
    const scoreBoardElement = document.getElementById('score-board');
    const modeSelectionAreaElement = document.getElementById('mode-selection-area');
    const gamePlayAreaElement = document.getElementById('game-play-area');
    const endGameAreaElement = document.getElementById('end-game-area');
    const startHowManyButtonElement = document.getElementById('start-how-many-btn');
    const startTimeAttackButtonElement = document.getElementById('start-time-attack-btn');
    const restartGameButtonElement = document.getElementById('restart-game-btn');
    const changeModeButtonElement = document.getElementById('change-mode-btn');
    const finalMessageElement = document.getElementById('final-message');
    const finalScoreDisplayElement = document.getElementById('final-score-display');
    const shareResultButtonElement = document.getElementById('share-result-btn');

    // --- 🥈 2단계: 게임에 필요한 기본 재료들 준비 ---
    const koreanWords = [ "강아지", "고양이", "안녕하세요", "감사합니다", "학교", "사랑해요", "괜찮아요", "바나나", "딸기", "컴퓨터", "맛있어요", "대한민국", "화이팅", "축구", "사과", "오렌지", "포도", "수박", "가족", "친구", "행복", "즐거움", "한영양장점 옆 한양양장점 한양양장점 옆 한영양장점", "경찰청 철창살은 외철창살이냐 쌍철창살이냐" ];
    const MODE_HOW_MANY = 'HOW_MANY';
    const MODE_TIME_ATTACK = 'TIME_ATTACK';
    let currentGameMode = null;
    let currentWordList = [];
    let currentWordToPractice = "";
    let currentWordIndex = 0;
    let wordsPassedCount = 0;
    let gameIsActive = false;
    let mediaRecorderTool;
    let recordedAudioChunks = [];
    let isCurrentlyRecording = false;
    let currentAudioStream = null;
    const WORD_TIMER_SECONDS = 15;
    let wordTimeLeftInSeconds = WORD_TIMER_SECONDS;
    let wordTimerInterval;
    const OVERALL_GAME_SECONDS = 60;
    let overallGameTimeLeftInSeconds = OVERALL_GAME_SECONDS;
    let overallGameTimerInterval;

    // --- 🥉 3단계: 우리가 사용할 모든 마법 주문(함수)들을 미리 다 가르쳐주기! ---
    
    function showScreen(screenToShow) {
        if (modeSelectionAreaElement) modeSelectionAreaElement.style.display = 'none';
        if (levelSelectionAreaElement) levelSelectionAreaElement.style.display = 'none';
        if (gamePlayAreaElement) gamePlayAreaElement.style.display = 'none';
        if (endGameAreaElement) endGameAreaElement.style.display = 'none';
        if (screenToShow === 'modeSelection' && modeSelectionAreaElement) modeSelectionAreaElement.style.display = 'block';
        else if (screenToShow === 'levelSelection' && levelSelectionAreaElement) levelSelectionAreaElement.style.display = 'block';
        else if (screenToShow === 'gamePlay' && gamePlayAreaElement) gamePlayAreaElement.style.display = 'block';
        else if (screenToShow === 'endGame' && endGameAreaElement) endGameAreaElement.style.display = 'block';
    }

    function updateScoreBoard() {
        if (!scoreBoardElement) return;
        if (currentGameMode === MODE_TIME_ATTACK) {
            scoreBoardElement.textContent = `성공: ${wordsPassedCount}개`;
        } else {
            scoreBoardElement.textContent = `통과: ${wordsPassedCount}개 / 총 ${currentWordList.length}개`;
        }
    }

    function stopAllTimers() {
        clearInterval(wordTimerInterval); wordTimerInterval = null;
        clearInterval(overallGameTimerInterval); overallGameTimerInterval = null;
    }
    function stopWordTimer() { clearInterval(wordTimerInterval); wordTimerInterval = null; }
    function stopOverallGameTimer() { clearInterval(overallGameTimerInterval); overallGameTimerInterval = null; }

    function resetWordTimerDisplay() { if (wordTimerDisplayElement) { wordTimerDisplayElement.textContent = `단어 시간: ${WORD_TIMER_SECONDS}초`; wordTimerDisplayElement.style.color = '#c0392b'; } }
    function resetOverallGameTimerDisplay() { if (overallTimerDisplayElement) { overallTimerDisplayElement.textContent = `전체 시간: ${OVERALL_GAME_SECONDS}초`; overallTimerDisplayElement.style.color = '#e67e22'; } }
    
    function resetWordTimer() { wordTimeLeftInSeconds = WORD_TIMER_SECONDS; resetWordTimerDisplay(); }
    function resetOverallGameTimer() { overallGameTimeLeftInSeconds = OVERALL_GAME_SECONDS; resetOverallGameTimerDisplay(); }

    function startWordTimer() {
        if (currentGameMode !== MODE_HOW_MANY || !gameIsActive) return; // "얼마나 많이" 모드일 때만 실행!
        stopWordTimer();
        wordTimerInterval = setInterval(() => {
            if (!gameIsActive) { stopWordTimer(); return; }
            wordTimeLeftInSeconds--;
            if (wordTimerDisplayElement) wordTimerDisplayElement.textContent = `단어 시간: ${wordTimeLeftInSeconds}초`;
            if (wordTimeLeftInSeconds <= 0) {
                handleWordFailureByTimeOut();
            } else if (wordTimeLeftInSeconds <= 5 && wordTimerDisplayElement) {
                wordTimerDisplayElement.style.color = 'orange';
            }
        }, 1000);
    }

    function startOverallGameTimer() {
        if (currentGameMode !== MODE_TIME_ATTACK || !gameIsActive) return; // "타임어택" 모드일 때만 실행!
        stopOverallGameTimer();
        overallGameTimerInterval = setInterval(() => {
            if (!gameIsActive) { stopOverallGameTimer(); return; }
            overallGameTimeLeftInSeconds--;
            if (overallTimerDisplayElement) overallTimerDisplayElement.textContent = `전체 시간: ${overallGameTimeLeftInSeconds}초`;
            if (overallGameTimeLeftInSeconds <= 0) {
                handleOverallTimeUp();
            } else if (overallGameTimeLeftInSeconds <= 10 && overallTimerDisplayElement) {
                overallTimerDisplayElement.style.color = '#e74c3c';
            }
        }, 1000);
    }
    
    function presentNextWord() {
        if (!gameIsActive) return;
        if (currentGameMode === MODE_HOW_MANY && currentWordIndex >= currentWordList.length) { handleGameClear(); return; }
        if (currentGameMode === MODE_TIME_ATTACK && currentWordIndex >= currentWordList.length) { currentWordIndex = 0; }
        currentWordToPractice = currentWordList[currentWordIndex];
        if (wordDisplayElement) wordDisplayElement.textContent = currentWordToPractice;
        if (feedbackResultArea) feedbackResultArea.innerHTML = "<p>발음해보세요!</p>";
        if (recordButtonElement) { recordButtonElement.textContent = '🔴 녹음 시작'; recordButtonElement.disabled = false; recordButtonElement.classList.remove('recording'); }
        isCurrentlyRecording = false;
        if (currentGameMode === MODE_HOW_MANY) { stopWordTimer(); resetWordTimer(); startWordTimer(); }
    }

    function handleWordFailureByTimeOut() {
        if (currentGameMode !== MODE_HOW_MANY || !gameIsActive) return;
        stopWordTimer();
        if (isCurrentlyRecording && mediaRecorderTool && mediaRecorderTool.state === 'recording') { isCurrentlyRecording = false; mediaRecorderTool.stop(); } else { isCurrentlyRecording = false; }
        if (feedbackResultArea) feedbackResultArea.innerHTML = `<p style="color: red; font-weight: bold;">단어 시간 초과! ⏰</p>`;
        if (wordTimerDisplayElement) wordTimerDisplayElement.textContent = `시간 끝!`;
        handleGameOver('wordTimeout_HowMany');
    }

    function handleWordSuccess() {
        if (currentGameMode === MODE_HOW_MANY) stopWordTimer();
        wordsPassedCount++;
        updateScoreBoard();
        currentWordIndex++;
        if (feedbackResultArea) feedbackResultArea.innerHTML = `<p style="color: green; font-weight: bold;">성공! 🎉</p>`;
        if (currentGameMode === MODE_HOW_MANY && wordTimerDisplayElement) wordTimerDisplayElement.style.color = 'green';
        if (recordButtonElement) recordButtonElement.disabled = true;
        setTimeout(() => {
            if (gameIsActive && (currentGameMode === MODE_HOW_MANY || overallGameTimeLeftInSeconds > 0)) {
                presentNextWord();
            } else if (gameIsActive && currentGameMode === MODE_TIME_ATTACK && overallGameTimeLeftInSeconds <= 0) {
                handleOverallTimeUp();
            }
        }, 1000);
    }

    function handleGameOver(reason) {
        gameIsActive = false; stopAllTimers();
        if (finalMessageElement) finalMessageElement.textContent = "GAME OVER! 😭";
        if (finalScoreDisplayElement) finalScoreDisplayElement.textContent = `총 ${wordsPassedCount}개의 단어를 통과했어요!`;
        if (shareResultButtonElement) shareResultButtonElement.style.display = 'inline-block';
        showScreen('endGame');
        if (recordButtonElement) recordButtonElement.disabled = true;
        if (listenButtonElement) listenButtonElement.disabled = true;
    }

    function handleGameClear() {
        gameIsActive = false; stopAllTimers();
        if (finalMessageElement) finalMessageElement.textContent = "🎉 모든 단어 통과!";
        if (finalScoreDisplayElement) finalScoreDisplayElement.textContent = `정말 대단해요! ${currentWordList.length}개를 완벽하게 해냈어요!`;
        if (shareResultButtonElement) shareResultButtonElement.style.display = 'inline-block';
        showScreen('endGame');
        if (recordButtonElement) recordButtonElement.disabled = true;
        if (listenButtonElement) listenButtonElement.disabled = true;
    }

    function handleOverallTimeUp() {
        if (currentGameMode !== MODE_TIME_ATTACK || !gameIsActive) return;
        gameIsActive = false; stopAllTimers();
        if (finalMessageElement) finalMessageElement.textContent = "⏱️ 타임어택 종료! ⏱️";
        if (finalScoreDisplayElement) finalScoreDisplayElement.textContent = `총 ${wordsPassedCount}개의 단어를 성공했어요!`;
        if (shareResultButtonElement) shareResultButtonElement.style.display = 'inline-block';
        showScreen('endGame');
        if (recordButtonElement) recordButtonElement.disabled = true;
        if (listenButtonElement) listenButtonElement.disabled = true;
    }

    function startGame(selectedLevel) {
        gameIsActive = true; wordsPassedCount = 0; currentWordIndex = 0;
        
        if (currentGameMode === MODE_TIME_ATTACK) {
            currentWordList = [...wordLevels.level1, ...wordLevels.level2, ...wordLevels.level3];
            currentWordList.sort(() => Math.random() - 0.5); // 단어 섞기
            if (overallTimerDisplayElement) overallTimerDisplayElement.style.display = 'block';
            if (wordTimerDisplayElement) wordTimerDisplayElement.style.display = 'none';
            resetOverallGameTimer(); startOverallGameTimer();
        } else { // MODE_HOW_MANY
            currentWordList = wordLevels[selectedLevel] || wordLevels.level1;
            if (overallTimerDisplayElement) overallTimerDisplayElement.style.display = 'none';
            if (wordTimerDisplayElement) wordTimerDisplayElement.style.display = 'block';
            resetWordTimer();
        }
        
        updateScoreBoard();
        showScreen('gamePlay');
        if (listenButtonElement) listenButtonElement.disabled = false;
        if (recordButtonElement) recordButtonElement.disabled = false;
        isCurrentlyRecording = false;
        if (loadingMessageElement) loadingMessageElement.style.display = 'none';
        presentNextWord();
    }
    
    function initializeGame() {
        gameIsActive = false; stopAllTimers();
        currentWordIndex = 0; wordsPassedCount = 0;
        currentGameMode = null; currentWordList = [];
        updateScoreBoard();
        if (wordDisplayElement) wordDisplayElement.textContent = "게임 모드를 선택해주세요!";
        if (feedbackResultArea) feedbackResultArea.innerHTML = "<p>어떤 모드로 도전할까요?</p>";
        resetWordTimerDisplay(); resetOverallGameTimerDisplay();
        if (listenButtonElement) listenButtonElement.disabled = true;
        if (recordButtonElement) { recordButtonElement.disabled = true; recordButtonElement.textContent = '🔴 녹음 시작'; recordButtonElement.classList.remove('recording'); }
        if (restartGameButtonElement) restartGameButtonElement.style.display = 'none';
        if (changeModeButtonElement) changeModeButtonElement.style.display = 'none';
        if (shareResultButtonElement) shareResultButtonElement.style.display = 'none';
        if (loadingMessageElement) loadingMessageElement.style.display = 'none';
        showScreen('modeSelection');
    }
    
    // (이하 녹음 및 서버 통신, 결과 처리 함수는 이전과 동일)
    // ...

    // --- 🚀 페이지 로드 시 버튼 이벤트 리스너 연결 및 게임 초기화 ---
    if (startHowManyButtonElement) {
        startHowManyButtonElement.addEventListener('click', () => {
            currentGameMode = MODE_HOW_MANY;
            showScreen('levelSelection'); 
        });
    }
    if (startTimeAttackButtonElement) {
        startTimeAttackButtonElement.addEventListener('click', () => {
            currentGameMode = MODE_TIME_ATTACK;
            startGame(null); // 타임어택은 레벨 선택 없음
        });
    }
    if (startLevel1ButtonElement) startLevel1ButtonElement.addEventListener('click', () => startGame('level1'));
    if (startLevel2ButtonElement) startLevel2ButtonElement.addEventListener('click', () => startGame('level2'));
    if (startLevel3ButtonElement) startLevel3ButtonElement.addEventListener('click', () => startGame('level3'));
    if (backToModeButtonElement) backToModeButtonElement.addEventListener('click', () => showScreen('modeSelection'));

    if (restartGameButtonElement) {
        restartGameButtonElement.addEventListener('click', () => {
            if (currentGameMode === MODE_TIME_ATTACK) {
                startGame(null); // 타임어택 재시작
            } else if (currentGameMode === MODE_HOW_MANY) {
                showScreen('levelSelection'); // "얼마나 많이"는 레벨 선택부터 다시
            } else {
                initializeGame();
            }
        });
    }
    if (changeModeButtonElement) changeModeButtonElement.addEventListener('click', () => initializeGame());
    if (shareResultButtonElement) shareResultButtonElement.addEventListener('click', shareGameResult);
    
    // 이 아래로는 이전 버전과 동일한 코드입니다.
    // (listenButton, recordButton 이벤트 리스너, sendVoiceToRobotForGrading, handleRobotResponse, shareGameResult, copyToClipboardFallback)

    let voices = [];
    function loadVoices() {
        if ('speechSynthesis' in window) {
            voices = window.speechSynthesis.getVoices();
            if (voices.length === 0) { window.speechSynthesis.onvoiceschanged = () => { voices = window.speechSynthesis.getVoices(); };}
        }
    }
    loadVoices();

    if (listenButtonElement) { /* ... 이전 '똑똑한 소리듣기' 버전과 동일 ... */ listenButtonElement.addEventListener('click', () => { if (!gameIsActive || !currentWordToPractice) { alert("게임이 시작되지 않았거나 읽을 단어가 준비되지 않았어요!"); return; } if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(currentWordToPractice); utterance.lang = 'ko-KR'; utterance.rate = 0.85; utterance.pitch = 1; let selectedVoice = voices.find(voice => voice.lang === 'ko-KR' && !voice.name.includes('Google')) || voices.find(voice => voice.lang === 'ko-KR'); if (selectedVoice) { utterance.voice = selectedVoice; } utterance.onerror = (event) => { console.error("SpeechSynthesis Error:", event.error); alert(`소리 내기 오류: ${event.error}`);}; window.speechSynthesis.speak(utterance); } else { alert("이 브라우저에서는 음성 합성을 지원하지 않습니다."); } }); }
    if (recordButtonElement) { recordButtonElement.addEventListener('click', async () => { if (recordButtonElement.disabled || !gameIsActive) return; if (currentGameMode === MODE_TIME_ATTACK && overallGameTimeLeftInSeconds <= 0) return; if (currentGameMode === MODE_HOW_MANY && wordTimeLeftInSeconds <= 0) return; if (!isCurrentlyRecording) { try { currentAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true }); mediaRecorderTool = new MediaRecorder(currentAudioStream, { mimeType: 'audio/webm;codecs=opus' }); recordedAudioChunks = []; mediaRecorderTool.addEventListener('dataavailable', event => { if (event.data.size > 0) recordedAudioChunks.push(event.data); }); mediaRecorderTool.addEventListener('stop', () => { if (currentAudioStream) { currentAudioStream.getTracks().forEach(track => track.stop()); currentAudioStream = null; } const completeAudioBlob = new Blob(recordedAudioChunks, { type: mediaRecorderTool.mimeType }); let canSend = (currentGameMode === MODE_HOW_MANY && wordTimeLeftInSeconds > 0) || (currentGameMode === MODE_TIME_ATTACK && overallGameTimeLeftInSeconds > 0); if (gameIsActive && canSend && completeAudioBlob.size > 0) sendVoiceToRobotForGrading(completeAudioBlob); else if (gameIsActive && canSend && completeAudioBlob.size === 0) { if(feedbackResultArea) feedbackResultArea.innerHTML = "<p>앗! 녹음된 목소리가 없어요.</p>"; if (canSend) { recordButtonElement.textContent = '🔴 녹음 시작'; recordButtonElement.disabled = false; recordButtonElement.classList.remove('recording'); isCurrentlyRecording = false; if (currentGameMode === MODE_HOW_MANY) startWordTimer(); } } }); mediaRecorderTool.start(); recordButtonElement.textContent = '⏹️ 녹음 중지'; recordButtonElement.classList.add('recording'); if(feedbackResultArea) feedbackResultArea.innerHTML = "<p>지금 말해보세요...🎙️</p>"; isCurrentlyRecording = true; } catch (error) { console.error("마이크 오류:", error); alert("마이크 사용 불가!"); if(feedbackResultArea) feedbackResultArea.innerHTML = "<p>마이크 사용 불가 😭</p>"; recordButtonElement.textContent = '🔴 녹음 시작'; recordButtonElement.classList.remove('recording'); isCurrentlyRecording = false;} } else { if (mediaRecorderTool && mediaRecorderTool.state === 'recording') { if (currentGameMode === MODE_HOW_MANY) stopWordTimer(); isCurrentlyRecording = false; mediaRecorderTool.stop(); } recordButtonElement.textContent = '잠시만요...'; recordButtonElement.disabled = true; } }); }
    async function sendVoiceToRobotForGrading(voiceAudioBlob) { if (!gameIsActive) return; if(loadingMessageElement) loadingMessageElement.style.display = 'block'; if(feedbackResultArea) feedbackResultArea.innerHTML = ""; if (currentGameMode === MODE_HOW_MANY) stopWordTimer(); const mailForm = new FormData(); mailForm.append('userAudio', voiceAudioBlob, 'my_voice_recording.webm'); mailForm.append('koreanWord', currentWordToPractice); try { const responseFromServer = await fetch('/assess-my-voice', { method: 'POST', body: mailForm }); if(loadingMessageElement) loadingMessageElement.style.display = 'none'; if (!gameIsActive) return; const resultFromServer = await responseFromServer.json(); if (!responseFromServer.ok) throw new Error(resultFromServer.errorMessage || '로봇 응답 이상'); handleRobotResponse(resultFromServer); } catch (error) { if (!gameIsActive) return; if(loadingMessageElement) loadingMessageElement.style.display = 'none'; console.error('서버 통신 오류:', error); if(feedbackResultArea) feedbackResultArea.innerHTML = `<p style="color: red;">앗! 문제 발생: ${error.message}</p>`; let canRetry = (currentGameMode === MODE_HOW_MANY && wordTimeLeftInSeconds > 0) || (currentGameMode === MODE_TIME_ATTACK && overallGameTimeLeftInSeconds > 0); if (canRetry) { if(recordButtonElement) { recordButtonElement.textContent = '🔴 녹음 시작'; recordButtonElement.disabled = false; recordButtonElement.classList.remove('recording');} if (currentGameMode === MODE_HOW_MANY) startWordTimer(); } else if (gameIsActive) { if(currentGameMode === MODE_HOW_MANY) handleGameOver('serverError_HowMany'); else if(currentGameMode === MODE_TIME_ATTACK) handleOverallTimeUp(); } } }
    function handleRobotResponse(resultFromServer) { if (!gameIsActive) return; if (!resultFromServer.success) { if(feedbackResultArea) feedbackResultArea.innerHTML = `<p style="color: red;">${resultFromServer.errorMessage || '결과 못 받음'}</p>`; let canRetry = (currentGameMode === MODE_HOW_MANY && wordTimeLeftInSeconds > 0) || (currentGameMode === MODE_TIME_ATTACK && overallGameTimeLeftInSeconds > 0); if (canRetry) { if(recordButtonElement) { recordButtonElement.textContent = '🔴 녹음 시작'; recordButtonElement.disabled = false; recordButtonElement.classList.remove('recording');} if (currentGameMode === MODE_HOW_MANY) startWordTimer(); } else if (gameIsActive) { if(currentGameMode === MODE_HOW_MANY) handleGameOver('robotError_HowMany'); else if(currentGameMode === MODE_TIME_ATTACK) handleOverallTimeUp(); } return; } const isCorrectAnswer = resultFromServer.feedbackMessage.includes("정확해요!"); if (isCorrectAnswer) handleWordSuccess(); else { if(feedbackResultArea) feedbackResultArea.innerHTML = `<p style="color: orange;">${resultFromServer.feedbackMessage}</p>`; let canRetry = (currentGameMode === MODE_HOW_MANY && wordTimeLeftInSeconds > 0) || (currentGameMode === MODE_TIME_ATTACK && overallGameTimeLeftInSeconds > 0); if (canRetry) { if(recordButtonElement) { recordButtonElement.textContent = '🔴 녹음 시작'; recordButtonElement.disabled = false; recordButtonElement.classList.remove('recording');} if (currentGameMode === MODE_HOW_MANY) startWordTimer(); } else if (gameIsActive) { if(currentGameMode === MODE_HOW_MANY) handleGameOver('incorrectAndWordTimeUp_HowMany'); else if(currentGameMode === MODE_TIME_ATTACK) handleOverallTimeUp(); } } }
    function shareGameResult() { if (!finalMessageElement || !finalScoreDisplayElement) return; let gameModeText = ""; if (currentGameMode === MODE_HOW_MANY) gameModeText = "🚀 얼마나 많이 통과?"; else if (currentGameMode === MODE_TIME_ATTACK) gameModeText = "⏱️ 60초 타임어택!"; const titleToShare = "✨ 한국어 발음왕 도전! 내 결과 좀 봐! ✨"; const textToShare = `모드: ${gameModeText}\n결과: ${finalMessageElement.textContent}\n${finalScoreDisplayElement.textContent}\n\n나랑 같이 한국어 발음 연습할 사람? 👇\n#한국어발음왕 #발음챌린지 #우리게임대박`; const urlToShare = window.location.href; const shareData = { title: titleToShare, text: textToShare, url: urlToShare, }; if (navigator.share) { try { navigator.share(shareData); } catch (err) { console.error('공유 실패:', err); copyToClipboardFallback(titleToShare + "\n" + textToShare + "\n" + urlToShare); } } else { console.log('Web Share API 지원 안됨 - 클립보드로 복사합니다.'); copyToClipboardFallback(titleToShare + "\n" + textToShare + "\n" + urlToShare); } }
    function copyToClipboardFallback(textToCopy) { navigator.clipboard.writeText(textToCopy).then(() => { alert("게임 결과가 복사되었어요! SNS에 붙여넣고 자랑해보세요! 📋🎉\n(스마트폰 공유 버튼이 안 보일 땐 이렇게 복사돼요!)"); }).catch(err => { console.error('클립보드 복사 실패:', err); alert("앗! 결과 복사도 실패했어요. 직접 적어서 자랑해주세요! 😥"); }); }

    initializeGame(); // 페이지 처음 열릴 때 게임 초기화!
});
