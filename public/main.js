async function sendVoiceToRobotForGrading(voiceAudioBlob) {
    if (!gameIsActive) return;
    if(loadingMessageElement) loadingMessageElement.style.display = 'block';
    if(feedbackResultArea) feedbackResultArea.innerHTML = "";
    if (currentGameMode === MODE_HOW_MANY || currentGameMode === MODE_SCORE_ATTACK) stopWordTimer();

    const mailForm = new FormData();
    mailForm.append('userAudio', voiceAudioBlob, 'my_voice_recording.webm');
    mailForm.append('koreanWord', currentWordToPractice);

    try {
        const responseFromServer = await fetch('https://korean-pronunciation-king.onrender.com/assess-my-voice', { 
            method: 'POST', 
            body: mailForm 
        });

        if(loadingMessageElement) loadingMessageElement.style.display = 'none';
        if (!gameIsActive) return;

        const resultFromServer = await responseFromServer.json();
        if (!responseFromServer.ok) {
            // 서버가 보낸 에러 메시지를 우선적으로 사용하고, 없으면 기본 메시지를 사용합니다.
            throw new Error(resultFromServer.errorMessage || '서버에서 응답을 제대로 받지 못했습니다.');
        }
        handleRobotResponse(resultFromServer);
    } catch (error) {
        if (!gameIsActive) return;
        if(loadingMessageElement) loadingMessageElement.style.display = 'none';
        console.error('서버 통신 오류:', error);
        if(feedbackResultArea) feedbackResultArea.innerHTML = `<p style="color: red;">앗! 문제 발생: ${error.message}</p>`;
        
        let canRetry = (currentGameMode === MODE_HOW_MANY && wordTimeLeftInSeconds > 0) || 
                       (currentGameMode === MODE_SCORE_ATTACK && wordTimeLeftInSeconds > 0) || 
                       (currentGameMode === MODE_TIME_ATTACK && overallGameTimeLeftInSeconds > 0);
                       
        if (canRetry) {
            if(recordButtonElement) {
                recordButtonElement.textContent = '🔴 녹음 시작';
                recordButtonElement.disabled = false;
                recordButtonElement.classList.remove('recording');
            }
            if (currentGameMode === MODE_HOW_MANY || currentGameMode === MODE_SCORE_ATTACK) {
                startWordTimer();
            }
        } else if (gameIsActive) {
            if(currentGameMode === MODE_HOW_MANY) {
                handleGameOver('serverError');
            } else if(currentGameMode === MODE_SCORE_ATTACK) {
                handleScoreAttackEnd();
            } else if(currentGameMode === MODE_TIME_ATTACK) {
                handleOverallTimeUp();
            }
        }
    }
}
