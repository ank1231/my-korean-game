// server.js - Render 전용! (문장 부호 무시 기능 추가 최종판!)
require('dotenv').config(); // 로컬 환경에서 .env 파일을 사용할 수 있게 해주는 마법!
const express = require('express');
const { SpeechClient } = require('@google-cloud/speech');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // 파일을 다룰 수 있게 해주는 기본 도구!

const app = express();
const port = process.env.PORT || 3000;

let googleSpeechClient;
let initializationError = null;

// --- ⭐️ Render와 로컬 모두를 위한 구글 클라이언트 준비! ⭐️ ---
console.log("--- 똑똑한 구글 귀(Speech-to-Text) 준비를 시작합니다 ---");
try {
    // 1순위: Render 서버 환경인지 확인 (환경변수 GOOGLE_CREDENTIALS_JSON_CONTENT 존재 여부)
    if (process.env.GOOGLE_CREDENTIALS_JSON_CONTENT) {
        console.log("💻 Render 서버 환경으로 판단됩니다. 비밀금고에서 열쇠를 찾습니다.");
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON_CONTENT);
    googleSpeechClient = new SpeechClient({ credentials });
        console.log("✅ 성공! Render 비밀금고의 열쇠로 구글 귀를 준비했어요!");
    } 
    // 2순위: 로컬 개발 환경인지 확인 (my_secret_google_key.json 파일 존재 여부)
    else if (fs.existsSync(path.join(__dirname, 'my_secret_google_key.json'))) {
        console.log("🏠 로컬 개발 환경으로 판단됩니다. my_secret_google_key.json 파일에서 열쇠를 찾습니다.");
        const keyFilePath = path.join(__dirname, 'my_secret_google_key.json');
        googleSpeechClient = new SpeechClient({ keyFilename: keyFilePath });
        console.log("✅ 성공! 로컬 파일 열쇠로 구글 귀를 준비했어요!");
    } 
    // 둘 다 없으면 에러!
    else {
        throw new Error("Google Cloud 인증 정보를 찾을 수 없어요! 'GOOGLE_CREDENTIALS_JSON_CONTENT' 환경 변수 또는 'my_secret_google_key.json' 파일이 필요합니다.");
    }
} catch (e) {
    console.error("🚨🚨🚨 치명적 오류! 구글 똑똑한 귀 준비 실패! 🚨🚨🚨");
    console.error(e.message);
    initializationError = e;
}
console.log("--- 구글 귀 준비 끝! ---");


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

            // ⭐⭐⭐ 여기가 바로 바뀐 부분이에요! 문장 부호까지 없애는 더 강력한 마법! ⭐⭐⭐
            // 정규식 /[.,?!]/g 는 글자 중에서 온점, 쉼표, 물음표, 느낌표를 찾아서 없애라는 뜻이에요.
            const practiceWordCleaned = practiceWord.replace(/[.,?!]/g, '').replace(/\s+/g, '').trim().toLowerCase();
            const recognizedTextCleaned = recognizedText.replace(/[.,?!]/g, '').replace(/\s+/g, '').trim().toLowerCase();

            console.log(`[비교] 원래 단어 (부호/공백 제거): "${practiceWordCleaned}"`);
            console.log(`[비교] 알아들은 단어 (부호/공백 제거): "${recognizedTextCleaned}"`);

            if (recognizedTextCleaned === practiceWordCleaned) {
                feedbackMessageToUser = '정확해요! 👍 컴퓨터가 원래 단어("' + practiceWord + '")의 뜻을 정확히 알아들었어요! (컴퓨터가 들은 말: "' + recognizedText + '")';
            } else {
                feedbackMessageToUser = '음... 컴퓨터는 "' + recognizedText + '" 라고 알아들었대요. 원래 단어는 "' + practiceWord + '" 인데, 발음을 조금만 더 또박또박 해볼까요? 😉 (띄어쓰기/부호는 괜찮아요!)';
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
        console.log("🤫 구글 귀가 잘 듣고 있어요!");
    }
});
