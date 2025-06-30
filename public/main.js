document.addEventListener('DOMContentLoaded', () => {
    console.log("한국어 발음 연습 게임 로딩 완료! 🎮");

    // --- TETR.IO 스타일 애니메이션 효과 ---
    const createParticle = (x, y, color = '#667eea') => {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.background = color;
        document.body.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 3000);
    };

    const addButtonClickEffect = (button, color = '#667eea') => {
        const rect = button.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                createParticle(x + (Math.random() - 0.5) * 50, y + (Math.random() - 0.5) * 50, color);
            }, i * 100);
        }
    };

    const addSuccessEffect = () => {
        const rect = wordDisplay.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                createParticle(x + (Math.random() - 0.5) * 100, y + (Math.random() - 0.5) * 100, '#00b894');
            }, i * 150);
        }
    };

    const addFailureEffect = () => {
        const rect = wordDisplay.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                createParticle(x + (Math.random() - 0.5) * 80, y + (Math.random() - 0.5) * 80, '#e74c3c');
            }, i * 120);
        }
    };

    // --- HTML 요소 참조 ---
    const modeSelectionArea = document.getElementById('mode-selection-area');
    const levelSelectionArea = document.getElementById('level-selection-area');
    const gamePlayArea = document.getElementById('game-play-area');
    const endGameArea = document.getElementById('end-game-area');
    
    const wordDisplay = document.getElementById('word-to-practice');
    const recordButton = document.getElementById('record-button');
    const feedbackArea = document.getElementById('my-feedback');
    const loadingMessage = document.getElementById('loading-message');
    const wordTimerDisplay = document.getElementById('timer-display');
    const overallTimerDisplay = document.getElementById('overall-timer-display');
    const scoreBoard = document.getElementById('score-board');

    const startLevelModeBtn = document.getElementById('start-level-mode-btn');
    const startScoreAttackBtn = document.getElementById('start-score-attack-btn');
    const startLongSentenceBtn = document.getElementById('start-long-sentence-btn');
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

    // --- 긴문장 목록 ---
    const longSentences = [
        '똑똑한 크낙새 딱따구리는 딱딱한 떡갈나무를 똑똑 쪼아대길 특기로 삼는데, 그 꼴을 못마땅하게 여긴 키 크고 코 큰 깐깐한 까투리 코코씨가 "네가 쪼는 그 떡갈나무는 내가 콩깍지를 까던 곳이니, 그만 쪼아대지 못할까!" 하고 빽빽 소리를 질렀다. 그러자 똑똑한 크낙새 딱따구리는 "콩깍지 까는 것과 떡갈나무 쪼는 것은 각각의 특기이니, 당신은 당신의 콩깍지를 까시오. 나는 나의 딱딱한 떡갈나무를 쪼아대겠소." 하고는 다시 떡갈나무를 똑똑, 콩깍지 터지듯 톡톡, 쉴 새 없이 쪼아댔다고 한다',
        '박 법학박사의 부인인 박 뷰티박사는 박 법학박사가 법학박사 학위를 박탈당하자, 법학박사 학위 박탈에 대한 법적 대응책으로 불법 복제된 법학박사 학위증을 위조하려다, 박 법학박사의 법학박사 시절 법학 동료였던 방범복 차림의 방 법학박사에게 발각되어, 결국 박 법학박사와 박 뷰티박사 둘 다 불법 학위증 위조 및 증거 인멸 혐의로 구속되었다'
    ];

    // --- 게임 상태 변수 ---
    let currentMode = null; // 'LEVEL', 'SCORE_ATTACK', 또는 'LONG_SENTENCE'
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
        
        if (screen === 'mode') {
            modeSelectionArea.style.display = 'block';
            modeSelectionArea.style.animation = 'fadeIn 0.6s ease-out';
        }
        else if (screen === 'level') {
            levelSelectionArea.style.display = 'block';
            levelSelectionArea.style.animation = 'fadeIn 0.6s ease-out';
        }
        else if (screen === 'game') {
            gamePlayArea.style.display = 'block';
            gamePlayArea.style.animation = 'fadeIn 0.6s ease-out';
        }
        else if (screen === 'end') {
            endGameArea.style.display = 'block';
            endGameArea.style.animation = 'fadeIn 0.6s ease-out';
        }
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
        gamePlayArea.classList.remove('long-sentence-mode');
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
        
        // 긴문장 모드일 때 CSS 클래스 추가
        if (currentMode === 'LONG_SENTENCE') {
            gamePlayArea.classList.add('long-sentence-mode');
        } else {
            gamePlayArea.classList.remove('long-sentence-mode');
        }
        
        if (currentMode === 'SCORE_ATTACK') {
            overallTimerDisplay.style.display = 'block';
            wordTimerDisplay.style.display = 'none';
            startOverallTimer();
        } else if (currentMode === 'LONG_SENTENCE') {
            overallTimerDisplay.style.display = 'none';
            wordTimerDisplay.style.display = 'none';
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
                return; // 게임 종료 후 더 이상 진행하지 않음
            } else if (currentMode === 'LONG_SENTENCE') {
                endGame(true); // 긴문장 모드 클리어
                return; // 게임 종료 후 더 이상 진행하지 않음
            } else { // 스코어 어택은 단어 목록 반복
                wordIndex = 0; 
            }
        }
        
        currentWord = currentWordList[wordIndex];
        wordDisplay.textContent = currentWord;
        feedbackArea.innerHTML = "<p>발음해보세요!</p>";
        recordButton.innerHTML = '<i class="fas fa-microphone"></i> 녹음';
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
                wordTimerDisplay.innerHTML = `<i class="fas fa-hourglass-half"></i> 제한 시간: ${wordTimeLeft}초`;
                if (wordTimeLeft <= 5) {
                    wordTimerDisplay.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
                    wordTimerDisplay.style.animation = 'pulse 1s infinite';
                }
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
        wordTimerDisplay.innerHTML = `<i class="fas fa-hourglass-half"></i> 제한 시간: ${wordTimeLeft}초`;
        wordTimerDisplay.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
        wordTimerDisplay.style.animation = 'none';
        
        wordTimer = setInterval(() => {
            wordTimeLeft--;
            wordTimerDisplay.innerHTML = `<i class="fas fa-hourglass-half"></i> 제한 시간: ${wordTimeLeft}초`;
            if (wordTimeLeft <= 5) {
                wordTimerDisplay.style.animation = 'pulse 1s infinite';
            }
            if (wordTimeLeft <= 0) {
                clearInterval(wordTimer);
                endGame(false); // 시간 초과로 게임 오버
            }
        }, 1000);
    };

    const startOverallTimer = () => {
        clearInterval(overallTimer);
        overallTimeLeft = SCORE_ATTACK_DURATION;
        overallTimerDisplay.innerHTML = `<i class="fas fa-clock"></i> 전체 시간: ${overallTimeLeft}초`;
        
        overallTimer = setInterval(() => {
            overallTimeLeft--;
            overallTimerDisplay.innerHTML = `<i class="fas fa-clock"></i> 전체 시간: ${overallTimeLeft}초`;
            if (overallTimeLeft <= 10) {
                overallTimerDisplay.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
                overallTimerDisplay.style.animation = 'pulse 1s infinite';
            }
            if (overallTimeLeft <= 0) {
                clearInterval(overallTimer);
                endGame(false); // 시간 초과로 게임 오버
            }
        }, 1000);
    };

    // --- 게임 종료 ---
    const endGame = (isClear) => {
        gameActive = false;
        stopAllTimers();
        
        if (isClear) {
            finalMessage.innerHTML = '<i class="fas fa-trophy"></i> 클리어!';
            finalMessage.style.background = 'none';
            finalMessage.style.color = '';
            addSuccessEffect();
        } else {
            finalMessage.innerHTML = '<i class="fas fa-times-circle"></i> 게임 오버!';
            finalMessage.style.background = 'none';
            finalMessage.style.color = '';
            addFailureEffect();
        }
        
        finalScoreDisplay.innerHTML = `<i class="fas fa-medal"></i> 최종 점수: ${score}점`;
        
        // 타임어택 모드에서만 순위표에 저장할 수 있는 점수인지 확인
        if (currentMode === 'SCORE_ATTACK') {
            const leaderboard = getLeaderboard();
            const minScore = leaderboard.length >= 10 ? Math.min(...leaderboard.map(entry => entry.score)) : 0;
            
            if (score > minScore || leaderboard.length < 10) {
                scoreSaveContainer.style.display = 'block';
            } else {
                scoreSaveContainer.style.display = 'none';
            }
        } else {
            // 연습모드에서는 기록 저장 기능 숨김
            scoreSaveContainer.style.display = 'none';
        }
        
        showScreen('end');
    };

    // --- 점수 업데이트 ---
    const updateScoreboard = () => {
        scoreBoard.innerHTML = `<i class="fas fa-star"></i> 성공: ${score}개`;
    };

    // --- 녹음 처리 ---
    const handleRecordClick = async () => {
        if (!gameActive) return;
        
        if (!isRecording) {
            // 녹음 시작
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                
                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };
                
                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    // 음성 분석 시작 시에만 타이머 멈춤
                    pauseWordTimer();
                    await sendAudio(audioBlob);
                    stream.getTracks().forEach(track => track.stop());
                };
                
                mediaRecorder.start();
                isRecording = true;
                recordButton.innerHTML = '<i class="fas fa-stop"></i> 중지';
                recordButton.classList.add('recording');
                
                // 녹음 시작 효과
                addButtonClickEffect(recordButton, '#e74c3c');
                
            } catch (error) {
                console.error('마이크 접근 오류:', error);
                feedbackArea.innerHTML = "<p>마이크 접근이 거부되었습니다. 브라우저 설정을 확인해주세요.</p>";
            }
        } else {
            // 녹음 중지
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
            isRecording = false;
            recordButton.innerHTML = '<i class="fas fa-microphone"></i> 녹음';
            recordButton.classList.remove('recording');
            recordButton.disabled = true;
            
            loadingMessage.style.display = 'block';
            feedbackArea.innerHTML = "<p>음성을 분석하고 있습니다...</p>";
        }
    };

    // --- 서버로 음성 전송 ---
    const sendAudio = async (audioBlob) => {
        try {
            const formData = new FormData();
            formData.append('userAudio', audioBlob, 'recording.wav');
            formData.append('koreanWord', currentWord);
            
            const response = await fetch('/assess-my-voice', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    handleSuccess(result.recognizedText);
                } else {
                    handleFailure(result.recognizedText || result.errorMessage || '인식되지 않았습니다.');
                }
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('서버 통신 오류:', error);
            handleFailure('서버 연결에 실패했습니다.');
        }
    };

    // --- 성공 처리 ---
    const handleSuccess = (recognizedText) => {
        loadingMessage.style.display = 'none';
        score++;
        updateScoreboard();
        
        feedbackArea.innerHTML = `<p style="color: #00b894; font-size: 1.1em;">"${recognizedText}"</p>`;
        
        addSuccessEffect();
        
        // 2초 대기 중에는 타이머 멈춤
        pauseWordTimer();
        setTimeout(() => {
            wordIndex++;
            nextWord();
            // 게임이 아직 활성 상태일 때만 타이머 재개
            if (gameActive) {
                resumeWordTimer();
            }
        }, 2000);
    };

    // --- 실패 처리 ---
    const handleFailure = (recognizedText) => {
        loadingMessage.style.display = 'none';
        
        feedbackArea.innerHTML = `<p style="color: #e74c3c; font-size: 1.1em;">"${recognizedText}"</p>`;
        
        addFailureEffect();
        
        // 음성 분석 완료 후 타이머 재개
        resumeWordTimer();
        
        recordButton.disabled = false;
    };

    // --- 발음 오류 하이라이트 ---
    const highlightMistakes = (originalText, feedbackMessage) => {
        // 간단한 오류 하이라이트 로직
        const highlightedText = originalText.replace(/([가-힣]+)/g, '<span style="color: #e74c3c; font-weight: bold;">$1</span>');
        return highlightedText;
    };

    // --- 순위표 관리 ---
    const getLeaderboard = () => JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];
    const saveLeaderboard = (board) => localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(board));

    const showLeaderboard = () => {
        const leaderboard = getLeaderboard();
        leaderboardDiv.innerHTML = '';
        
        if (leaderboard.length === 0) {
            leaderboardDiv.innerHTML = '<p style="text-align: center; color: #a0aec0;">아직 기록이 없습니다.</p>';
        } else {
            leaderboard.forEach((entry, index) => {
                const div = document.createElement('div');
                div.innerHTML = `
                    <span><strong>${index + 1}.</strong> ${entry.name}</span>
                    <span>${entry.score}점</span>
                `;
                leaderboardDiv.appendChild(div);
            });
        }
        
        leaderboardContainer.style.display = 'block';
        leaderboardContainer.style.animation = 'fadeIn 0.6s ease-out';
    };

    const hideLeaderboard = () => {
        leaderboardContainer.style.display = 'none';
    };

    const saveScore = () => {
        const playerName = playerNameInput.value.trim();
        if (!playerName) {
            alert('이름을 입력해주세요!');
            return;
        }
        
        const leaderboard = getLeaderboard();
        leaderboard.push({ name: playerName, score: score, date: new Date().toISOString() });
        leaderboard.sort((a, b) => b.score - a.score);
        
        if (leaderboard.length > 10) {
            leaderboard.splice(10);
        }
        
        saveLeaderboard(leaderboard);
        scoreSaveContainer.style.display = 'none';
        
        // 저장 성공 효과
        addButtonClickEffect(saveScoreBtn, '#00b894');
        
        alert('점수가 저장되었습니다!');
    };

    // --- 이벤트 리스너 ---
    startLevelModeBtn.addEventListener('click', () => {
        addButtonClickEffect(startLevelModeBtn, '#667eea');
        currentMode = 'LEVEL';
        showScreen('level');
    });

    startScoreAttackBtn.addEventListener('click', () => {
        addButtonClickEffect(startScoreAttackBtn, '#667eea');
        currentMode = 'SCORE_ATTACK';
        const allWords = [...words.level1, ...words.level2, ...words.level3, ...words.level4];
        startGame(allWords);
    });

    startLongSentenceBtn.addEventListener('click', () => {
        addButtonClickEffect(startLongSentenceBtn, '#667eea');
        currentMode = 'LONG_SENTENCE';
        startGame(longSentences);
    });

    viewLeaderboardBtn.addEventListener('click', () => {
        addButtonClickEffect(viewLeaderboardBtn, '#667eea');
        showLeaderboard();
    });

    levelButtons.level1.addEventListener('click', () => {
        addButtonClickEffect(levelButtons.level1, '#00b894');
        startGame(words.level1);
    });

    levelButtons.level2.addEventListener('click', () => {
        addButtonClickEffect(levelButtons.level2, '#f39c12');
        startGame(words.level2);
    });

    levelButtons.level3.addEventListener('click', () => {
        addButtonClickEffect(levelButtons.level3, '#3498db');
        startGame(words.level3);
    });

    levelButtons.level4.addEventListener('click', () => {
        addButtonClickEffect(levelButtons.level4, '#9b59b6');
        startGame(words.level4);
    });

    backToModeBtn.addEventListener('click', () => {
        addButtonClickEffect(backToModeBtn, '#6c757d');
        showScreen('mode');
    });

    recordButton.addEventListener('click', handleRecordClick);

    restartGameBtn.addEventListener('click', () => {
        addButtonClickEffect(restartGameBtn, '#667eea');
        if (currentMode === 'LEVEL') {
            startGame(currentWordList);
        } else if (currentMode === 'SCORE_ATTACK') {
            const allWords = [...words.level1, ...words.level2, ...words.level3, ...words.level4];
            startGame(allWords);
        } else if (currentMode === 'LONG_SENTENCE') {
            startGame(longSentences);
        } else {
            initializeGame(); 
        }
    });

    changeModeBtn.addEventListener('click', () => {
        addButtonClickEffect(changeModeBtn, '#667eea');
        showScreen('mode');
    });

    saveScoreBtn.addEventListener('click', saveScore);
    closeLeaderboardBtn.addEventListener('click', () => {
        addButtonClickEffect(closeLeaderboardBtn, '#667eea');
        hideLeaderboard();
    });

    // Enter 키로 점수 저장
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveScore();
        }
    });

    // 게임 초기화
    initializeGame();
});
