// server.js - 랭킹 기능 탑재 버전!
const express = require('express');
const { SpeechClient } = require('@google-cloud/speech');
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg'); // 데이터베이스와 대화하는 부품!

const app = express();
const port = process.env.PORT || 3000;

// --- 데이터베이스 연결 설정! ---
let pool;
if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    console.log("✅ 데이터베이스 연결 준비 완료!");
} else {
    console.error("🚨 데이터베이스 주소(DATABASE_URL)를 찾을 수 없어요!");
}

// --- 점수를 저장할 테이블(표) 만들기 ---
const createTable = async () => {
    if (!pool) return;
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS scores (
                id SERIAL PRIMARY KEY,
                nickname VARCHAR(50) NOT NULL,
                score INT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ 'scores' 테이블이 성공적으로 준비되었습니다.");
    } catch (err) {
        console.error("🚨 'scores' 테이블 만드는 중 오류 발생:", err);
    }
};
createTable();

// --- 구글 클라이언트 준비 (이전과 동일) ---
let googleSpeechClient;
let initializationError = null;
try {
    if (!process.env.GOOGLE_CREDENTIALS_JSON_CONTENT) throw new Error("Render 비밀금고에 GOOGLE_CREDENTIALS_JSON_CONTENT 변수가 없습니다!");
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON_CONTENT);
    googleSpeechClient = new SpeechClient({ credentials });
    console.log("✅ 구글 똑똑한 귀 준비 완료!");
} catch (e) {
    console.error("🚨 구글 똑똑한 귀 준비 실패:", e.message);
    initializationError = e;
}

// public 폴더의 파일들을 보여주고, JSON 요청을 읽을 수 있게 설정
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // ⭐ 점수 저장 요청(JSON)을 읽기 위해 꼭 필요!

const multerStorage = multer.memoryStorage();
const uploadMiddleware = multer({ storage: multerStorage });

// 발음 평가 API (이전과 동일)
app.post('/assess-my-voice', uploadMiddleware.single('userAudio'), async (req, res) => {
    // ... (이전과 동일한 발음 평가 로직) ...
    if (initializationError || !googleSpeechClient) return res.status(500).json({ success: false, errorMessage: '서버 문제로 음성 평가를 할 수 없어요.' });
    if (!req.file || !req.body.koreanWord) return res.status(400).json({ success: false, errorMessage: '필요한 정보가 부족해요.' });
    const practiceWord = req.body.koreanWord; const audioFileBytes = req.file.buffer.toString('base64'); 
    const audioRequestConfig = { encoding: 'WEBM_OPUS', languageCode: 'ko-KR', model: 'latest_long' };
    const requestToGoogle = { audio: { content: audioFileBytes }, config: audioRequestConfig };
    try {
        const [googleResponse] = await googleSpeechClient.recognize(requestToGoogle);
        let recognizedText = ""; let feedbackMessageToUser = "앗! 컴퓨터가 무슨 말인지 잘 못 알아들었어요. 😥"; 
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
        } else { res.status(400).json({ success: false, errorMessage: feedbackMessageToUser }); }
    } catch (error) { console.error('API 호출 중 문제 발생:', error); res.status(500).json({ success: false, errorMessage: '앗! 일꾼 로봇이 갑자기 아파서 일을 못했어요.' }); }
});

// --- ⭐⭐ 랭킹 API 엔드포인트 (이제 진짜로 일해요!) ⭐⭐ ---

// 랭킹 보여주기 (GET /api/scores)
app.get('/api/scores', async (req, res) => {
    if (!pool) return res.status(500).json({ error: '데이터베이스에 연결할 수 없어요.' });
    try {
        // 점수가 높은 순서대로 상위 10명만 뽑아오기!
        const result = await pool.query('SELECT nickname, score FROM scores ORDER BY score DESC LIMIT 10');
        console.log("DB에서 랭킹 데이터 전송:", result.rows);
        res.json(result.rows); // 찾은 랭킹 데이터를 웹페이지에 보내줘요.
    } catch (err) {
        console.error('랭킹 데이터 불러오기 오류:', err);
        res.status(500).json({ error: '랭킹을 불러오는 데 실패했어요.' });
    }
});

// 점수 저장하기 (POST /api/scores)
app.post('/api/scores', async (req, res) => {
    if (!pool) return res.status(500).json({ error: '데이터베이스에 연결할 수 없어요.' });
    const { nickname, score } = req.body;

    // 닉네임이나 점수가 없으면 저장 안 함!
    if (!nickname || score === undefined) {
        return res.status(400).json({ error: '닉네임과 점수가 모두 필요해요.' });
    }

    try {
        // 데이터베이스에 새로운 점수 기록 추가!
        const result = await pool.query(
            'INSERT INTO scores(nickname, score) VALUES($1, $2) RETURNING *',
            [nickname, score]
        );
        console.log("DB에 새로운 점수 저장 완료:", result.rows[0]);
        res.status(201).json(result.rows[0]); // 저장된 점수 정보를 웹페이지에 다시 보내줘요.
    } catch (err) {
        console.error('점수 저장 오류:', err);
        res.status(500).json({ error: '점수를 저장하는 데 실패했어요.' });
    }
});


// 서버 시작!
app.listen(port, () => {
    console.log(`🚀 얏호! 우리 게임 서버가 ${port}번 문에서 출발했어요! 🚀`);
});
