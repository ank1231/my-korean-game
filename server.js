const express = require('express');
const { SpeechClient } = require('@google-cloud/speech');
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

let pool;
let dbInitializationError = null;
if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    const createTable = async () => {
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
            dbInitializationError = err;
        }
    };
    createTable();
} else {
    dbInitializationError = new Error("데이터베이스 주소(DATABASE_URL)를 찾을 수 없어요!");
    console.error(`🚨 ${dbInitializationError.message}`);
}

let googleSpeechClient;
let googleInitializationError = null;
try {
    if (!process.env.GOOGLE_CREDENTIALS_JSON_CONTENT) {
        throw new Error("비밀금고에 GOOGLE_CREDENTIALS_JSON_CONTENT 변수가 설정되지 않았습니다!");
    }
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON_CONTENT);
    googleSpeechClient = new SpeechClient({ credentials });
    console.log("✅ 구글 똑똑한 귀 준비 완료!");
} catch (e) {
    console.error("🚨 구글 똑똑한 귀 준비 실패:", e.message);
    googleInitializationError = e;
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const multerStorage = multer.memoryStorage();
const uploadMiddleware = multer({ storage: multerStorage });

app.post('/assess-my-voice', async (req, res) => {
    if (googleInitializationError || !googleSpeechClient) return res.status(500).json({ success: false, errorMessage: '서버 문제로 음성 평가를 할 수 없어요.' });
    if (!req.file || !req.body.koreanWord) return res.status(400).json({ success: false, errorMessage: '필요한 정보가 부족해요.' });
    const practiceWord = req.body.koreanWord; 
    const audioFileBytes = req.file.buffer.toString('base64'); 
    const audioRequestConfig = { encoding: 'WEBM_OPUS', languageCode: 'ko-KR', model: 'latest_long' };
    const requestToGoogle = { audio: { content: audioFileBytes }, config: audioRequestConfig };
    try {
        const [googleResponse] = await googleSpeechClient.recognize(requestToGoogle);
        let recognizedText = ""; 
        let feedbackMessageToUser = "앗! 컴퓨터가 무슨 말인지 잘 못 알아들었어요. 😥"; 
        if (googleResponse.results && googleResponse.results.length > 0 && googleResponse.results[0].alternatives[0] && googleResponse.results[0].alternatives[0].transcript) {
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

app.get('/api/scores', async (req, res) => {
    if (dbInitializationError || !pool) return res.status(500).json({ error: '데이터베이스에 연결할 수 없어요.' });
    try {
        const result = await pool.query('SELECT nickname, score FROM scores ORDER BY score DESC, created_at ASC LIMIT 10');
        res.json(result.rows);
    } catch (err) {
        console.error('랭킹 데이터 불러오기 오류:', err);
        res.status(500).json({ error: '랭킹을 불러오는 데 실패했어요.' });
    }
});

app.post('/api/scores', async (req, res) => {
    if (dbInitializationError || !pool) return res.status(500).json({ error: '데이터베이스에 연결할 수 없어요.' });
    const { nickname, score } = req.body;
    if (!nickname || score === undefined) {
        return res.status(400).json({ error: '닉네임과 점수가 모두 필요해요.' });
    }
    try {
        const result = await pool.query('INSERT INTO scores(nickname, score) VALUES($1, $2) RETURNING *', [nickname.slice(0, 50), score]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('점수 저장 오류:', err);
        res.status(500).json({ error: '점수를 저장하는 데 실패했어요.' });
    }
});

app.listen(port, () => {
    console.log(`🚀 얏호! 우리 게임 서버가 ${port}번 문에서 출발했어요! 🚀`);
    if (googleInitializationError) console.log("🚨 하지만, 구글 똑똑한 귀 준비에 실패해서 발음 평가는 안 될 거예요!");
    if (dbInitializationError) console.log("🚨 하지만, 데이터베이스 준비에 실패해서 랭킹 기능은 안 될 거예요!");
});
