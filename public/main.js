document.addEventListener('DOMContentLoaded', () => {
    console.log("페이지 로딩 완료! main.js 시작! (레벨 선택 기능 부활 버전)");

    // HTML 요소들
    const wordDisplayElement = document.getElementById('word-to-practice');
    const listenButtonElement = document.getElementById('listen-button');
    const recordButtonElement = document.getElementById('record-button');
    const feedbackResultArea = document.getElementById('my-feedback');
    const loadingMessageElement = document.getElementById('loading-message');
    const wordTimerDisplayElement = document.getElementById('timer-display');
    const overallTimerDisplayElement = document.getElementById('overall-timer-display');
    const scoreBoardElement = document.getElementById('score-board');
    
    const modeSelectionAreaElement = document.getElementById('mode-selection-area');
    const levelSelectionAreaElement = document.getElementById('level-selection-area'); // ⭐ 레벨 선택 화면
    const gamePlayAreaElement = document.getElementById('game-play-area');
    const endGameAreaElement = document.getElementById('end-game-area');
    const leaderboardAreaElement = document.getElementById('leaderboard-area'); // ⭐ 순위표 화면

    const startHowManyButtonElement = document.getElementById('start-how-many-btn');
    const startScoreAttackButtonElement = document.getElementById('start-score-attack-btn'); // ⭐ 스코어 어택 버튼
    const startTimeAttackButtonElement = document.getElementById('start-time-attack-btn');
    const viewLeaderboardButtonElement = document.getElementById('view-leaderboard-btn'); // ⭐ 순위표 보기 버튼
    const startLevel1ButtonElement = document.getElementById('start-level-1-btn'); // ⭐ 레벨 1 버튼
    const startLevel2ButtonElement = document.getElementById('start-level-2-btn'); // ⭐ 레벨 2 버튼
    const startLevel3ButtonElement = document.getElementById('start-level-3-btn'); // ⭐ 레벨 3 버튼
    const backToModeButtonElement = document.getElementById('back-to-mode-btn');   // ⭐ 뒤로가기 버튼
    const backToModesButtonElement = document.getElementById('back-to-modes-btn'); // ⭐ 순위표에서 뒤로가기
    
    const restartGameButtonElement = document.getElementById('restart-game-btn');
    const changeModeButtonElement = document.getElementById('change-mode-btn');
    const finalMessageElement = document.getElementById('final-message');
    const finalScoreDisplayElement = document.getElementById('final-score-display');
    const shareResultButtonElement = document.getElementById('share-result-btn');
    
    // ⭐ 스코어 어택 관련 요소들
    const scoreAttackResultElement = document.getElementById('score-attack-result');
    const rankDisplayElement = document.getElementById('rank-display');
    const playerNameInputElement = document.getElementById('player-name-input');
    const saveScoreButtonElement = document.getElementById('save-score-btn');
    const leaderboardListElement = document.getElementById('leaderboard-list');

    // 레벨별 단어 목록
    const wordLevels = {
        level1: ["안녕하세요", "감사합니다", "이거 얼마예요?", "화장실 어디예요?", "닭갈비", "진짜 예쁘다", "다시 한번 말해주세요."],
        level2: ["민주주의의 의의", "책을 읊조리다", "흙을 밟다", "고려고 교복은 고급 교복이다.", "백화점 세일 마지막 날이라서 사람이 많아요.", "앞 집 팥죽은 붉은 팥 풋팥죽이다.", "저는 대한민국 서울특별시에 살고 있습니다."],
        level3: ["간장 공장 공장장은 강 공장장이고 된장 공장 공장장은 공 공장장이다.", "경찰청 철창살은 외철창살이냐 쌍철창살이냐.", "내가 그린 기린 그림은 잘 그린 기린 그림이다.", "한영양장점 옆 한양양장점.", "서울특별시 특허허가과 허가과장 허과장.", "저기 저 뜀틀이 내가 뛸 뜀틀인가 내가 안 뛸 뜀틀인가.", "챠프포프킨과 치스챠코프는 라흐마니노프의 피아노 콘체르토를 연주했다."]
    };
    
    // 게임 모드 및 상태 변수들
    const MODE_HOW_MANY = 'HOW_MANY'; const MODE_SCORE_ATTACK = 'SCORE_ATTACK'; const MODE_TIME_ATTACK = 'TIME_ATTACK';
    let currentGameMode = null; let currentWordList = [];
    let currentWordToPractice = ""; let currentWordIndex = 0; let wordsPassedCount = 0; let gameIsActive = false;
    let mediaRecorderTool; let recordedAudioChunks = []; let isCurrentlyRecording = false; let currentAudioStream = null;
    const WORD_TIMER_SECONDS = 15; let wordTimeLeftInSeconds = WORD_TIMER_SECONDS; let wordTimerInterval;
    const OVERALL_GAME_SECONDS = 60; let overallGameTimeLeftInSeconds = OVERALL_GAME_SECONDS; let overallGameTimerInterval;
    
    // ⭐ 스코어 어택 관련 변수들
    let leaderboardData = [];
    
    // --- 모든 함수 선언 ---

    function showScreen(screenToShow) {
        if (modeSelectionAreaElement) modeSelectionAreaElement.style.display = 'none';
        if (levelSelectionAreaElement) levelSelectionAreaElement.style.display = 'none';
        if (gamePlayAreaElement) gamePlayAreaElement.style.display = 'none';
        if (endGameAreaElement) endGameAreaElement.style.display = 'none';
        if (leaderboardAreaElement) leaderboardAreaElement.style.display = 'none';

        if (screenToShow === 'modeSelection') modeSelectionAreaElement.style.display = 'block';
        else if (screenToShow === 'levelSelection') levelSelectionAreaElement.style.display = 'block';
        else if (screenToShow === 'gamePlay') gamePlayAreaElement.style.display = 'block';
        else if (screenToShow === 'endGame') endGameAreaElement.style.display = 'block';
        else if (screenToShow === 'leaderboard') leaderboardAreaElement.style.display = 'block';
    }

    // ⭐ 순위표 관련 함수들
    function loadLeaderboard() {
        const saved = localStorage.getItem('koreanGameLeaderboard');
        leaderboardData = saved ? JSON.parse(saved) : [];
        leaderboardData.sort((a, b) => b.score - a.score); // 점수 높은 순으로 정렬
    }
    
    function saveLeaderboard() {
        localStorage.setItem('koreanGameLeaderboard', JSON.stringify(leaderboardData));
    }
    
    function addScoreToLeaderboard(name, score) {
        const newScore = {
            name: name,
            score: score,
            date: new Date().toLocaleDateString('ko-KR'),
            timestamp: Date.now()
        };
        leaderboardData.push(newScore);
        leaderboardData.sort((a, b) => b.score - a.score); // 점수 높은 순으로 정렬
        saveLeaderboard();
    }
    
    function getRank(score) {
        const higherScores = leaderboardData.filter(entry => entry.score > score).length;
        return higherScores + 1;
    }
    
    function displayLeaderboard() {
        if (!leaderboardListElement) return;
        
        let html = '<div class="leaderboard-table">';
        html += '<div class="leaderboard-header"><span>순위</span><span>이름</span><span>점수</span><span>날짜</span></div>';
        
        leaderboardData.slice(0, 10).forEach((entry, index) => {
            const rank = index + 1;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
            html += `<div class="leaderboard-row">
                <span>${medal} ${rank}</span>
                <span>${entry.name}</span>
                <span>${entry.score}개</span>
                <span>${entry.date}</span>
            </div>`;
        });
        
        if (leaderboardData.length === 0) {
            html += '<div class="leaderboard-empty">아직 기록이 없어요! 첫 번째 기록을 만들어보세요! 🏆</div>';
        }
        
        html += '</div>';
        leaderboardListElement.innerHTML = html;
    }

    // (이하 모든 함수 내용은 이전과 동일합니다. 맨 마지막 버튼 연결 부분만 수정됩니다.)
    function updateScoreBoard() { 
        if(!scoreBoardElement) return; 
        if (currentGameMode === MODE_TIME_ATTACK) { 
            scoreBoardElement.textContent = `성공: ${wordsPassedCount}개`; 
        } else if (currentGameMode === MODE_SCORE_ATTACK) {
            scoreBoardElement.textContent = `성공: ${wordsPassedCount}개`;
        } else { 
            scoreBoardElement.textContent = `통과: ${wordsPassedCount}개 / 총 ${currentWordList.length}개`; 
        } 
    }
    function stopAllTimers() { clearInterval(wordTimerInterval); clearInterval(overallGameTimerInterval); }
    function stopWordTimer() { clearInterval(wordTimerInterval); }
    function stopOverallGameTimer() { clearInterval(overallGameTimerInterval); }
    function resetWordTimerDisplay(){ if (wordTimerDisplayElement) { wordTimerDisplayElement.textContent = `단어 시간: ${WORD_TIMER_SECONDS}초`; wordTimerDisplayElement.style.color = '#c0392b'; } }
    function resetOverallGameTimerDisplay(){ if (overallTimerDisplayElement) { overallTimerDisplayElement.textContent = `전체 시간: ${OVERALL_GAME_SECONDS}초`; overallTimerDisplayElement.style.color = '#e67e22'; } }
    function resetWordTimer() { wordTimeLeftInSeconds = WORD_TIMER_SECONDS; resetWordTimerDisplay(); }
    function resetOverallGameTimer() { overallGameTimeLeftInSeconds = OVERALL_GAME_SECONDS; resetOverallGameTimerDisplay(); }
    function startWordTimer() { if ((currentGameMode !== MODE_HOW_MANY && currentGameMode !== MODE_SCORE_ATTACK) || !gameIsActive) return; stopWordTimer(); wordTimerInterval = setInterval(() => { if (!gameIsActive) { stopWordTimer(); return; } wordTimeLeftInSeconds--; if (wordTimerDisplayElement) wordTimerDisplayElement.textContent = `단어 시간: ${wordTimeLeftInSeconds}초`; if (wordTimeLeftInSeconds <= 0) handleWordFailureByTimeOut(); else if (wordTimeLeftInSeconds <= 5 && wordTimerDisplayElement) wordTimerDisplayElement.style.color = 'orange'; }, 1000); }
    function startOverallGameTimer() { if (currentGameMode !== MODE_TIME_ATTACK || !gameIsActive) return; stopOverallGameTimer(); overallGameTimerInterval = setInterval(() => { if (!gameIsActive) { stopOverallGameTimer(); return; } overallGameTimeLeftInSeconds--; if (overallTimerDisplayElement) overallTimerDisplayElement.textContent = `전체 시간: ${overallGameTimeLeftInSeconds}초`; if (overallGameTimeLeftInSeconds <= 0) handleOverallTimeUp(); else if (overallGameTimeLeftInSeconds <= 10 && overallTimerDisplayElement) overallTimerDisplayElement.style.color = '#e74c3c'; }, 1000); }
    function presentNextWord() { if (!gameIsActive) return; if (currentWordIndex >= currentWordList.length) { if (currentGameMode === MODE_HOW_MANY) { handleGameClear(); return; } if (currentGameMode === MODE_SCORE_ATTACK) { currentWordIndex = 0; } if (currentGameMode === MODE_TIME_ATTACK) { currentWordIndex = 0; } } currentWordToPractice = currentWordList[currentWordIndex]; if (wordDisplayElement) wordDisplayElement.textContent = currentWordToPractice; if (feedbackResultArea) feedbackResultArea.innerHTML = "<p>발음해보세요!</p>"; if (recordButtonElement) { recordButtonElement.textContent = '🔴 녹음 시작'; recordButtonElement.disabled = false; recordButtonElement.classList.remove('recording');} isCurrentlyRecording = false; if (currentGameMode === MODE_HOW_MANY || currentGameMode === MODE_SCORE_ATTACK) { stopWordTimer(); resetWordTimer(); startWordTimer(); } }
    function handleWordFailureByTimeOut() {  if ((currentGameMode !== MODE_HOW_MANY && currentGameMode !== MODE_SCORE_ATTACK) || !gameIsActive) return; stopWordTimer(); if (isCurrentlyRecording && mediaRecorderTool && mediaRecorderTool.state === 'recording') { isCurrentlyRecording = false; mediaRecorderTool.stop(); } else { isCurrentlyRecording = false; } if(feedbackResultArea) feedbackResultArea.innerHTML = `<p style="color: red; font-weight: bold;">단어 시간 초과! ⏰</p>`; if (wordTimerDisplayElement) wordTimerDisplayElement.textContent = `시간 끝!`; handleGameOver('wordTimeout_HowMany'); }
    function handleWordSuccess() { if (currentGameMode === MODE_HOW_MANY || currentGameMode === MODE_SCORE_ATTACK) stopWordTimer(); wordsPassedCount++; updateScoreBoard(); currentWordIndex++; if(feedbackResultArea) feedbackResultArea.innerHTML = `<p style="color: green; font-weight: bold;">성공! 🎉</p>`; if ((currentGameMode === MODE_HOW_MANY || currentGameMode === MODE_SCORE_ATTACK) && wordTimerDisplayElement) wordTimerDisplayElement.style.color = 'green'; if(recordButtonElement) recordButtonElement.disabled = true; setTimeout(() => { if (gameIsActive && (currentGameMode === MODE_HOW_MANY || currentGameMode === MODE_SCORE_ATTACK || overallGameTimeLeftInSeconds > 0)) presentNextWord(); else if (gameIsActive && currentGameMode === MODE_TIME_ATTACK && overallGameTimeLeftInSeconds <= 0) handleOverallTimeUp(); }, 1000); }
    function handleGameOver(reason) { gameIsActive = false; stopAllTimers(); if(finalMessageElement) finalMessageElement.textContent = "GAME OVER! 😭"; if(finalScoreDisplayElement) finalScoreDisplayElement.textContent = `총 ${wordsPassedCount}개의 단어를 통과했어요!`; if(shareResultButtonElement) shareResultButtonElement.style.display = 'inline-block'; showScreen('endGame'); if(recordButtonElement) recordButtonElement.disabled = true; if(listenButtonElement) listenButtonElement.disabled = true; }
    function handleGameClear() { gameIsActive = false; stopAllTimers(); if(finalMessageElement) finalMessageElement.textContent = "🎉 모든 단어 통과! 🎉"; if(finalScoreDisplayElement) finalScoreDisplayElement.textContent = `정말 대단해요! ${wordsPassedCount}개를 완벽하게 해냈어요!`; if(shareResultButtonElement) shareResultButtonElement.style.display = 'inline-block'; showScreen('endGame'); if(recordButtonElement) recordButtonElement.disabled = true; if(listenButtonElement) listenButtonElement.disabled = true; }
    function handleOverallTimeUp() { if (currentGameMode !== MODE_TIME_ATTACK || !gameIsActive) return; gameIsActive = false; stopAllTimers(); if(finalMessageElement) finalMessageElement.textContent = "⏱️ 타임어택 종료! ⏱️"; if(finalScoreDisplayElement) finalScoreDisplayElement.textContent = `총 ${wordsPassedCount}개의 단어를 성공했어요!`; if(shareResultButtonElement) shareResultButtonElement.style.display = 'inline-block'; showScreen('endGame'); if(recordButtonElement) recordButtonElement.disabled = true; if(listenButtonElement) listenButtonElement.disabled = true; }
    
    // ⭐ 스코어 어택 게임 종료 처리
    function handleScoreAttackEnd() {
        gameIsActive = false;
        stopAllTimers();
        
        if(finalMessageElement) finalMessageElement.textContent = "🏆 스코어 어택 완료! 🏆";
        if(finalScoreDisplayElement) finalScoreDisplayElement.textContent = `총 ${wordsPassedCount}개의 단어를 성공했어요!`;
        
        // 순위 계산 및 표시
        const rank = getRank(wordsPassedCount);
        if(rankDisplayElement) {
            rankDisplayElement.textContent = `순위: ${rank}위`;
            if(rank <= 3) {
                rankDisplayElement.innerHTML = `순위: ${rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'} ${rank}위`;
            }
        }
        
        // 스코어 어택 결과 영역 표시
        if(scoreAttackResultElement) scoreAttackResultElement.style.display = 'block';
        if(playerNameInputElement) playerNameInputElement.style.display = 'inline-block';
        if(saveScoreButtonElement) saveScoreButtonElement.style.display = 'inline-block';
        
        if(shareResultButtonElement) shareResultButtonElement.style.display = 'inline-block';
        showScreen('endGame');
        if(recordButtonElement) recordButtonElement.disabled = true;
        if(listenButtonElement) listenButtonElement.disabled = true;
    }
    
    function startGame(mode) { 
        console.log(`게임 시작! 모드: ${mode}`); 
        currentGameMode = mode; 
        gameIsActive = true; 
        wordsPassedCount = 0; 
        currentWordIndex = 0; 
        updateScoreBoard(); 
        if (currentGameMode === MODE_TIME_ATTACK) { 
            if (overallTimerDisplayElement) overallTimerDisplayElement.style.display = 'block'; 
            if (wordTimerDisplayElement) wordTimerDisplayElement.style.display = 'none'; 
            resetOverallGameTimer(); 
            startOverallGameTimer(); 
        } else { 
            if (overallTimerDisplayElement) overallTimerDisplayElement.style.display = 'none'; 
            if (wordTimerDisplayElement) wordTimerDisplayElement.style.display = 'block'; 
            resetWordTimer(); 
        } 
        showScreen('gamePlay'); 
        if (listenButtonElement) listenButtonElement.disabled = false; 
        if (recordButtonElement) recordButtonElement.disabled = false; 
        isCurrentlyRecording = false; 
        if(loadingMessageElement) loadingMessageElement.style.display = 'none'; 
        presentNextWord(); 
    }
    function initializeGame() { 
        console.log("🔄 게임 초기화!"); 
        gameIsActive = false; 
        stopAllTimers(); 
        currentWordIndex = 0; 
        wordsPassedCount = 0; 
        currentGameMode = null; 
        currentWordList = []; 
        updateScoreBoard(); 
        if(wordDisplayElement) wordDisplayElement.textContent = "게임 모드를 선택해주세요!"; 
        if(feedbackResultArea) feedbackResultArea.innerHTML = "<p>어떤 모드로 도전할까요?</p>"; 
        resetWordTimerDisplay(); 
        resetOverallGameTimerDisplay(); 
        if (listenButtonElement) listenButtonElement.disabled = true; 
        if (recordButtonElement) { 
            recordButtonElement.disabled = true; 
            recordButtonElement.textContent = '🔴 녹음 시작'; 
            recordButtonElement.classList.remove('recording');
        } 
        if (restartGameButtonElement) restartGameButtonElement.style.display = 'none'; 
        if (changeModeButtonElement) changeModeButtonElement.style.display = 'none'; 
        if (shareResultButtonElement) shareResultButtonElement.style.display = 'none'; 
        if (loadingMessageElement) loadingMessageElement.style.display = 'none'; 
        
        // ⭐ 스코어 어택 결과 영역 숨기기
        if(scoreAttackResultElement) scoreAttackResultElement.style.display = 'none';
        if(playerNameInputElement) playerNameInputElement.style.display = 'none';
        if(saveScoreButtonElement) saveScoreButtonElement.style.display = 'none';
        
        showScreen('modeSelection'); 
    }
    async function sendVoiceToRobotForGrading(voiceAudioBlob) { if (!gameIsActive) return; if(loadingMessageElement) loadingMessageElement.style.display = 'block'; if(feedbackResultArea) feedbackResultArea.innerHTML = ""; if (currentGameMode === MODE_HOW_MANY || currentGameMode === MODE_SCORE_ATTACK) stopWordTimer(); const mailForm = new FormData(); mailForm.append('userAudio', voiceAudioBlob, 'my_voice_recording.webm'); mailForm.append('koreanWord', currentWordToPractice); try { const responseFromServer = await fetch('/assess-my-voice', { method: 'POST', body: mailForm }); if(loadingMessageElement) loadingMessageElement.style.display = 'none'; if (!gameIsActive) return; const resultFromServer = await responseFromServer.json(); if (!responseFromServer.ok) throw new Error(resultFromServer.errorMessage || '로봇 응답 이상'); handleRobotResponse(resultFromServer); } catch (error) { if (!gameIsActive) return; if(loadingMessageElement) loadingMessageElement.style.display = 'none'; console.error('서버 통신 오류:', error); if(feedbackResultArea) feedbackResultArea.innerHTML = `<p style="color: red;">앗! 문제 발생: ${error.message}</p>`; let canRetry = (currentGameMode === MODE_HOW_MANY && wordTimeLeftInSeconds > 0) || (currentGameMode === MODE_SCORE_ATTACK && wordTimeLeftInSeconds > 0) || (currentGameMode === MODE_TIME_ATTACK && overallGameTimeLeftInSeconds > 0); if (canRetry) { if(recordButtonElement) { recordButtonElement.textContent = '🔴 녹음 시작'; recordButtonElement.disabled = false; recordButtonElement.classList.remove('recording');} if (currentGameMode === MODE_HOW_MANY || currentGameMode === MODE_SCORE_ATTACK) startWordTimer(); } else if (gameIsActive) { if(currentGameMode === MODE_HOW_MANY) handleGameOver('serverError'); else if(currentGameMode === MODE_SCORE_ATTACK) handleScoreAttackEnd(); else if(currentGameMode === MODE_TIME_ATTACK) handleOverallTimeUp(); } } }
    function handleRobotResponse(resultFromServer) { if (!gameIsActive) return; if (!resultFromServer.success) { if(feedbackResultArea) feedbackResultArea.innerHTML = `<p style="color: red;">${resultFromServer.errorMessage || '결과 못 받음'}</p>`; let canRetry = (currentGameMode === MODE_HOW_MANY && wordTimeLeftInSeconds > 0) || (currentGameMode === MODE_SCORE_ATTACK && wordTimeLeftInSeconds > 0) || (currentGameMode === MODE_TIME_ATTACK && overallGameTimeLeftInSeconds > 0); if (canRetry) { if(recordButtonElement) { recordButtonElement.textContent = '🔴 녹음 시작'; recordButtonElement.disabled = false; recordButtonElement.classList.remove('recording');} if (currentGameMode === MODE_HOW_MANY || currentGameMode === MODE_SCORE_ATTACK) startWordTimer(); } else if (gameIsActive) { if(currentGameMode === MODE_HOW_MANY) handleGameOver('robotError'); else if(currentGameMode === MODE_SCORE_ATTACK) handleScoreAttackEnd(); else if(currentGameMode === MODE_TIME_ATTACK) handleOverallTimeUp(); } return; } const isCorrectAnswer = resultFromServer.feedbackMessage.includes("정확해요!"); if (isCorrectAnswer) handleWordSuccess(); else { if(feedbackResultArea) feedbackResultArea.innerHTML = `<p style="color: orange;">${resultFromServer.feedbackMessage}</p>`; let canRetry = (currentGameMode === MODE_HOW_MANY && wordTimeLeftInSeconds > 0) || (currentGameMode === MODE_SCORE_ATTACK && wordTimeLeftInSeconds > 0) || (currentGameMode === MODE_TIME_ATTACK && overallGameTimeLeftInSeconds > 0); if (canRetry) { if(recordButtonElement) { recordButtonElement.textContent = '🔴 녹음 시작'; recordButtonElement.disabled = false; recordButtonElement.classList.remove('recording');} if (currentGameMode === MODE_HOW_MANY || currentGameMode === MODE_SCORE_ATTACK) startWordTimer(); } else if (gameIsActive) { if(currentGameMode === MODE_HOW_MANY) handleGameOver('incorrect'); else if(currentGameMode === MODE_SCORE_ATTACK) handleScoreAttackEnd(); else if(currentGameMode === MODE_TIME_ATTACK) handleOverallTimeUp(); } } }
    function shareGameResult() { if (!finalMessageElement || !finalScoreDisplayElement) return; let gameModeText = ""; if (currentGameMode === MODE_HOW_MANY) gameModeText = "📚 레벨별 발음연습"; else if (currentGameMode === MODE_SCORE_ATTACK) gameModeText = "🏆 스코어 어택"; else if (currentGameMode === MODE_TIME_ATTACK) gameModeText = "⏱️ 60초 타임어택!"; const titleToShare = "✨ 한국어 발음왕 도전! 내 결과 좀 봐! ✨"; const textToShare = `모드: ${gameModeText}\n결과: ${finalMessageElement.textContent}\n${finalScoreDisplayElement.textContent}\n\n같이 도전해봐! 👇\n#한국어발음왕 #발음챌린지`; const urlToShare = window.location.href; const shareData = { title: titleToShare, text: textToShare, url: urlToShare, }; if (navigator.share) { try { navigator.share(shareData); } catch (err) { copyToClipboardFallback(titleToShare + "\n" + textToShare + "\n" + urlToShare); } } else { copyToClipboardFallback(titleToShare + "\n" + textToShare + "\n" + urlToShare); } }
    function copyToClipboardFallback(textToCopy) { navigator.clipboard.writeText(textToCopy).then(() => alert("게임 결과가 복사되었어요! SNS에 붙여넣고 자랑해보세요! 📋🎉")).catch(err => alert("앗! 결과 복사에 실패했어요. 😥")); }
    if (listenButtonElement) { listenButtonElement.addEventListener('click', () => { if (!gameIsActive || !currentWordToPractice) return; if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(currentWordToPractice); utterance.lang = 'ko-KR'; utterance.rate = 0.85; utterance.pitch = 1; let voices = window.speechSynthesis.getVoices(); let koreanVoice = voices.find(voice => voice.lang === 'ko-KR'); if (koreanVoice) utterance.voice = koreanVoice; utterance.onerror = (event) => { console.error("SpeechSynthesis Error:", event.error);}; window.speechSynthesis.speak(utterance); } else alert("이 브라우저에서는 음성 합성을 지원하지 않습니다."); }); }
    if (recordButtonElement) { recordButtonElement.addEventListener('click', async () => { if (recordButtonElement.disabled || !gameIsActive) return; if (currentGameMode === MODE_TIME_ATTACK && overallGameTimeLeftInSeconds <= 0) return; if ((currentGameMode === MODE_HOW_MANY || currentGameMode === MODE_SCORE_ATTACK) && wordTimeLeftInSeconds <= 0) return; if (!isCurrentlyRecording) { try { currentAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true }); mediaRecorderTool = new MediaRecorder(currentAudioStream, { mimeType: 'audio/webm;codecs=opus' }); recordedAudioChunks = []; mediaRecorderTool.addEventListener('dataavailable', event => { if (event.data.size > 0) recordedAudioChunks.push(event.data); }); mediaRecorderTool.addEventListener('stop', () => { if (currentAudioStream) { currentAudioStream.getTracks().forEach(track => track.stop()); currentAudioStream = null; } const completeAudioBlob = new Blob(recordedAudioChunks, { type: mediaRecorderTool.mimeType }); let canSend = (currentGameMode === MODE_HOW_MANY && wordTimeLeftInSeconds > 0) || (currentGameMode === MODE_SCORE_ATTACK && wordTimeLeftInSeconds > 0) || (currentGameMode === MODE_TIME_ATTACK && overallGameTimeLeftInSeconds > 0); if (gameIsActive && canSend && completeAudioBlob.size > 0) sendVoiceToRobotForGrading(completeAudioBlob); else if (gameIsActive && canSend && completeAudioBlob.size === 0) { if(feedbackResultArea) feedbackResultArea.innerHTML = "<p>앗! 녹음된 목소리가 없어요.</p>"; if (canSend) { recordButtonElement.textContent = '🔴 녹음 시작'; recordButtonElement.disabled = false; recordButtonElement.classList.remove('recording'); isCurrentlyRecording = false; if (currentGameMode === MODE_HOW_MANY || currentGameMode === MODE_SCORE_ATTACK) startWordTimer(); } } }); mediaRecorderTool.start(); recordButtonElement.textContent = '⏹️ 녹음 중지'; recordButtonElement.classList.add('recording'); if(feedbackResultArea) feedbackResultArea.innerHTML = "<p>지금 말해보세요...🎙️</p>"; isCurrentlyRecording = true; } catch (error) { console.error("마이크 오류:", error); alert("마이크 사용 불가!"); if(feedbackResultArea) feedbackResultArea.innerHTML = "<p>마이크 사용 불가 😭</p>"; recordButtonElement.textContent = '🔴 녹음 시작'; recordButtonElement.classList.remove('recording'); isCurrentlyRecording = false;} } else { if (mediaRecorderTool && mediaRecorderTool.state === 'recording') { if (currentGameMode === MODE_HOW_MANY || currentGameMode === MODE_SCORE_ATTACK) stopWordTimer(); isCurrentlyRecording = false; mediaRecorderTool.stop(); } recordButtonElement.textContent = '잠시만요...'; recordButtonElement.disabled = true; } }); }

    // --- ⭐⭐⭐ 버튼 누르는 약속(이벤트 리스너)은 여기서 한번에! ⭐⭐⭐ ---
    if (startHowManyButtonElement) {
        startHowManyButtonElement.addEventListener('click', () => {
            currentGameMode = MODE_HOW_MANY;
            showScreen('levelSelection'); // "레벨별 발음연습"은 레벨 선택 화면으로!
        });
    }
    if (startScoreAttackButtonElement) {
        startScoreAttackButtonElement.addEventListener('click', () => {
            // 스코어 어택은 모든 레벨 단어를 섞어서 바로 시작!
            currentWordList = [...wordLevels.level1, ...wordLevels.level2, ...wordLevels.level3];
            currentWordList.sort(() => Math.random() - 0.5); // 단어 순서 섞기!
            startGame(MODE_SCORE_ATTACK);
        });
    }
    if (startTimeAttackButtonElement) {
        startTimeAttackButtonElement.addEventListener('click', () => {
            // 타임어택은 모든 레벨 단어를 섞어서 바로 시작!
            currentWordList = [...wordLevels.level1, ...wordLevels.level2, ...wordLevels.level3];
            currentWordList.sort(() => Math.random() - 0.5); // 단어 순서 섞기!
            startGame(MODE_TIME_ATTACK);
        });
    }
    if (viewLeaderboardButtonElement) {
        viewLeaderboardButtonElement.addEventListener('click', () => {
            displayLeaderboard();
            showScreen('leaderboard');
        });
    }
    // 레벨 버튼들에 대한 약속
    if (startLevel1ButtonElement) startLevel1ButtonElement.addEventListener('click', () => { currentWordList = wordLevels.level1; startGame(MODE_HOW_MANY); });
    if (startLevel2ButtonElement) startLevel2ButtonElement.addEventListener('click', () => { currentWordList = wordLevels.level2; startGame(MODE_HOW_MANY); });
    if (startLevel3ButtonElement) startLevel3ButtonElement.addEventListener('click', () => { currentWordList = wordLevels.level3; startGame(MODE_HOW_MANY); });
    if (backToModeButtonElement) backToModeButtonElement.addEventListener('click', () => showScreen('modeSelection'));
    if (backToModesButtonElement) backToModesButtonElement.addEventListener('click', () => showScreen('modeSelection'));
    
    // ⭐ 스코어 저장 버튼
    if (saveScoreButtonElement) {
        saveScoreButtonElement.addEventListener('click', () => {
            const playerName = playerNameInputElement ? playerNameInputElement.value.trim() : '';
            if (!playerName) {
                alert('이름을 입력해주세요!');
                return;
            }
            
            addScoreToLeaderboard(playerName, wordsPassedCount);
            alert(`기록이 저장되었어요! 🎉\n${playerName}님의 점수: ${wordsPassedCount}개`);
            
            // 입력 필드 초기화
            if(playerNameInputElement) playerNameInputElement.value = '';
            if(playerNameInputElement) playerNameInputElement.style.display = 'none';
            if(saveScoreButtonElement) saveScoreButtonElement.style.display = 'none';
        });
    }
    
    // 게임 종료 후 버튼들에 대한 약속
    if (restartGameButtonElement) restartGameButtonElement.addEventListener('click', () => {
        if(currentGameMode === MODE_TIME_ATTACK){ // 타임어택 재시작
            currentWordList = [...wordLevels.level1, ...wordLevels.level2, ...wordLevels.level3];
            currentWordList.sort(() => Math.random() - 0.5);
            startGame(MODE_TIME_ATTACK);
        } else if (currentGameMode === MODE_SCORE_ATTACK) { // 스코어 어택 재시작
            currentWordList = [...wordLevels.level1, ...wordLevels.level2, ...wordLevels.level3];
            currentWordList.sort(() => Math.random() - 0.5);
            startGame(MODE_SCORE_ATTACK);
        } else if (currentGameMode === MODE_HOW_MANY) { // 레벨별 발음연습 재시작
            // 실패했던 그 레벨(currentWordList) 그대로 다시 시작
            startGame(MODE_HOW_MANY);
        } else {
            initializeGame(); 
        }
    });
    if (changeModeButtonElement) changeModeButtonElement.addEventListener('click', () => initializeGame());
    if (shareResultButtonElement) shareResultButtonElement.addEventListener('click', shareGameResult);
    
    // 페이지 처음 열릴 때 게임 초기화하고 모드 선택 화면 보여주기
    loadLeaderboard(); // ⭐ 순위표 데이터 로드
    initializeGame();
});
