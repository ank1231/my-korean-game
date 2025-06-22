document.addEventListener('DOMContentLoaded', () => {
    console.log("🔵 1단계 뼈대 코드가 시작되었습니다! (화면 전환 기능만 테스트합니다) 🔵");

    // --- 우리가 조종할 화면 영역들을 컴퓨터에게 알려주기 ---
    const modeSelectionArea = document.getElementById('mode-selection-area');
    const levelSelectionArea = document.getElementById('level-selection-area');
    const gamePlayArea = document.getElementById('game-play-area');
    const endGameArea = document.getElementById('end-game-area');
    const leaderboardArea = document.getElementById('leaderboard-area');
    console.log("✅ 화면 영역들 찾기 완료!");

    // --- 우리가 조종할 버튼들을 컴퓨터에게 알려주기 ---
    const startLevelPracticeButton = document.getElementById('start-level-practice-btn');
    const startScoreAttackButton = document.getElementById('start-score-attack-btn');
    const showRankingButton = document.getElementById('show-ranking-btn');
    const backToModeButton = document.getElementById('back-to-mode-btn'); // 레벨 선택 화면의 뒤로가기
    const backToModeFromRankingButton = document.getElementById('back-to-mode-from-ranking-btn'); // 랭킹 화면의 뒤로가기
    console.log("✅ 버튼들 찾기 완료!");

    // --- 화면을 보여주고 숨기는 마법 주문(함수) ---
    function showScreen(screenName) {
        // 일단 모든 화면을 다 숨겨!
        modeSelectionArea.style.display = 'none';
        levelSelectionArea.style.display = 'none';
        gamePlayArea.style.display = 'none';
        endGameArea.style.display = 'none';
        leaderboardArea.style.display = 'none';

        // 그리고 우리가 원하는 화면만 보여줘!
        if (screenName === 'modeSelection') {
            modeSelectionArea.style.display = 'block';
            console.log("🖥️ '모드 선택' 화면을 보여줍니다.");
        } else if (screenName === 'levelSelection') {
            levelSelectionArea.style.display = 'block';
            console.log("🖥️ '레벨 선택' 화면을 보여줍니다.");
        } else if (screenName === 'leaderboard') {
            leaderboardArea.style.display = 'block';
            console.log("🖥️ '명예의 전당 (랭킹)' 화면을 보여줍니다.");
        } else {
            console.error(`🚨 '${screenName}' 이라는 이름의 화면은 없어요!`);
        }
    }

    // --- 버튼 누르는 약속 정하기 ---
    if (startLevelPracticeButton) {
        startLevelPracticeButton.addEventListener('click', () => {
            console.log("🚀 '레벨별 발음연습' 버튼 클릭됨!");
            showScreen('levelSelection'); // '레벨 선택' 화면을 보여줘!
        });
    }

    if (startScoreAttackButton) {
        startScoreAttackButton.addEventListener('click', () => {
            alert("스코어 어택 기능은 다음 단계에 만들 거예요!");
        });
    }

    if (showRankingButton) {
        showRankingButton.addEventListener('click', () => {
            console.log("👑 '명예의 전당' 버튼 클릭됨!");
            showScreen('leaderboard'); // '명예의 전당' 화면을 보여줘!
        });
    }

    if (backToModeButton || backToModeFromRankingButton) {
        // 두 개의 '뒤로가기' 버튼에 똑같은 마법 주문을 걸어줘요.
        const goBack = () => {
            console.log("« '뒤로가기' 버튼 클릭됨!");
            showScreen('modeSelection'); // '모드 선택' 화면으로 돌아가!
        };
        if(backToModeButton) backToModeButton.addEventListener('click', goBack);
        if(backToModeFromRankingButton) backToModeFromRankingButton.addEventListener('click', goBack);
    }
    
    // --- 페이지가 처음 열렸을 때 실행할 일 ---
    showScreen('modeSelection'); // 맨 처음엔 '모드 선택' 화면을 보여줘!
    console.log("🎉 1단계 뼈대 코드 설정 완료! 이제 버튼을 눌러 화면이 바뀌는지 확인해보세요! 🎉");
});
