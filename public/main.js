document.addEventListener('DOMContentLoaded', () => {
    console.log("페이지 로딩 완료! main.js 시작! (타임어택 단어 타이머 제거 버전)");

    // HTML 요소들
    const wordDisplayElement = document.getElementById('word-to-practice');
    const listenButtonElement = document.getElementById('listen-button');
    const recordButtonElement = document.getElementById('record-button');
    const feedbackResultArea = document.getElementById('my-feedback');
    const loadingMessageElement = document.getElementById('loading-message');
    const wordTimerDisplayElement = document.getElementById('timer-display'); // 단어별 타이머
    const overallTimerDisplayElement = document.getElementById('overall-timer-display'); // 전체 타이머 (타임어택용)
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

    const koreanWords = [
        "강아지", "고양이", "안녕하세요", "감사합니다", "학교", "사랑해요", "괜찮아요",
        "바나나", "딸기", "컴퓨터", "맛있어요", "대한민국", "화이팅", "축구",
        "사과", "오렌지", "포도", "수박", "가족", "친구", "행복", "즐거움",
        "한영양장점 옆 한양양장점 한양양장점 옆 한영양장점", "경찰청 철창살은 외철창살이냐 쌍철창살이냐"
    ];

    const MODE_HOW_MANY = 'HOW_MANY';
    const MODE_TIME_ATTACK = 'TIME_ATTACK';

    let currentGameMode = null;
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

    function showScreen(screenToShow) {
        modeSelectionAreaElement.style.display = 'none';
        gamePlayAreaElement.style.display = 'none';
        endGameAreaElement.style.display = 'none';
        if (screenToShow === 'modeSelection') modeSelectionAreaElement.style.display = 'block';
        else if (screenToShow === 'gamePlay') gamePlayAreaElement.style.display = 'block';
        else if (screenToShow === 'endGame') endGameAreaElement.style.display = 'block';
    }

    function initializeAndStartGame(mode) {
        console.log(`게임 초기화 및 시작! 모드: ${mode}`);
        currentGameMode = mode;
        gameIsActive = true;
        currentWordIndex = 0;
        wordsPassedCount = 0;
        updateScoreBoard();

        if (currentGameMode === MODE_TIME_ATTACK) {
            overallTimerDisplayElement.style.display = 'block'; // 전체 타이머 보이기
            wordTimerDisplayElement.style.display = 'none';   // ⭐ 타임어택 모드에서는 단어별 타이머 숨기기! ⭐
            resetOverallGameTimer();
            startOverallGameTimer();
            scoreBoardElement.textContent = `성공한 단어: ${wordsPassedCount}개`;
        } else { // MODE_HOW_MANY
            overallTimerDisplayElement.style.display = 'none';  // 전체 타이머 숨기기
            wordTimerDisplayElement.style.display = 'block';  // ⭐ 단어별 타이머 보이기! ⭐
            resetWordTimer(); // 단어 타이머 초기화
            scoreBoardElement.textContent = `통과한 단어: ${wordsPassedCount}개 / 총 ${koreanWords.length}개`;
        }
        
        showScreen('gamePlay');
        listenButtonElement.disabled = false;
        recordButtonElement.disabled = false;
        recordButtonElement.textContent = '🔴 녹음 시작';
        recordButtonElement.classList.remove('recording');
        isCurrentlyRecording = false;
        loadingMessageElement.style.display = 'none';
        presentNextWord();
    }

    function presentNextWord() {
        if (!gameIsActive) return;
        console.log(`다음 단어 준비 (현재 인덱스: ${currentWordIndex}, 통과: ${wordsPassedCount})`);

        if (currentGameMode === MODE_HOW_MANY && currentWordIndex >= koreanWords.length) {
            handleGameClear(); return;
        }
        if (currentGameMode === MODE_TIME_ATTACK && currentWordIndex >= koreanWords.length) {
            console.log("타임어택: 단어 목록 한 바퀴 완료! 처음부터 다시 시작합니다.");
            currentWordIndex = 0; 
        }

        currentWordToPractice = koreanWords[currentWordIndex];
        wordDisplayElement.textContent = currentWordToPractice;
        feedbackResultArea.innerHTML = "<p>발음해보세요!</p>";
        recordButtonElement.textContent = '🔴 녹음 시작';
        recordButtonElement.disabled = false; 
        recordButtonElement.classList.remove('recording');
        isCurrentlyRecording = false; 
        
        if (currentGameMode === MODE_HOW_MANY) { // "얼마나 많이" 모드일 때만 단어 타이머 작동!
            stopWordTimer(); 
            resetWordTimer(); 
            startWordTimer(); 
        }
    }

    // --- 단어별 타이머 함수들 (MODE_HOW_MANY 에서만 사용) ---
    function stopWordTimer() { clearInterval(wordTimerInterval); }
    function resetWordTimer() {
        wordTimeLeftInSeconds = WORD_TIMER_SECONDS;
        if (wordTimerDisplayElement) {
            wordTimerDisplayElement.textContent = `단어 시간: ${wordTimeLeftInSeconds}초`;
            wordTimerDisplayElement.style.color = '#c0392b';
        }
    }
    function startWordTimer() {
        if (currentGameMode !== MODE_HOW_MANY) return; // 타임어택 모드면 시작 안 함!
        stopWordTimer(); 
        console.log("단어별 타이머 시작!");
        wordTimerInterval = setInterval(() => {
            if (!gameIsActive) { stopWordTimer(); return; }
            wordTimeLeftInSeconds--;
            if (wordTimerDisplayElement) {
                wordTimerDisplayElement.textContent = `단어 시간: ${wordTimeLeftInSeconds}초`;
            }
            if (wordTimeLeftInSeconds <= 0) {
                handleWordFailureByTimeOut(); 
            } else if (wordTimeLeftInSeconds <= 5 && wordTimerDisplayElement) {
                wordTimerDisplayElement.style.color = 'orange';
            } else if (wordTimeLeftInSeconds > 5 && wordTimerDisplayElement) {
                 wordTimerDisplayElement.style.color = '#c0392b';
            }
        }, 1000);
    }

    // --- 전체 게임 타이머 함수들 (타임어택용) ---
    function stopOverallGameTimer() { clearInterval(overallGameTimerInterval); }
    function resetOverallGameTimer() {
        overallGameTimeLeftInSeconds = OVERALL_GAME_SECONDS;
        if (overallTimerDisplayElement) {
            overallTimerDisplayElement.textContent = `전체 시간: ${overallGameTimeLeftInSeconds}초`;
            overallTimerDisplayElement.style.color = '#e67e22';
        }
    }
    function startOverallGameTimer() {
        if (currentGameMode !== MODE_TIME_ATTACK) return; // "얼마나 많이" 모드면 시작 안 함!
        stopOverallGameTimer();
        console.log("전체 게임 타이머 시작!");
        overallGameTimerInterval = setInterval(() => {
            if (!gameIsActive) { stopOverallGameTimer(); return; }
            overallGameTimeLeftInSeconds--;
            if (overallTimerDisplayElement) {
                overallTimerDisplayElement.textContent = `전체 시간: ${overallGameTimeLeftInSeconds}초`;
            }
            if (overallGameTimeLeftInSeconds <= 0) {
                handleOverallTimeUp(); 
            } else if (overallGameTimeLeftInSeconds <= 10 && overallTimerDisplayElement) {
                overallTimerDisplayElement.style.color = '#e74c3c';
            }
        }, 1000);
    }
    
    // --- 단어 실패/성공 및 게임 종료 처리 ---
    function handleWordFailureByTimeOut() { // 단어별 15초 타이머 만료 (MODE_HOW_MANY 전용)
        if (currentGameMode !== MODE_HOW_MANY || !gameIsActive) return; // 이 함수는 "얼마나 많이" 모드 전용!
        console.log(`단어 "${currentWordToPractice}" 시간 초과로 실패! (얼마나 많이 모드)`);
        stopWordTimer();
        if (isCurrentlyRecording && mediaRecorderTool && mediaRecorderTool.state === 'recording') {
            isCurrentlyRecording = false; mediaRecorderTool.stop();
        } else { isCurrentlyRecording = false; }

        feedbackResultArea.innerHTML = `<p style="color: red; font-weight: bold;">단어 시간 초과! ⏰</p>`;
        if (wordTimerDisplayElement) wordTimerDisplayElement.textContent = `시간 끝!`;
        handleGameOver('wordTimeout_HowMany'); // "얼마나 많이" 모드에서는 바로 게임 오버
    }
    
    function handleWordSuccess() {
        console.log(`단어 "${currentWordToPractice}" 성공!`);
        if (currentGameMode === MODE_HOW_MANY) { // "얼마나 많이" 모드에서는 단어 타이머 멈춤
            stopWordTimer();
        }
        wordsPassedCount++;
        updateScoreBoard();
        currentWordIndex++;

        feedbackResultArea.innerHTML = `<p style="color: green; font-weight: bold;">성공! 🎉</p>`;
        if (currentGameMode === MODE_HOW_MANY && wordTimerDisplayElement) {
             wordTimerDisplayElement.style.color = 'green';
        }
        
        recordButtonElement.disabled = true;
        setTimeout(() => {
            // 전체 시간이 다 됐으면 다음 단어 안 함 (타임어택)
            if (gameIsActive && (currentGameMode === MODE_HOW_MANY || overallGameTimeLeftInSeconds > 0)) {
                 presentNextWord();
            } else if (gameIsActive && currentGameMode === MODE_TIME_ATTACK && overallGameTimeLeftInSeconds <= 0) {
                handleOverallTimeUp(); // 혹시 성공 직후 전체 시간 종료?
            }
        }, 1000);
    }

    function handleGameOver(reason) { // "얼마나 많이 통과?" 모드용 게임 오버
        console.log(`게임 오버! (얼마나 많이 모드) 이유: ${reason}`);
        gameIsActive = false;
        stopWordTimer();
        
        finalMessageElement.textContent = "GAME OVER! 😭";
        finalScoreDisplayElement.textContent = `총 ${wordsPassedCount}개의 단어를 통과했어요!`;
        showScreen('endGame');

        recordButtonElement.disabled = true;
        listenButtonElement.disabled = true;
    }

    function handleGameClear() { // "얼마나 많이 통과?" 모드용 모든 단어 통과
        console.log("모든 단어 통과! (얼마나 많이 모드)");
        gameIsActive = false;
        stopWordTimer();

        finalMessageElement.textContent = "🎉 모든 단어 통과! (얼마나 많이 모드) 🎉";
        finalScoreDisplayElement.textContent = `정말 대단해요! ${wordsPassedCount}개를 완벽하게 해냈어요!`;
        showScreen('endGame');

        recordButtonElement.disabled = true;
        listenButtonElement.disabled = true;
        if (wordTimerDisplayElement) wordTimerDisplayElement.textContent = "클리어!";
    }

    function handleOverallTimeUp() { // "타임어택" 모드용 전체 시간 종료
        if (currentGameMode !== MODE_TIME_ATTACK || !gameIsActive) return; // 이 함수는 타임어택 모드 전용!
        console.log("타임어택 시간 종료!");
        gameIsActive = false; // 게임 확실히 비활성화
        if (currentGameMode === MODE_HOW_MANY) stopWordTimer(); // 혹시 모르니 단어 타이머도 멈춤 (타임어택엔 영향 없음)
        stopOverallGameTimer(); 

        finalMessageElement.textContent = "⏱️ 타임어택 종료! ⏱️";
        finalScoreDisplayElement.textContent = `총 ${wordsPassedCount}개의 단어를 성공했어요!`;
        showScreen('endGame');

        recordButtonElement.disabled = true;
        listenButtonElement.disabled = true;
        if (overallTimerDisplayElement) overallTimerDisplayElement.textContent = "시간 종료!";
    }
    
    function updateScoreBoard() {
        if (currentGameMode === MODE_TIME_ATTACK) {
            scoreBoardElement.textContent = `성공한 단어: ${wordsPassedCount}개`;
        } else { // MODE_HOW_MANY (또는 아직 모드 선택 전)
            scoreBoardElement.textContent = `통과한 단어: ${wordsPassedCount}개 / 총 ${koreanWords.length}개`;
        }
    }

    // --- 녹음 및 서버 통신 ---
    recordButtonElement.addEventListener('click', async () => {
        if (recordButtonElement.disabled || !gameIsActive) return;

        // ⭐ 타임어택 모드에서는 단어별 시간이 없으므로, 전체 시간만 체크 ⭐
        if (currentGameMode === MODE_TIME_ATTACK && overallGameTimeLeftInSeconds <= 0) {
            console.log("타임어택: 전체 시간 이미 종료됨, 녹음 시작 안 함.");
            return;
        }
        // ⭐ "얼마나 많이" 모드에서는 단어별 시간 체크 ⭐
        if (currentGameMode === MODE_HOW_MANY && wordTimeLeftInSeconds <= 0) {
            console.log("얼마나 많이: 단어 시간 이미 종료됨, 녹음 시작 안 함.");
            return;
        }


        if (!isCurrentlyRecording) {
            try {
                currentAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderTool = new MediaRecorder(currentAudioStream, { mimeType: 'audio/webm;codecs=opus' });
                recordedAudioChunks = [];
                mediaRecorderTool.addEventListener('dataavailable', event => { if (event.data.size > 0) recordedAudioChunks.push(event.data); });
                mediaRecorderTool.addEventListener('stop', () => {
                    if (currentAudioStream) { currentAudioStream.getTracks().forEach(track => track.stop()); currentAudioStream = null; }
                    const completeAudioBlob = new Blob(recordedAudioChunks, { type: mediaRecorderTool.mimeType });
                    
                    let canSend = false;
                    if (currentGameMode === MODE_HOW_MANY && wordTimeLeftInSeconds > 0) canSend = true;
                    if (currentGameMode === MODE_TIME_ATTACK && overallGameTimeLeftInSeconds > 0) canSend = true;

                    if (gameIsActive && canSend && completeAudioBlob.size > 0) {
                        sendVoiceToRobotForGrading(completeAudioBlob);
                    } else if (gameIsActive && canSend && completeAudioBlob.size === 0) {
                        feedbackResultArea.innerHTML = "<p>앗! 녹음된 목소리가 없어요. 다시 해볼까요?</p>";
                        if (canSend) { // 시간이 남아있어야 버튼 활성화
                            recordButtonElement.textContent = '🔴 녹음 시작'; recordButtonElement.disabled = false; recordButtonElement.classList.remove('recording');
                            isCurrentlyRecording = false;
                            if (currentGameMode === MODE_HOW_MANY) startWordTimer(); // "얼마나" 모드면 단어 타이머 다시 시작
                            // 타임어택 모드에서는 전체 타이머는 계속 가고 있음.
                        }
                    }
                });
                mediaRecorderTool.start();
                recordButtonElement.textContent = '⏹️ 녹음 중지'; recordButtonElement.classList.add('recording');
                feedbackResultArea.innerHTML = "<p>지금 말해보세요...🎙️</p>";
                isCurrentlyRecording = true;
            } catch (error) {
                console.error("마이크 오류:", error); alert("마이크를 쓸 수 없어요!");
                feedbackResultArea.innerHTML = "<p>마이크를 쓸 수 없어요. 😭</p>";
                recordButtonElement.textContent = '🔴 녹음 시작'; recordButtonElement.classList.remove('recording'); isCurrentlyRecording = false;
            }
        } else { // 녹음 중지 (사용자 클릭)
            if (mediaRecorderTool && mediaRecorderTool.state === 'recording') {
                if (currentGameMode === MODE_HOW_MANY) stopWordTimer(); // "얼마나" 모드면 "잠시만요" 동안 단어 타이머 정지
                // 타임어택 모드에서는 전체 타이머는 계속 돌아감 (일시정지 안 함)
                isCurrentlyRecording = false; 
                mediaRecorderTool.stop();
            }
            recordButtonElement.textContent = '잠시만요...'; recordButtonElement.disabled = true; 
        }
    });

    async function sendVoiceToRobotForGrading(voiceAudioBlob) {
        if (!gameIsActive) return;
        loadingMessageElement.style.display = 'block'; feedbackResultArea.innerHTML = "";
        const mailForm = new FormData();
        mailForm.append('userAudio', voiceAudioBlob, 'my_voice_recording.webm');
        mailForm.append('koreanWord', currentWordToPractice);
        try {
            const responseFromServer = await fetch('/assess-my-voice', { method: 'POST', body: mailForm });
            loadingMessageElement.style.display = 'none';
            if (!gameIsActive) return; // 응답 받았지만 게임 끝났으면 처리 안 함
            const resultFromServer = await responseFromServer.json();
            if (!responseFromServer.ok) throw new Error(resultFromServer.errorMessage || '로봇 응답 이상');
            handleRobotResponse(resultFromServer);
        } catch (error) {
            if (!gameIsActive) return;
            loadingMessageElement.style.display = 'none'; console.error('서버 통신 오류:', error);
            feedbackResultArea.innerHTML = `<p style="color: red;">앗! 문제 발생: ${error.message}</p>`;
            
            let canRetry = false;
            if (currentGameMode === MODE_HOW_MANY && wordTimeLeftInSeconds > 0) canRetry = true;
            if (currentGameMode === MODE_TIME_ATTACK && overallGameTimeLeftInSeconds > 0) canRetry = true;

            if (canRetry) {
                recordButtonElement.textContent = '🔴 녹음 시작'; recordButtonElement.disabled = false; recordButtonElement.classList.remove('recording');
                if (currentGameMode === MODE_HOW_MANY) startWordTimer();
            } else if (gameIsActive) {
                 if(currentGameMode === MODE_HOW_MANY) handleGameOver('serverError_HowMany');
                 else if(currentGameMode === MODE_TIME_ATTACK) handleOverallTimeUp(); // 타임어택에서 서버 오류+시간 없으면 게임 오버
            }
        }
    }

    function handleRobotResponse(resultFromServer) {
        if (!gameIsActive) return;
        if (!resultFromServer.success) {
            feedbackResultArea.innerHTML = `<p style="color: red;">${resultFromServer.errorMessage || '결과 못 받음'}</p>`;
            let canRetry = false;
            if (currentGameMode === MODE_HOW_MANY && wordTimeLeftInSeconds > 0) canRetry = true;
            if (currentGameMode === MODE_TIME_ATTACK && overallGameTimeLeftInSeconds > 0) canRetry = true;

            if (canRetry) {
                recordButtonElement.textContent = '🔴 녹음 시작'; recordButtonElement.disabled = false; recordButtonElement.classList.remove('recording');
                if (currentGameMode === MODE_HOW_MANY) startWordTimer();
            } else if (gameIsActive) {
                if(currentGameMode === MODE_HOW_MANY) handleGameOver('robotError_HowMany');
                else if(currentGameMode === MODE_TIME_ATTACK) handleOverallTimeUp();
            }
            return;
        }
        const isCorrectAnswer = resultFromServer.feedbackMessage.includes("정확해요!");
        if (isCorrectAnswer) {
            handleWordSuccess();
        } else { // 오답!
            feedbackResultArea.innerHTML = `<p style="color: orange;">${resultFromServer.feedbackMessage}</p>`;
            let canRetry = false;
            if (currentGameMode === MODE_HOW_MANY && wordTimeLeftInSeconds > 0) canRetry = true;
            if (currentGameMode === MODE_TIME_ATTACK && overallGameTimeLeftInSeconds > 0) canRetry = true;

            if (canRetry) {
                recordButtonElement.textContent = '🔴 녹음 시작'; recordButtonElement.disabled = false; recordButtonElement.classList.remove('recording');
                if (currentGameMode === MODE_HOW_MANY) startWordTimer();
            } else if (gameIsActive) {
                if(currentGameMode === MODE_HOW_MANY) handleGameOver('incorrectAndWordTimeUp_HowMany');
                else if(currentGameMode === MODE_TIME_ATTACK) { // 타임어택에선 오답이어도 시간이 다 안됐으면 다음 단어로 (여기선 이미 시간 다 된 경우)
                    handleOverallTimeUp();
                }
            }
        }
    }

    // --- 페이지 로드 시 초기화 ---
    startHowManyButtonElement.addEventListener('click', () => initializeAndStartGame(MODE_HOW_MANY));
    startTimeAttackButtonElement.addEventListener('click', () => initializeAndStartGame(MODE_TIME_ATTACK));
    restartGameButtonElement.addEventListener('click', () => initializeAndStartGame(currentGameMode));
    changeModeButtonElement.addEventListener('click', () => showScreen('modeSelection'));

    showScreen('modeSelection'); 
    updateScoreBoard(); 
});