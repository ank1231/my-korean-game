const express = require('express');
const { SpeechClient } = require('@google-cloud/speech');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// 데이터베이스 연결 설정
let pool;
let dbInitializationError = null;
if (process.env.DATABASE_URL) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    const createTable = async () => {
        try {
            await pool.query(`CREATE TABLE IF NOT EXISTS scores (id SERIAL PRIMARY KEY, nickname VARCHAR(50) NOT NULL, score INT NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`);
            console.log("✅ 'scores' 테이블 준비 완료.");
        } catch (err) {
            console.error("🚨 'scores' 테이블 만드는 중 오류:", err);
            dbInitializationError = err;
        }
    };
    createTable();
} else {
    dbInitializationError = new Error("데이터베이스 주소(DATABASE_URL)를 찾을 수 없음!");
    console.error(`🚨 ${dbInitializationError.message}`);
}

// 구글 클라이언트 준비
let googleSpeechClient;
let googleInitializationError = null;
try {
    if (!process.env.GOOGLE_CREDENTIALS_JSON_CONTENT) throw new Error("Render 비밀금고에 GOOGLE_CREDENTIALS_JSON_CONTENT 변수가 없음!");
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON_CONTENT);
    googleSpeechClient = new SpeechClient({ credentials });
    console.log("✅ 구글 똑똑한 귀 준비 완료!");
} catch (e) {
    console.error("🚨 구글 똑똑한 귀 준비 실패:", e.message);
    googleInitializationError = e;
}

// ⭐ FormData 대신 JSON을 사용하기 위한 설정! multer는 이제 필요 없어요!
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '10mb' })); // JSON 요청 본문 크기 제한을 넉넉하게!

// 발음 평가 API
app.post('/assess-my-voice', async (req, res) => {
    if (googleInitializationError || !googleSpeechClient) return res.status(500).json({ success: false, errorMessage: '서버 문제로 음성 평가 불가.' });

    // ⭐ FormData(req.file, req.body) 대신, req.body에서 모든 정보를 꺼내요!
    const { koreanWord, audioData_base64 } = req.body;

    if (!audioData_base64 || !koreanWord) {
        console.error("🚨 서버에 목소리 데이터 또는 단어가 도착하지 않았습니다!");
        return res.status(400).json({ success: false, errorMessage: '필요한 정보가 부족해요.' });
    }
    
    const audioRequestConfig = { encoding: 'WEBM_OPUS', languageCode: 'ko-KR', model: 'latest_long' };
    const requestToGoogle = { audio: { content: audioData_base64 }, config: audioRequestConfig };

    try {
        const [googleResponse] = await googleSpeechClient.recognize(requestToGoogle);
        let recognizedText = ""; 
        let feedbackMessageToUser = "앗! 컴퓨터가 무슨 말인지 잘 못 알아들었어요. 😥"; 
        if (googleResponse.results && googleResponse.results[0].alternatives[0] && googleResponse.results[0].alternatives[0].transcript) {
            recognizedText = googleResponse.results[0].alternatives[0].transcript;
            const practiceWordCleaned = practiceWord.replace(/[.,?!]/g, '').replace(/\s+/g, '').trim().toLowerCase();
            const recognizedTextCleaned = recognizedText.replace(/[.,?!]/g, '').replace(/\s+/g, '').trim().toLowerCase();
            if (recognizedTextCleaned === practiceWordCleaned) {
                feedbackMessageToUser = `정확해요! 👍 (컴퓨터가 들은 말: "${recognizedText}")`;
            } else {
                feedbackMessageToUser = `음... 컴퓨터는 "${recognizedText}" 라고 알아들었대요. 정답은 "${practiceWord}" 인데...`;
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

// 랭킹 API (이전과 동일)
app.get('/api/scores', async (req, res) => { if (dbInitializationError || !pool) return res.status(500).json({ error: 'DB 연결 불가.' }); try { const result = await pool.query('SELECT nickname, score FROM scores ORDER BY score DESC, created_at ASC LIMIT 10'); res.json(result.rows); } catch (err) { res.status(500).json({ error: '랭킹 불러오기 실패.' }); } });
app.post('/api/scores', async (req, res) => { if (dbInitializationError || !pool) return res.status(500).json({ error: 'DB 연결 불가.' }); const { nickname, score } = req.body; if (!nickname || score === undefined) return res.status(400).json({ error: '닉네임/점수 필요.' }); try { const result = await pool.query('INSERT INTO scores(nickname, score) VALUES($1, $2) RETURNING *', [nickname.slice(0, 50), score]); res.status(201).json(result.rows[0]); } catch (err) { res.status(500).json({ error: '점수 저장 실패.' }); } });

// 서버 시작!
app.listen(port, () => {
    console.log(`🚀 얏호! 우리 게임 서버가 ${port}번 문에서 출발했어요! 🚀`);
    if (googleInitializationError) console.log("🚨 구글 똑똑한 귀 준비 실패!");
    if (dbInitializationError) console.log("🚨 데이터베이스 준비 실패!");
});
