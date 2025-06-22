document.addEventListener('DOMContentLoaded', () => {
    console.log("🔵 버튼 클릭 테스트를 시작합니다! 🔵");

    const levelPracticeBtn = document.getElementById('start-level-practice-btn');
    const scoreAttackBtn = document.getElementById('start-score-attack-btn');
    const rankingBtn = document.getElementById('show-ranking-btn');

    // "레벨별 발음연습" 버튼 테스트
    if (levelPracticeBtn) {
        levelPracticeBtn.addEventListener('click', () => {
            alert("✅ '레벨별 발음연습' 버튼이 눌렸습니다!");
        });
        console.log("레벨별 발음연습 버튼 준비 완료 👍");
    } else {
        alert("🚨 '레벨별 발음연습' 버튼을 HTML에서 찾지 못했습니다!");
    }

    // "스코어 어택!" 버튼 테스트
    if (scoreAttackBtn) {
        scoreAttackBtn.addEventListener('click', () => {
            alert("✅ '스코어 어택!' 버튼이 눌렸습니다!");
        });
        console.log("스코어 어택 버튼 준비 완료 👍");
    } else {
        alert("🚨 '스코어 어택!' 버튼을 HTML에서 찾지 못했습니다!");
    }

    // "명예의 전당 (랭킹)" 버튼 테스트
    if (rankingBtn) {
        rankingBtn.addEventListener('click', () => {
            alert("✅ '명예의 전당 (랭킹)' 버튼이 눌렸습니다!");
        });
        console.log("명예의 전당 버튼 준비 완료 👍");
    } else {
        alert("🚨 '명예의 전당 (랭킹)' 버튼을 HTML에서 찾지 못했습니다!");
    }
});
