const express = require('express');
const multer = require('multer');
const AdmZip = require('adm-zip');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

const GEMINI_API_KEY = 'AIzaSyAWzs0jLsbACltYOGDg8iBkPu1Py15datE'; // Thay thế bằng API key của bạn

app.post('/translate', upload.single('srtFile'), async (req, res) => {
    try {
        const filePath = req.file.path;
        const fileContent = fs.readFileSync(filePath, 'utf8');

        // Gửi yêu cầu dịch thuật đến API Gemini
        const response = await axios.post('https://api.gemini.com/v1/translate', {
            text: fileContent,
            target_lang: 'vi'
        }, {
            headers: {
                'Authorization': `Bearer ${GEMINI_API_KEY}`
            }
        });

        const translatedText = response.data.translated_text;

        // Tạo file SRT mới với nội dung đã dịch
        const translatedFilePath = path.join(__dirname, 'translated.srt');
        fs.writeFileSync(translatedFilePath, translatedText);

        // Đóng gói file SRT đã dịch vào file ZIP
        const zip = new AdmZip();
        zip.addLocalFile(translatedFilePath);
        const zipFilePath = path.join(__dirname, 'translated.zip');
        zip.writeZip(zipFilePath);

        // Gửi file ZIP về client
        res.download(zipFilePath, 'translated.zip', (err) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error downloading file');
            }

            // Xóa các file tạm sau khi gửi
            fs.unlinkSync(filePath);
            fs.unlinkSync(translatedFilePath);
            fs.unlinkSync(zipFilePath);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error translating file');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
