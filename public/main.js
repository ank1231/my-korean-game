document.addEventListener('DOMContentLoaded', () => {
    console.log("한국어 발음 연습 게임 로딩 완료! 🎮");

    // --- HTML 요소 참조 ---
    const modeSelectionArea = document.getElementById('mode-selection-area');
    const levelSelectionArea = document.getElementById('level-selection-area');
    const gamePlayArea = document.getElementById('game-play-area');
    const endGameArea = document.getElementById('end-game-area');
    
    const wordDisplay = document.getElementById('word-to-practice');
    const listenButton = document.getElementById('listen-button');
    const recordButton = document.getElementById('record-button');
    const feedbackArea = document.getElementById('my-feedback');
    const loadingMessage = document.getElementById('loading-message');
    const wordTimerDisplay = document.getElementById('timer-display');
    const overallTimerDisplay = document.getElementById('overall-timer-display');
    const scoreBoard = document.getElementById('score-board');

    const startLevelModeBtn = document.getElementById('start-level-mode-btn');
    const startScoreAttackBtn = document.getElementById('start-score-attack-btn');
    const viewLeaderboardBtn = document.getElementById('view-leaderboard-btn');
    
    const levelButtons = {
        level1: document.getElementById('start-level-1-btn'),
        level2: document.getElementById('start-level-2-btn'),
        level3: document.getElementById('start-level-3-btn'),
        level4: document.getElementById('start-level-4-btn'),
    };
    const backToModeBtn = document.getElementById('back-to-mode-btn');

    const finalMessage = document.getElementById('final-message');
    const finalScoreDisplay = document.getElementById('final-score-display');
    const restartGameBtn = document.getElementById('restart-game-btn');
    const changeModeBtn = document.getElementById('change-mode-btn');

    const scoreSaveContainer = document.getElementById('score-save-container');
    const playerNameInput = document.getElementById('player-name');
    const saveScoreBtn = document.getElementById('save-score-btn');
    
    const leaderboardContainer = document.getElementById('leaderboard-container');
    const leaderboardDiv = document.getElementById('leaderboard');
    const closeLeaderboardBtn = document.getElementById('close-leaderboard-btn');

    // --- 단어 목록 ---
    const words = {
        level1: ["안녕하세요", "감사합니다", "이거 얼마예요?"],
        level2: ["민주주의의 의의", "책을 읊조리다", "흙을 밟다"],
        level3: ["간장공장 공장장은 강 공장장이고, 된장공장 공장장은 공 공장장이다", "한영양장점 옆 한양양장점 한양양장점 옆 한영양장점", "김서방네 지붕 위에 콩깍지가 깐 콩깍지냐 안 깐 콩깍지냐"],
        level4: ["숲 속 동굴 속에 숨어있는 살쾡이가 살랑살랑 살쾡이 꼬리를 살래살래 흔들면서 살금살금 슬금슬금 사람들을 살살 피해 다닌다", "우리집 옆집 앞집 뒷창살은 흩겹창살이고, 우리집 뒷집 앞집 옆창살은 겹흩창살이다", "한국관광공사 곽진광 관광과장", "앞 집 팥죽은 붉은 팥 풋팥죽이고 뒷집 콩죽은 햇콩단콩 콩죽 우리집 깨죽은 검은깨 깨죽인데 사람들은 햇콩 단콩 콩죽 깨죽 죽 먹기를 싫어하더라"]
    };

    // --- 게임 상태 변수 ---
    let currentMode = null; // 'LEVEL' 또는 'SCORE_ATTACK'
    let currentWordList = [];
    let currentWord = "";
    let wordIndex = 0;
    let score = 0;
    let gameActive = false;
    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;
    
    const WORD_TIMER_DURATION = 15;
    const SCORE_ATTACK_DURATION = 60;
    let wordTimer, overallTimer;
    let wordTimeLeft, overallTimeLeft;

    const LEADERBOARD_KEY = 'pronunciationKingLeaderboard';

    // --- 화면 전환 함수 ---
    const showScreen = (screen) => {
        modeSelectionArea.style.display = 'none';
        levelSelectionArea.style.display = 'none';
        gamePlayArea.style.display = 'none';
        endGameArea.style.display = 'none';
        leaderboardContainer.style.display = 'none';
        
        if (screen === 'mode') modeSelectionArea.style.display = 'block';
        else if (screen === 'level') levelSelectionArea.style.display = 'block';
        else if (screen === 'game') gamePlayArea.style.display = 'block';
        else if (screen === 'end') endGameArea.style.display = 'block';
    };

    // --- 게임 초기화 ---
    const initializeGame = () => {
        gameActive = false;
        stopAllTimers();
        score = 0;
        wordIndex = 0;
        currentMode = null;
        currentWordList = [];
        wordDisplay.textContent = "연습 모드를 선택해주세요!";
        feedbackArea.innerHTML = "<p>어떤 모드로 연습할까요?</p>";
        recordButton.disabled = true;
        listenButton.disabled = true;
        showScreen('mode');
    };

    // --- 게임 시작 ---
    const startGame = (wordList) => {
        gameActive = true;
        currentWordList = wordList;
        wordIndex = 0;
        score = 0;
        updateScoreboard();
        
        showScreen('game');
        recordButton.disabled = false;
        listenButton.disabled = false;
        
        if (currentMode === 'SCORE_ATTACK') {
            overallTimerDisplay.style.display = 'block';
            wordTimerDisplay.style.display = 'none';
            startOverallTimer();
        } else { // 'LEVEL'
            overallTimerDisplay.style.display = 'none';
            wordTimerDisplay.style.display = 'block';
        }
        
        nextWord();
    };

    // --- 단어 처리 ---
    const nextWord = () => {
        if (!gameActive) return;

        if (wordIndex >= currentWordList.length) {
            if (currentMode === 'LEVEL') {
                endGame(true); // 레벨 모드 클리어
            } else { // 스코어 어택은 단어 목록 반복
                wordIndex = 0; 
            }
        }
        
        currentWord = currentWordList[wordIndex];
        wordDisplay.textContent = currentWord;
        feedbackArea.innerHTML = "<p>발음해보세요!</p>";
        recordButton.textContent = '🔴 녹음';
        recordButton.disabled = false;
        isRecording = false;

        if (currentMode === 'LEVEL') {
            startWordTimer();
        }
    };

    // --- 타이머 ---
    const stopAllTimers = () => {
        clearInterval(wordTimer);
        clearInterval(overallTimer);
    };

    const pauseWordTimer = () => {
        if (wordTimer) {
            clearInterval(wordTimer);
            wordTimer = null;
        }
    };

    const resumeWordTimer = () => {
        if (currentMode === 'LEVEL' && wordTimeLeft > 0 && !wordTimer) {
            wordTimer = setInterval(() => {
                wordTimeLeft--;
                wordTimerDisplay.textContent = `단어 시간: ${wordTimeLeft}초`;
                if (wordTimeLeft <= 5) wordTimerDisplay.style.color = 'orange';
                if (wordTimeLeft <= 0) {
                    clearInterval(wordTimer);
                    endGame(false); // 시간 초과로 게임 오버
                }
            }, 1000);
        }
    };

    const startWordTimer = () => {
        clearInterval(wordTimer);
        wordTimeLeft = WORD_TIMER_DURATION;
        wordTimerDisplay.textContent = `제한 시간: ${wordTimeLeft}초`;
        wordTimerDisplay.style.color = '#c0392b';

        wordTimer = setInterval(() => {
            wordTimeLeft--;
            wordTimerDisplay.textContent = `제한 시간: ${wordTimeLeft}초`;
            if (wordTimeLeft <= 5) wordTimerDisplay.style.color = 'orange';
            if (wordTimeLeft <= 0) {
                clearInterval(wordTimer);
                endGame(false); // 시간 초과로 게임 오버
            }
        }, 1000);
    };

    const startOverallTimer = () => {
        clearInterval(overallTimer);
        overallTimeLeft = SCORE_ATTACK_DURATION;
        overallTimerDisplay.textContent = `남은 시간: ${overallTimeLeft}초`;
        overallTimerDisplay.style.color = '#e67e22';

        overallTimer = setInterval(() => {
            overallTimeLeft--;
            overallTimerDisplay.textContent = `남은 시간: ${overallTimeLeft}초`;
            if (overallTimeLeft <= 10) overallTimerDisplay.style.color = '#e74c3c';
            if (overallTimeLeft <= 0) {
                clearInterval(overallTimer);
                endGame(false); // 시간 초과로 게임 종료
            }
        }, 1000);
    };

    // --- 게임 종료 ---
    const endGame = (isClear) => {
        gameActive = false;
        stopAllTimers();
        recordButton.disabled = true;
        listenButton.disabled = true;

        if (isClear) {
            finalMessage.textContent = "🎉 연습 완료! 🎉";
            finalScoreDisplay.textContent = `모든 문장을 성공적으로 완료했어요!`;
        } else {
            if (currentMode === 'SCORE_ATTACK') {
                finalMessage.textContent = "⏱️ 타임 어택 종료! ⏱️";
                finalScoreDisplay.textContent = `최종 점수: ${score}점`;
                scoreSaveContainer.style.display = 'block';
            } else { // LEVEL 모드 실패
                finalMessage.textContent = "게임 종료! 😊";
                finalScoreDisplay.textContent = `성공한 문장: ${score}개`;
                scoreSaveContainer.style.display = 'none';
            }
        }
        showScreen('end');
    };

    // --- 점수판 업데이트 ---
    const updateScoreboard = () => {
        if (currentMode === 'SCORE_ATTACK') {
            scoreBoard.textContent = `성공: ${score}개`;
        } else {
            scoreBoard.textContent = `성공: ${score} / ${currentWordList.length}`;
        }
    };
    
    // --- 녹음 및 음성 평가 ---
    const handleRecordClick = async () => {
        if (recordButton.disabled || !gameActive) return;

        if (isRecording) {
            mediaRecorder.stop();
            isRecording = false;
            recordButton.textContent = '잠시만요...';
            recordButton.disabled = true;
            if (currentMode === 'LEVEL') {
                pauseWordTimer();
            }
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
                mediaRecorder.onstop = () => {
                    stream.getTracks().forEach(track => track.stop());
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    if (audioBlob.size > 0) {
                        sendAudio(audioBlob);
                    } else {
                        feedbackArea.innerHTML = "<p>앗! 녹음된 목소리가 없어요.</p>";
                        recordButton.disabled = false;
                        if (currentMode === 'LEVEL') {
                            resumeWordTimer();
                        }
                    }
                };
                
                mediaRecorder.start();
                recordButton.textContent = '⏹️ 중지';
                feedbackArea.innerHTML = "<p>지금 말해보세요! 🎙️</p>";
                isRecording = true;
                if (currentMode === 'LEVEL') {
                    resumeWordTimer();
                }

            } catch (err) {
                console.error("마이크 오류:", err);
                alert("마이크를 사용할 수 없습니다.");
            }
        }
    };

    const sendAudio = async (audioBlob) => {
        loadingMessage.style.display = 'block';
        feedbackArea.innerHTML = "";

        const formData = new FormData();
        formData.append('userAudio', audioBlob, 'recording.webm');
        formData.append('koreanWord', currentWord);

        try {
            const response = await fetch('/assess-my-voice', { method: 'POST', body: formData });
            const result = await response.json();

            if (!response.ok) throw new Error(result.errorMessage || '서버 응답 오류');

            if (result.success && result.feedbackMessage.includes("정확해요!")) {
                handleSuccess();
            } else {
                handleFailure(result.feedbackMessage);
            }
        } catch (error) {
            console.error('서버 통신 오류:', error);
            handleFailure(`통신 오류: ${error.message}`);
        } finally {
            loadingMessage.style.display = 'none';
        }
    };
    
    const handleSuccess = () => {
        score++;
        updateScoreboard();
        wordIndex++;
        feedbackArea.innerHTML = `<p style="color: green; font-weight: bold;">정확해요! 🎉</p>`;
        if (currentMode === 'LEVEL') {
            pauseWordTimer(); // 타이머 완전 정지
        }
        setTimeout(() => nextWord(), 1000);
    };

    const handleFailure = (message) => {
        feedbackArea.innerHTML = `<p style=\"color: orange;\">${message}</p>`;
        recordButton.disabled = false;
        recordButton.textContent = '🔴 녹음';
        // 오답 시 타이머 재시작
        if (currentMode === 'LEVEL') {
            resumeWordTimer();
        }
    };

    // --- 리더보드 ---
    const getLeaderboard = () => JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];
    const saveLeaderboard = (board) => localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(board));

    const showLeaderboard = () => {
        const board = getLeaderboard();
        board.sort((a, b) => b.score - a.score);

        leaderboardDiv.innerHTML = '';
        if (board.length === 0) {
            leaderboardDiv.innerHTML = '<p>아직 기록이 없어요. 첫 번째 챔피언이 되어보세요!</p>';
        } else {
            board.slice(0, 10).forEach((entry, i) => { // 상위 10개만 표시
                const rank = i + 1;
                const entryDiv = document.createElement('div');
                entryDiv.innerHTML = `<span>${rank}. ${entry.name}</span><span>${entry.score}점</span>`;
                leaderboardDiv.appendChild(entryDiv);
            });
        }
        leaderboardContainer.style.display = 'block';
    };
    
    const hideLeaderboard = () => leaderboardContainer.style.display = 'none';

    const saveScore = () => {
        const name = playerNameInput.value.trim();
        if (!name) {
            alert('이름을 입력해주세요!');
            return;
        }
        if (name.length > 8) {
            alert('이름은 8자 이내로 입력해주세요.');
            return;
        }

        const board = getLeaderboard();
        board.push({ name, score });
        saveLeaderboard(board);
        
        scoreSaveContainer.style.display = 'none';
        playerNameInput.value = '';
        showLeaderboard();
    };

    // --- 이벤트 리스너 연결 ---
    startLevelModeBtn.addEventListener('click', () => {
        currentMode = 'LEVEL';
        showScreen('level');
    });

    startScoreAttackBtn.addEventListener('click', () => {
        currentMode = 'SCORE_ATTACK';
        const allWords = [...words.level1, ...words.level2, ...words.level3, ...words.level4];
        allWords.sort(() => 0.5 - Math.random()); // 섞기
        startGame(allWords);
    });

    Object.keys(levelButtons).forEach(level => {
        levelButtons[level].addEventListener('click', () => {
            startGame(words[level]);
        });
    });

    restartGameBtn.addEventListener('click', () => {
        // 현재 모드와 단어 목록 그대로 다시 시작
        startGame(currentWordList);
    });
    
    changeModeBtn.addEventListener('click', initializeGame);
    backToModeBtn.addEventListener('click', () => showScreen('mode'));
    recordButton.addEventListener('click', handleRecordClick);

    listenButton.addEventListener('click', () => {
        if (!gameActive || !currentWord) return;
        const utterance = new SpeechSynthesisUtterance(currentWord);
        utterance.lang = 'ko-KR';
        speechSynthesis.speak(utterance);
    });

    viewLeaderboardBtn.addEventListener('click', showLeaderboard);
    closeLeaderboardBtn.addEventListener('click', hideLeaderboard);
    saveScoreBtn.addEventListener('click', saveScore);

    // --- 최초 실행 ---
    initializeGame();
});
