// 비밀 열쇠 숨겨둔 곳을 알려주는 도구를 제일 먼저 불러와요
require('dotenv').config();

// 필요한 도구들을 불러와요
const express = require('express');
const { SpeechClient } = require('@google-cloud/speech'); // 구글의 똑똑한 귀 도구!
const multer = require('multer'); // 목소리 녹음 파일 다루는 도구
const path = require('path');

const app = express();
const port = 3000; // 우리 게임 웹페이지는 3000번 문으로 찾아올 수 있어요

// 구글의 똑똑한 귀(SpeechClient)를 준비시켜요!
// 아까 .env 파일에 적어둔 비밀 열쇠 위치를 보고 알아서 준비할 거예요.
let googleSpeechClient;
try {
    googleSpeechClient = new SpeechClient();
    console.log("구글 똑똑한 귀 준비 완료!");
} catch (error) {
    console.error("앗! 구글 똑똑한 귀를 준비하다가 문제가 생겼어요. 비밀 열쇠 파일 위치를 확인해보세요!");
    console.error(error);
    // process.exit(1); // 문제가 심각하면 여기서 멈출 수도 있지만, 일단 그냥 진행해볼게요.
}

// 목소리 녹음 파일을 컴퓨터 메모리에 잠깐 저장하도록 설정해요
const multerStorage = multer.memoryStorage();
const uploadMiddleware = multer({ storage: multerStorage });

// 'public' 폴더에 있는 파일들(HTML, CSS, main.js)을 손님에게 보여주세요! 라고 알려줘요
app.use(express.static(path.join(__dirname, 'public')));

// 게임 웹페이지에서 "내 목소리 평가해줘!" 요청이 오면 여기가 일해요!
app.post('/assess-my-voice', uploadMiddleware.single('userAudio'), async (req, res) => {
    console.log("음성 평가 요청이 도착했어요!");

    // 목소리 파일이나 연습 단어가 없으면 알려줘요
    if (!req.file) {
        console.log("앗! 목소리 녹음 파일이 안 왔어요.");
        return res.status(400).json({ success: false, errorMessage: '목소리 녹음 파일이 없어요!' });
    }
    if (!req.body.koreanWord) {
        console.log("앗! 연습할 한국어 단어가 안 왔어요.");
        return res.status(400).json({ success: false, errorMessage: '연습할 한국어 단어가 없어요!' });
    }

    const practiceWord = req.body.koreanWord; // 연습할 단어
    const audioFileBytes = req.file.buffer.toString('base64'); // 목소리 파일을 글자로 변환!

    // 구글 똑똑한 귀에게 보낼 요청서 만들기
    const audioRequestConfig = {
        encoding: 'WEBM_OPUS',        // 우리 녹음 방식이에요
        languageCode: 'ko-KR',        // 한국어예요!
        model: 'latest_long',         // 구글에게 최신 긴 문장용 모델을 써달라고 부탁해요
        // 이제 점수 평가는 안 할 거니까 pronunciationAssessmentConfig는 없어도 돼요!
    };

    const audioDataForGoogle = {
        content: audioFileBytes,
    };

    const requestToGoogle = {
        audio: audioDataForGoogle,
        config: audioRequestConfig, // 위에서 만든 설정 사용!
    };

    // 이제 구글에게 물어보고, 대답을 받아서 처리하는 부분을 간단하게 바꿔요!
    try {
        console.log(`구글에게 "${practiceWord}" 단어를 그냥 한번 읽어보라고 할게요!`);
        const [googleResponse] = await googleSpeechClient.recognize(requestToGoogle);
        
        // 구글이 뭐라고 대답했는지 까만 창(터미널)에 자세히 보여줘요 (우리가 문제 찾을 때 필요해요!)
        console.log("구글의 전체 응답 내용 (띄어쓰기 마법 적용 후):", JSON.stringify(googleResponse, null, 2)); 

        let recognizedText = ""; // 구글이 알아들은 글자를 담을 바구니
        let feedbackMessageToUser = "앗! 컴퓨터가 무슨 말인지 잘 못 알아들었어요. 😥 다시 해볼까요?"; // 기본 슬픈 메시지

        // 구글이 뭔가 대답을 해줬는지, 그리고 그 안에 우리가 원하는 '알아들은 글자(transcript)'가 있는지 확인해요!
        if (googleResponse.results && googleResponse.results.length > 0 &&
            googleResponse.results[0].alternatives && googleResponse.results[0].alternatives.length > 0 &&
            googleResponse.results[0].alternatives[0].transcript) {
            
            recognizedText = googleResponse.results[0].alternatives[0].transcript; 
            console.log(`컴퓨터가 알아들은 단어는 바로: "${recognizedText}"`);

            // ✨✨✨ 여기가 바로 "띄어쓰기 눈감아주기" 마법 주문이에요! ✨✨✨
            // practiceWord와 recognizedText 둘 다의 모든 띄어쓰기를 없애고 비교해요!
            const practiceWordNoSpace = practiceWord.replace(/\s+/g, '').trim().toLowerCase();
            const recognizedTextNoSpace = recognizedText.replace(/\s+/g, '').trim().toLowerCase();

            if (recognizedTextNoSpace === practiceWordNoSpace) {
                feedbackMessageToUser = `정확해요! 👍 컴퓨터가 원래 단어("${practiceWord}")의 뜻을 정확히 알아들었어요! (컴퓨터가 들은 말: "${recognizedText}")`;
            } else {
                feedbackMessageToUser = `음... 컴퓨터는 "${recognizedText}" 라고 알아들었대요. 원래 단어는 "${practiceWord}" 인데, 발음을 조금만 더 또박또박 해볼까요? 😉 (띄어쓰기는 괜찮아요!)`;
            }
            
            // 이제 웹페이지에게 결과를 알려줘요!
            res.json({ 
                success: true,
                recognizedText: recognizedText, // 컴퓨터가 실제로 들은 건 그대로 보여줘요
                feedbackMessage: feedbackMessageToUser,
                practiceWord: practiceWord
            });

        } else {
            console.warn("컴퓨터가 아무 글자도 못 알아들었나 봐요.");
            res.status(400).json({ 
                success: false,
                errorMessage: feedbackMessageToUser 
            });
        }

    } catch (error) { 
        console.error('일꾼 로봇이 아파요! (API 호출 또는 응답 처리 중 문제 발생):', error);
        res.status(500).json({ 
            success: false,
            errorMessage: '앗! 일꾼 로봇이 갑자기 아파서 일을 못했어요. 잠시 후 다시 시도해주세요!' 
        });
    }
});

// 일꾼 로봇아, 이제부터 손님을 기다려! (서버 시작)
app.listen(port, () => {
    console.log(`얏호! 우리 게임 서버가 http://localhost:${port} 에서 다시 출발했어요!`);
    console.log("비밀 열쇠 파일 위치도 확인했어요:", process.env.GOOGLE_APPLICATION_CREDENTIALS);
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS || !require('fs').existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
        console.warn("경고! 비밀 열쇠 파일 위치를 못 찾았거나, 파일이 없어요. .env 파일을 확인해주세요!");
        console.warn("구글 똑똑한 귀가 제대로 일하지 않을 수 있어요!");
    }
});