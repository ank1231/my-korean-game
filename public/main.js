document.addEventListener('DOMContentLoaded', () => {
    console.log("페이지 로딩 완료! main.js 시작! (랭킹 시스템 탑재 버전)");

    // --- HTML 요소들 전부 찾아오기 ---
    const elements = {
        wordDisplay: document.getElementById('word-to-practice'),
        listenButton: document.getElementById('listen-button'),
        recordButton: document.getElementById('record-button'),
        feedbackArea: document.getElementById('my-feedback'),
        feedbackTitle: document.getElementById('feedback-title'),
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

    // --- 단어 및 게임 모드 정의 ---
    const wordLevels = {
        level1: ["안녕하세요", "감사합니다", "이거 얼마예요?", "화장실 어디예요?", "닭갈비", "진짜 예쁘다", "다시 한번 말해주세요."],
        level2: ["민주주의의 의의", "책을 읊조리다", "흙을 밟다", "고려고 교복은 고급 교복이다.", "백화점 세일 마지막 날이라서 사람이 많아요.", "앞 집 팥죽은 붉은 팥 풋팥죽이다.", "저는 대한민국 서울특별시에 살고 있습니다."],
        level3: ["간장 공장 공장장은 강 공장장이고 된장 공장 공장장은 공 공장장이다.", "경찰청 철창살은 외철창살이냐 쌍철창살이냐.", "내가 그린 기린 그림은 잘 그린 기린 그림이다.", "한영양장점 옆 한양양장점.", "서울특별시 특허허가과 허가과장 허과장.", "저기 저 뜀틀이 내가 뛸 뜀틀인가 내가 안 뛸 뜀틀인가.", "챠프포프킨과 치스챠코프는 라흐마니노프의 피아노 콘체르토를 연주했다."]
    };
    const MODE_LEVEL_PRACTICE = 'LEVEL_PRACTICE';
    const MODE_SCORE_ATTACK = 'SCORE_ATTACK';
    
    // --- 게임 상태 변수들 ---
    let currentGameMode = null; let currentWordList = [];
    let currentWordToPractice = ""; let currentWordIndex = 0; let wordsPassedCount = 0; let gameIsActive = false;
    let mediaRecorderTool; let recordedAudioChunks = []; let isCurrentlyRecording = false; let currentAudioStream = null;
    const WORD_TIMER_SECONDS = 15; let wordTimeLeftInSeconds = WORD_TIMER_SECONDS; let wordTimerInterval;

    // --- 모든 함수 선언 ---
    function showScreen(screenToShow) {
        Object.values(elements).forEach(el => { if (el && el.id && el.id.includes('-area')) el.style.display = 'none'; });
        if (elements[screenToShow + 'Area']) elements[screenToShow + 'Area'].style.display = 'block';
    }

    function updateScoreBoard() {
        if(!elements.scoreBoard) return;
        if (currentGameMode === MODE_SCORE_ATTACK) {
            elements.scoreBoard.textContent = `현재 점수: ${wordsPassedCount}점`;
        } else if (currentGameMode === MODE_LEVEL_PRACTICE) {
            elements.scoreBoard.textContent = `통과: ${wordsPassedCount}개 / 총 ${currentWordList.length}개`;
        } else {
            elements.scoreBoard.textContent = '점수';
        }
    }

    // (이하 다른 함수들도 랭킹 시스템에 맞게 모두 수정 및 추가되었습니다.)
    function stopAllTimers() { clearInterval(wordTimerInterval); clearInterval(overallGameTimerInterval); }
    function stopWordTimer() { clearInterval(wordTimerInterval); }
    function resetWordTimerDisplay(){ if (elements.wordTimerDisplay) { elements.wordTimerDisplay.textContent = `단어 시간: ${WORD_TIMER_SECONDS}초`; elements.wordTimerDisplay.style.color = '#c0392b'; } }
    function resetWordTimer() { wordTimeLeftInSeconds = WORD_TIMER_SECONDS; resetWordTimerDisplay(); }
    function startWordTimer() { if (currentGameMode !== MODE_LEVEL_PRACTICE || !gameIsActive) return; stopWordTimer(); wordTimerInterval = setInterval(() => { if (!gameIsActive) { stopWordTimer(); return; } wordTimeLeftInSeconds--; if (elements.wordTimerDisplay) elements.wordTimerDisplay.textContent = `단어 시간: ${wordTimeLeftInSeconds}초`; if (wordTimeLeftInSeconds <= 0) handleWordFailure(); else if (wordTimeLeftInSeconds <= 5) elements.wordTimerDisplay.style.color = 'orange'; }, 1000); }
    
    function presentNextWord() { 
        if (!gameIsActive) return;
        if (currentWordIndex >= currentWordList.length) { handleGameEnd(); return; }
        currentWordToPractice = currentWordList[currentWordIndex];
        if (elements.wordDisplay) elements.wordDisplay.textContent = currentWordToPractice;
        if (elements.feedbackArea) elements.feedbackArea.innerHTML = "<p>발음해보세요!</p>";
        if (elements.recordButton) { elements.recordButton.textContent = '🔴 녹음 시작'; elements.recordButton.disabled = false; elements.recordButton.classList.remove('recording');}
        isCurrentlyRecording = false; 
        if (currentGameMode === MODE_LEVEL_PRACTICE) { stopWordTimer(); resetWordTimer(); startWordTimer(); }
    }
    
    function handleWordSuccess() { 
        wordsPassedCount++; updateScoreBoard(); currentWordIndex++;
        if(elements.feedbackArea) elements.feedbackArea.innerHTML = `<p style="color: green; font-weight: bold;">성공! 🎉</p>`;
        if (currentGameMode === MODE_LEVEL_PRACTICE && elements.wordTimerDisplay) elements.wordTimerDisplay.style.color = 'green';
        if(elements.recordButton) elements.recordButton.disabled = true;
        setTimeout(() => { if (gameIsActive) presentNextWord(); }, 1000);
    }
    
    function handleWordFailure() { // 단어 실패 처리 (모든 모드 공통)
        if (!gameIsActive) return;
        if (currentGameMode === MODE_LEVEL_PRACTICE) { // 레벨 모드에서는 실패하면 바로 게임 오버
            stopWordTimer();
            if(elements.feedbackArea) elements.feedbackArea.innerHTML = `<p style="color: red; font-weight: bold;">실패! ⏰</p>`;
            handleGameEnd();
        } else if (currentGameMode === MODE_SCORE_ATTACK) { // 스코어 어택은 다음 단어로
            currentWordIndex++;
            if(elements.feedbackArea) elements.feedbackArea.innerHTML = `<p style="color: orange;">아쉽네요! 다음 문제!</p>`;
            if(elements.recordButton) elements.recordButton.disabled = true;
            setTimeout(() => { if (gameIsActive) presentNextWord(); }, 1000);
        }
    }

    function handleGameEnd() {
        gameIsActive = false; stopAllTimers();
        if(elements.listenButton) elements.listenButton.disabled = true;
        if(elements.recordButton) elements.recordButton.disabled = true;

        // 게임 모드별로 다른 종료 화면 보여주기
        if (currentGameMode === MODE_LEVEL_PRACTICE) {
            const isClear = wordsPassedCount === currentWordList.length;
            if(elements.finalMessage) elements.finalMessage.textContent = isClear ? "🎉 레벨 클리어! 🎉" : "GAME OVER! 😭";
            if(elements.finalScoreDisplay) elements.finalScoreDisplay.textContent = `총 ${wordsPassedCount}개의 단어를 통과했어요!`;
            if(elements.saveScoreArea) elements.saveScoreArea.style.display = 'none'; // 레벨 모드는 점수 저장 안 함
        } else if (currentGameMode === MODE_SCORE_ATTACK) {
            if(elements.finalMessage) elements.finalMessage.textContent = "🏆 스코어 어택 종료! 🏆";
            if(elements.finalScoreDisplay) elements.finalScoreDisplay.textContent = `최종 점수: ${wordsPassedCount}점`;
            if(elements.saveScoreArea) elements.saveScoreArea.style.display = 'block'; // 스코어 어택만 점수 저장 보이기
            if(elements.nicknameInput) elements.nicknameInput.value = ""; // 닉네임 입력칸 초기화
        }

        if(elements.shareResultButton) elements.shareResultButton.style.display = 'inline-block';
        showScreen('endGame');
    }

    async function saveScore() {
        const nickname = elements.nicknameInput.value.trim();
        if (!nickname) {
            alert('닉네임을 입력해주세요!');
            return;
        }
        if (nickname.length > 8) {
            alert('닉네임은 8자 이내로 입력해주세요.');
            return;
        }

        elements.saveScoreButton.disabled = true;
        elements.saveScoreButton.textContent = '저장 중...';

        try {
            const response = await fetch('/api/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname: nickname, score: wordsPassedCount })
            });
            if (!response.ok) throw new Error('점수 저장에 실패했어요.');
            
            alert('기록이 저장되었습니다!');
            await showLeaderboard(); // 랭킹 보여주기
        } catch (error) {
            alert(error.message);
            elements.saveScoreButton.disabled = false;
            elements.saveScoreButton.textContent = '내 기록 저장하기!';
        }
    }

    async function showLeaderboard() {
        showScreen('leaderboard');
        if (elements.rankingList) elements.rankingList.innerHTML = '<p>랭킹을 불러오는 중...</p>';
        try {
            const response = await fetch('/api/scores');
            const rankings = await response.json();
            if (elements.rankingList) {
                elements.rankingList.innerHTML = ''; // 목록 비우기
                if (rankings.length === 0) {
                    elements.rankingList.innerHTML = '<p>아직 등록된 기록이 없어요. 1등에 도전하세요!</p>';
                } else {
                    rankings.forEach((rank, index) => {
                        const li = document.createElement('li');
                        li.textContent = `🏅 ${index + 1}등: ${rank.nickname} - ${rank.score}점`;
                        elements.rankingList.appendChild(li);
                    });
                }
            }
        } catch (error) {
            if (elements.rankingList) elements.rankingList.innerHTML = '<p>랭킹을 불러오는 데 실패했어요.</p>';
        }
    }
    
    function initializeGame() { 
        gameIsActive = false; stopAllTimers(); currentWordIndex = 0; wordsPassedCount = 0; currentGameMode = null; currentWordList = [];
        updateScoreBoard(); 
        if(elements.wordDisplay) elements.wordDisplay.textContent = "게임 모드를 선택해주세요!";
        if(elements.feedbackArea) elements.feedbackArea.innerHTML = "<p>어떤 모드로 도전할까요?</p>";
        resetWordTimerDisplay(); resetOverallGameTimerDisplay(); 
        if (elements.listenButton) elements.listenButton.disabled = true;
        if (elements.recordButton) { elements.recordButton.disabled = true; elements.recordButton.textContent = '🔴 녹음 시작'; elements.recordButton.classList.remove('recording');}
        if (elements.restartGameButton) elements.restartGameButton.style.display = 'none';
        if (elements.changeModeButton) elements.changeModeButton.style.display = 'none';
        if (elements.shareResultButton) elements.shareResultButton.style.display = 'none';
        if (elements.loadingMessage) elements.loadingMessage.style.display = 'none';
        showScreen('modeSelection');
    }

    // (이하 녹음 및 서버 통신, 공유 함수들은 이전과 거의 동일)
    async function sendVoiceToRobotForGrading(voiceAudioBlob) { /* ... */ }
    function handleRobotResponse(resultFromServer) { /* ... */ }
    // ...
    // (아래에 sendVoiceToRobotForGrading, handleRobotResponse 등 전체 함수를 다시 넣어드릴게요!)
    if (listenButtonElement) { listenButtonElement.addEventListener('click', () => { if (!gameIsActive || !currentWordToPractice) return; if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(currentWordToPractice); utterance.lang = 'ko-KR'; utterance.rate = 0.85; utterance.pitch = 1; let voices = window.speechSynthesis.getVoices(); let koreanVoice = voices.find(voice => voice.lang === 'ko-KR'); if (koreanVoice) utterance.voice = koreanVoice; window.speechSynthesis.speak(utterance); } }); }
    if (recordButtonElement) { recordButtonElement.addEventListener('click', async () => { if (recordButtonElement.disabled || !gameIsActive) return; let timeIsUp = (currentGameMode === MODE_LEVEL_PRACTICE && wordTimeLeftInSeconds <= 0) || (currentGameMode === MODE_SCORE_ATTACK && overallGameTimeLeftInSeconds <= 0); if (timeIsUp) return; if (!isCurrentlyRecording) { try { currentAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true }); mediaRecorderTool = new MediaRecorder(currentAudioStream, { mimeType: 'audio/webm;codecs=opus' }); recordedAudioChunks = []; mediaRecorderTool.addEventListener('dataavailable', event => { if (event.data.size > 0) recordedAudioChunks.push(event.data); }); mediaRecorderTool.addEventListener('stop', () => { if (currentAudioStream) { currentAudioStream.getTracks().forEach(track => track.stop()); currentAudioStream = null; } const completeAudioBlob = new Blob(recordedAudioChunks, { type: mediaRecorderTool.mimeType }); if (gameIsActive && completeAudioBlob.size > 0) { sendVoiceToRobotForGrading(completeAudioBlob); } else if (gameIsActive && completeAudioBlob.size === 0) { if(elements.feedbackArea) elements.feedbackArea.innerHTML = "<p>앗! 녹음된 목소리가 없어요.</p>"; recordButtonElement.textContent = '🔴 녹음 시작'; recordButtonElement.disabled = false; recordButtonElement.classList.remove('recording'); isCurrentlyRecording = false; } }); mediaRecorderTool.start(); recordButtonElement.textContent = '⏹️ 녹음 중지'; recordButtonElement.classList.add('recording'); if(elements.feedbackArea) elements.feedbackArea.innerHTML = "<p>지금 말해보세요...🎙️</p>"; isCurrentlyRecording = true; } catch (error) { console.error("마이크 오류:", error); alert("마이크 사용 불가!"); if(elements.feedbackArea) elements.feedbackArea.innerHTML = "<p>마이크 사용 불가 😭</p>"; recordButtonElement.textContent = '🔴 녹음 시작'; recordButtonElement.classList.remove('recording'); isCurrentlyRecording = false;} } else { if (mediaRecorderTool && mediaRecorderTool.state === 'recording') { isCurrentlyRecording = false; mediaRecorderTool.stop(); } recordButtonElement.textContent = '잠시만요...'; recordButtonElement.disabled = true; } }); }
    async function sendVoiceToRobotForGrading(voiceAudioBlob) { if (!gameIsActive) return; if(elements.loadingMessage) elements.loadingMessage.style.display = 'block'; if(elements.feedbackArea) elements.feedbackArea.innerHTML = ""; const mailForm = new FormData(); mailForm.append('userAudio', voiceAudioBlob, 'my_voice_recording.webm'); mailForm.append('koreanWord', currentWordToPractice); try { const responseFromServer = await fetch('/assess-my-voice', { method: 'POST', body: mailForm }); if(elements.loadingMessage) elements.loadingMessage.style.display = 'none'; if (!gameIsActive) return; const resultFromServer = await responseFromServer.json(); if (!responseFromServer.ok) throw new Error(resultFromServer.errorMessage || '로봇 응답 이상'); handleRobotResponse(resultFromServer); } catch (error) { if (!gameIsActive) return; if(elements.loadingMessage) elements.loadingMessage.style.display = 'none'; console.error('서버 통신 오류:', error); if(elements.feedbackArea) elements.feedbackArea.innerHTML = `<p style="color: red;">앗! 문제 발생: ${error.message}</p>`; if(elements.recordButton) { elements.recordButton.textContent = '🔴 녹음 시작'; elements.recordButton.disabled = false; elements.recordButton.classList.remove('recording');} } }
    function handleRobotResponse(resultFromServer) { if (!gameIsActive) return; if (!resultFromServer.success) { if(elements.feedbackArea) elements.feedbackArea.innerHTML = `<p style="color: red;">${resultFromServer.errorMessage || '결과 못 받음'}</p>`; handleWordFailure(); return; } const isCorrectAnswer = resultFromServer.feedbackMessage.includes("정확해요!"); if (isCorrectAnswer) handleWordSuccess(); else { if(elements.feedbackArea) elements.feedbackArea.innerHTML = `<p style="color: orange;">${resultFromServer.feedbackMessage}</p>`; handleWordFailure(); } }
    function shareGameResult() { if (!elements.finalMessage || !elements.finalScoreDisplay) return; let gameModeText = currentGameMode === MODE_LEVEL_PRACTICE ? "📝 레벨별 발음연습" : "🏆 스코어 어택!"; const titleToShare = "✨ 한국어 발음왕 도전! 내 결과 좀 봐! ✨"; const textToShare = `모드: ${gameModeText}\n결과: ${elements.finalMessage.textContent}\n${elements.finalScoreDisplay.textContent}\n\n같이 도전해봐! 👇\n#한국어발음왕 #발음챌린지`; const urlToShare = window.location.href; const shareData = { title: titleToShare, text: textToShare, url: urlToShare }; if (navigator.share) { try { navigator.share(shareData); } catch (err) { copyToClipboardFallback(titleToShare + "\n" + textToShare + "\n" + urlToShare); } } else { copyToClipboardFallback(titleToShare + "\n" + textToShare + "\n" + urlToShare); } }
    function copyToClipboardFallback(textToCopy) { navigator.clipboard.writeText(textToCopy).then(() => alert("게임 결과가 복사되었어요! SNS에 붙여넣고 자랑해보세요! 📋🎉")).catch(() => alert("앗! 결과 복사에 실패했어요. 😥")); }

    // --- ⭐⭐⭐ 버튼 누르는 약속(이벤트 리스너)은 여기서 한번에! ⭐⭐⭐ ---
    if (elements.startLevelPracticeButton) elements.startLevelPracticeButton.addEventListener('click', () => { currentGameMode = MODE_LEVEL_PRACTICE; showScreen('levelSelection'); });
    if (elements.startScoreAttackButton) elements.startScoreAttackButton.addEventListener('click', () => { currentGameMode = MODE_SCORE_ATTACK; currentWordList = [...wordLevels.level1, ...wordLevels.level2, ...wordLevels.level3].sort(() => Math.random() - 0.5); startGame(MODE_SCORE_ATTACK); });
    if (elements.showRankingButton) elements.showRankingButton.addEventListener('click', showLeaderboard);
    if (elements.startLevel1Button) elements.startLevel1Button.addEventListener('click', () => { currentWordList = wordLevels.level1; startGame(MODE_LEVEL_PRACTICE); });
    if (elements.startLevel2Button) elements.startLevel2Button.addEventListener('click', () => { currentWordList = wordLevels.level2; startGame(MODE_LEVEL_PRACTICE); });
    if (elements.startLevel3Button) elements.startLevel3Button.addEventListener('click', () => { currentWordList = wordLevels.level3; startGame(MODE_SCORE_ATTACK); }); // 레벨 3은 스코어어택 모드로!
    if (elements.backToModeButton) elements.backToModeButton.addEventListener('click', () => showScreen('modeSelection'));
    if (elements.backToModeFromRankingButton) elements.backToModeFromRankingButton.addEventListener('click', () => showScreen('modeSelection'));
    if (elements.restartGameButton) elements.restartGameButton.addEventListener('click', () => { if(currentGameMode) { if(currentGameMode === MODE_SCORE_ATTACK) currentWordList = [...wordLevels.level1, ...wordLevels.level2, ...wordLevels.level3].sort(() => Math.random() - 0.5); startGame(currentGameMode); } else { initializeGame(); } });
    if (elements.changeModeButton) changeModeButtonElement.addEventListener('click', () => initializeGame());
    if (elements.shareResultButton) elements.shareResultButton.addEventListener('click', shareGameResult);
    if (elements.saveScoreButton) elements.saveScoreButton.addEventListener('click', saveScore);
    
    // 페이지 처음 열릴 때 게임 초기화
    initializeGame();
});
