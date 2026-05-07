const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const csv = require('csv-parser');
const { Readable } = require('stream');

const client = new Client();

const delay = ms => new Promise(res => setTimeout(res, ms));

// 🔗 PASTE YOUR GOOGLE SHEET LINKS HERE
const CANDIDATE_URL = "PASTE_CANDIDATES_LINK";
const JOBS_URL = "PASTE_JOBS_LINK";

// Fetch CSV
async function fetchCSV(url) {
    const response = await axios.get(url);
    const results = [];

    return new Promise((resolve) => {
        Readable.from(response.data)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results));
    });
}

client.on('qr', qr => {
    console.log("Scan QR Code:");
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log("✅ Bot Started");

    const candidates = await fetchCSV(CANDIDATE_URL);
    const jobs = await fetchCSV(JOBS_URL);

    const jobMap = {};
    jobs.forEach(j => jobMap[j.Job] = j);

    const batchSize = 50;

    for (let i = 0; i < candidates.length; i++) {
        const c = candidates[i];
        const job = jobMap[c.Job];

        if (!job) continue;

        const message = `Hi ${c.Name}, 👋

🚀 *We Are Hiring – ${job.Position}*

📌 Openings: ${job.Openings}  
📍 Location: ${job.Location}  

🗓 Date: ${job.Date}  
⏰ Time: ${job.Time}  

👩‍⚕️ Eligibility:
${job.Eligibility}

📞 Contact: Ms. Himanshi Saini  
📱 9257029677`;

        try {
            await client.sendMessage("91" + c.Phone + "@c.us", message);
            console.log(`Sent to ${c.Name}`);
        } catch (err) {
            console.log(`Failed for ${c.Name}`);
        }

        await delay(4000);

        if ((i + 1) % batchSize === 0) {
            console.log("⏳ Waiting 5 minutes...");
            await delay(5 * 60 * 1000);
        }
    }

    console.log("🎉 All Messages Sent!");
});

client.initialize();
