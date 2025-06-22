document.addEventListener('DOMContentLoaded', () => {
    console.log("🔵 디버깅용 main.js가 시작되었습니다! 🔵");
    console.log("이제 모드 선택 버튼 3개가 눌리는지 확인해볼게요.");

    // 모드 선택 화면의 버튼 3개만 찾아봅니다.
    const levelPracticeBtn = document.getElementById('start-level-practice-btn');
    const scoreAttackBtn = document.getElementById('start-score-attack-btn');
    const rankingBtn = document.getElementById('show-ranking-btn');

    console.log("--- 버튼 찾기 결과 ---");
    console.log("레벨별 발음연습 버튼:", levelPracticeBtn ? "찾았음👍" : "못 찾음🚨");
    console.log("스코어 어택 버튼:", scoreAttackBtn ? "찾았음👍" : "못 찾음🚨");
    console.log("명예의 전당 버튼:", rankingBtn ? "찾았음👍" : "못 찾음🚨");
    console.log("----------------------");

    if (levelPracticeBtn) {
        levelPracticeBtn.addEventListener('click', () => {
            alert("✅ '레벨별 발음연습' 버튼 클릭 성공!");
            console.log("✅ '레벨별 발음연습' 버튼이 눌렸어요!");
        });
        console.log("레벨별 발음연습 버튼에 클릭 약속을 정해줬어요.");
    }

    if (scoreAttackBtn) {
        scoreAttackBtn.addEventListener('click', () => {
            alert("✅ '스코어 어택!' 버튼 클릭 성공!");
            console.log("✅ '스코어 어택!' 버튼이 눌렸어요!");
        });
        console.log("스코어 어택 버튼에 클릭 약속을 정해줬어요.");
    }

    if (rankingBtn) {
        rankingBtn.addEventListener('click', () => {
            alert("✅ '명예의 전당 (랭킹)' 버튼 클릭 성공!");
            console.log("✅ '명예의 전당 (랭킹)' 버튼이 눌렸어요!");
        });
        console.log("명예의 전당 버튼에 클릭 약속을 정해줬어요.");
    }

    // 다른 모든 복잡한 함수는 일단 다 뺐어요!
    console.log("🎉 디버깅용 main.js 설정 완료! 이제 버튼을 눌러보세요. 🎉");
});
