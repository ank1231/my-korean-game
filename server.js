// server.js - Render 전용! (SyntaxError 오타 완벽 수정 최종판!)
const express = require('express');
const { SpeechClient } = require('@google-cloud/speech');
const multer = require('multer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

let googleSpeechClient;
let initializationError = null;

// --- Render를 위한 구글 클라이언트 준비! ---
console.log("--- Render 전용 구글 클라이언트 초기화를 시작합니다 ---");
try {
    if (!process.env.GOOGLE_CREDENTIALS_JSON_CONTENT) {
        throw new Error("Render 비밀금고에 GOOGLE_CREDENTIALS_JSON_CONTENT 변수가 설정되지 않았습니다!");
    }
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON_CONTENT);
    googleSpeechClient = new SpeechClient({ credentials });
    console.log("✅ 성공! Render 비밀금고에서 비밀 열쇠를 찾아서 구글 똑똑한 귀를 준비했어요!");
} catch (e) {
    console.error("🚨🚨🚨 치명적 오류! 구글 똑똑한 귀 준비 실패! 🚨🚨🚨");
    console.error(e.message);
    initializationError = e;
}
console.log("--- 구글 클라이언트 초기화 끝 ---");


// 'public' 폴더에 있는 파일들을 손님에게 보여주세요!
app.use(express.static(path.join(__dirname, 'public')));
    
// 목소리 녹음 파일을 컴퓨터 메모리에 잠깐 저장하도록 설정
const multerStorage = multer.memoryStorage();
const uploadMiddleware = multer({ storage: multerStorage });

// API 라우트
app.post('/assess-my-voice', uploadMiddleware.single('userAudio'), async (req, res) => {
    if (initializationError || !googleSpeechClient) {
        console.error("음성 평가 요청이 왔지만, 구글 클라이언트가 준비되지 않아서 처리할 수 없어요!");
        return res.status(500).json({ success: false, errorMessage: '서버에 문제가 생겨서 음성 평가를 할 수 없어요. 관리자에게 문의해주세요!' });
    }
    if (!req.file) return res.status(400).json({ success: false, errorMessage: '목소리 녹음 파일이 없어요!' });
    if (!req.body.koreanWord) return res.status(400).json({ success: false, errorMessage: '연습할 한국어 단어가 없어요!' });
        
    const practiceWord = req.body.koreanWord; 
    const audioFileBytes = req.file.buffer.toString('base64'); 

    const audioRequestConfig = {
        encoding: 'WEBM_OPUS',        
        languageCode: 'ko-KR',        
        model: 'latest_long',         
    };
    const audioDataForGoogle = { content: audioFileBytes };
    const requestToGoogle = { audio: audioDataForGoogle, config: audioRequestConfig };

    try {
        const [googleResponse] = await googleSpeechClient.recognize(requestToGoogle);
        let recognizedText = ""; 
        let feedbackMessageToUser = "앗! 컴퓨터가 무슨 말인지 잘 못 알아들었어요. 😥 다시 해볼까요?"; 

        if (googleResponse.results && googleResponse.results.length > 0 && googleResponse.results[0].alternatives && googleResponse.results[0].alternatives.length > 0 && googleResponse.results[0].alternatives[0].transcript) {
            recognizedText = googleResponse.results[0].alternatives[0].transcript; 
            console.log(`컴퓨터가 알아들은 단어는 바로: "${recognizedText}"`);

            // ⭐⭐⭐ 여기가 바로 오타가 있었던 부분이에요! 말끔하게 고쳤어요! ⭐⭐⭐
            const practiceWordNoSpace = practiceWord.replace(/\s+/g, '').trim().toLowerCase();
            const recognizedTextNoSpace = recognizedText.replace(/\s+/g, '').trim().toLowerCase();

            if (recognizedTextNoSpace === practiceWordNoSpace) {
                feedbackMessageToUser = '정확해요! 👍 컴퓨터가 원래 단어("' + practiceWord + '")의 뜻을 정확히 알아들었어요! (컴퓨터가 들은 말: "' + recognizedText + '")';
            } else {
                feedbackMessageToUser = '음... 컴퓨터는 "' + recognizedText + '" 라고 알아들었대요. 원래 단어는 "' + practiceWord + '" 인데, 발음을 조금만 더 또박또박 해볼까요? 😉 (띄어쓰기는 괜찮아요!)';
            }
            
            res.json({ success: true, recognizedText: recognizedText, feedbackMessage: feedbackMessageToUser, practiceWord: practiceWord });
        } else {
            res.status(400).json({ success: false, errorMessage: feedbackMessageToUser });
        }
    } catch (error) { 
        console.error('일꾼 로봇이 아파요! (API 호출 중 문제 발생):', error);
        res.status(500).json({ success: false, errorMessage: '앗! 일꾼 로봇이 갑자기 아파서 일을 못했어요. 잠시 후 다시 시도해주세요!' });
    }
});

// 일꾼 로봇아, 이제부터 손님을 기다려!
app.listen(port, () => {
    console.log(`🚀 얏호! 우리 게임 서버가 ${port}번 문에서 출발했어요! 🚀`);
    if (initializationError) {
        console.log("🚨 하지만, 구글 똑똑한 귀 준비에 실패해서 발음 평가는 안 될 거예요!");
    } else {
        console.log("🤫 Render 비밀금고에 있는 비밀 열쇠를 사용하고 있어요!");
    }
});
