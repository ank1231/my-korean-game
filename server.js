const express = require('express');
const { SpeechClient } = require('@google-cloud/speech');
const multer = require('multer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

let googleSpeechClient;
let initializationError = null;

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

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
const multerStorage = multer.memoryStorage();
const uploadMiddleware = multer({ storage: multerStorage });

app.post('/assess-my-voice', async (req, res) => {
    if (initializationError || !googleSpeechClient) {
        return res.status(500).json({ success: false, errorMessage: '서버 문제로 음성 평가를 할 수 없어요.' });
    }
    if (!req.file || !req.body.koreanWord) {
        return res.status(400).json({ success: false, errorMessage: '필요한 정보가 부족해요.' });
    }
    const practiceWord = req.body.koreanWord; 
    const audioFileBytes = req.file.buffer.toString('base64'); 
    const audioRequestConfig = { encoding: 'WEBM_OPUS', languageCode: 'ko-KR', model: 'latest_long' };
    const requestToGoogle = { audio: { content: audioFileBytes }, config: audioRequestConfig };
    try {
        const [googleResponse] = await googleSpeechClient.recognize(requestToGoogle);
        let recognizedText = ""; 
        let feedbackMessageToUser = "앗! 컴퓨터가 무슨 말인지 잘 못 알아들었어요. 😥"; 
        if (googleResponse.results && googleResponse.results.length > 0 && googleResponse.results[0].alternatives[0]) {
            recognizedText = googleResponse.results[0].alternatives[0].transcript; 
            const practiceWordCleaned = practiceWord.replace(/[.,?!]/g, '').replace(/\s+/g, '').trim().toLowerCase();
            const recognizedTextCleaned = recognizedText.replace(/[.,?!]/g, '').replace(/\s+/g, '').trim().toLowerCase();
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
        console.error('API 호출 중 문제 발생:', error);
        res.status(500).json({ success: false, errorMessage: '앗! 일꾼 로봇이 갑자기 아파서 일을 못했어요.' });
    }
});

app.get('/api/scores', async (req, res) => {
    if (!pool) return res.status(500).json({ error: '데이터베이스에 연결할 수 없어요.' });
    try {
        const result = await pool.query('SELECT nickname, score FROM scores ORDER BY score DESC LIMIT 10');
        res.json(result.rows);
    } catch (err) {
        console.error('랭킹 데이터 불러오기 오류:', err);
        res.status(500).json({ error: '랭킹을 불러오는 데 실패했어요.' });
    }
});

app.post('/api/scores', async (req, res) => {
    if (!pool) return res.status(500).json({ error: '데이터베이스에 연결할 수 없어요.' });
    const { nickname, score } = req.body;
    if (!nickname || score === undefined) {
        return res.status(400).json({ error: '닉네임과 점수가 모두 필요해요.' });
    }
    try {
        const result = await pool.query('INSERT INTO scores(nickname, score) VALUES($1, $2) RETURNING *', [nickname, score]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('점수 저장 오류:', err);
        res.status(500).json({ error: '점수를 저장하는 데 실패했어요.' });
    }
});

app.listen(port, () => {
    console.log(`🚀 얏호! 우리 게임 서버가 ${port}번 문에서 출발했어요! 🚀`);
    if (initializationError) {
        console.log("🚨 하지만, 구글 똑똑한 귀 준비에 실패해서 발음 평가는 안 될 거예요!");
    } else {
        console.log("🤫 Render 비밀금고에 있는 비밀 열쇠를 사용하고 있어요!");
    }
});
