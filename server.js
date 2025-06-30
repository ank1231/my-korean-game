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

            // 긴문장인지 확인 (50자 이상)
            const isLongSentence = practiceWord.length > 50;
            
            if (isLongSentence) {
                // 긴문장용 유연한 평가 시스템
                const practiceWordCleaned = practiceWord.replace(/[.,?!]/g, '').replace(/\s+/g, '').trim().toLowerCase();
                const recognizedTextCleaned = recognizedText.replace(/[.,?!]/g, '').replace(/\s+/g, '').trim().toLowerCase();
                
                // 긴문장에서는 키워드 매칭 방식 사용
                const practiceKeywords = extractKeywords(practiceWordCleaned);
                const recognizedKeywords = extractKeywords(recognizedTextCleaned);
                
                const matchedKeywords = practiceKeywords.filter(keyword => 
                    recognizedKeywords.some(recKeyword => 
                        recKeyword.includes(keyword) || keyword.includes(recKeyword)
                    )
                );
                
                const accuracy = matchedKeywords.length / practiceKeywords.length;
                
                console.log(`[긴문장 평가] 키워드 매칭: ${matchedKeywords.length}/${practiceKeywords.length} (정확도: ${(accuracy * 100).toFixed(1)}%)`);
                
                if (accuracy >= 0.6) { // 60% 이상 매칭되면 성공
                    feedbackMessageToUser = `좋아요! 👍 긴문장을 ${(accuracy * 100).toFixed(0)}% 정확하게 발음하셨네요! (컴퓨터가 들은 말: "${recognizedText}")`;
                    res.json({ success: true, recognizedText: recognizedText, feedbackMessage: feedbackMessageToUser, practiceWord: practiceWord, accuracy: accuracy });
                } else {
                    feedbackMessageToUser = `긴문장 발음이 조금 어려웠나요. 정확도: ${(accuracy * 100).toFixed(0)}%. 컴퓨터가 들은 말: "${recognizedText}". 다시 한번 천천히 발음해보세요! 😊`;
                    res.json({ success: false, errorMessage: feedbackMessageToUser, recognizedText: recognizedText, practiceWord: practiceWord, accuracy: accuracy });
                }
            } else {
                // 짧은 문장용 기존 평가 시스템
                const practiceWordCleaned = practiceWord.replace(/[.,?!]/g, '').replace(/\s+/g, '').trim().toLowerCase();
                const recognizedTextCleaned = recognizedText.replace(/[.,?!]/g, '').replace(/\s+/g, '').trim().toLowerCase();

                console.log(`[비교] 원래 단어 (부호/공백 제거): "${practiceWordCleaned}"`);
                console.log(`[비교] 알아들은 단어 (부호/공백 제거): "${recognizedTextCleaned}"`);

                if (recognizedTextCleaned === practiceWordCleaned) {
                    feedbackMessageToUser = '정확해요! 👍';
                    res.json({ success: true, recognizedText: recognizedText, feedbackMessage: feedbackMessageToUser, practiceWord: practiceWord });
                } else {
                    feedbackMessageToUser = `컴퓨터가 들은 단어: "${recognizedText}"`;
                    res.json({ success: false, errorMessage: feedbackMessageToUser, recognizedText: recognizedText, practiceWord: practiceWord });
                }
            }
        } else {
            res.status(400).json({ success: false, errorMessage: feedbackMessageToUser });
        }
    } catch (error) { 
        console.error('일꾼 로봇이 아파요! (API 호출 중 문제 발생):', error);
        res.status(500).json({ success: false, errorMessage: '앗! 일꾼 로봇이 갑자기 아파서 일을 못했어요. 잠시 후 다시 시도해주세요!' });
    }
});

// 키워드 추출 함수 (긴문장용)
function extractKeywords(text) {
    // 2-4글자 단어들을 키워드로 추출
    const words = text.match(/[가-힣]{2,4}/g) || [];
    // 중복 제거하고 빈도순으로 정렬
    const wordCount = {};
    words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // 빈도가 높은 순으로 정렬하고 상위 10개 반환
    return Object.entries(wordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([word]) => word);
}

// 일꾼 로봇아, 이제부터 손님을 기다려!
app.listen(port, () => {
    console.log(`🚀 얏호! 우리 게임 서버가 ${port}번 문에서 출발했어요! 🚀`);
    if (initializationError) {
        console.log("🚨 하지만, 구글 똑똑한 귀 준비에 실패해서 발음 평가는 안 될 거예요!");
    } else {
        console.log("🤫 구글 귀가 잘 듣고 있어요!");
    }
});
