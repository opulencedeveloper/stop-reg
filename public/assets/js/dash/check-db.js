const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://telim4real_db_user:XdfqoPX1SaqxhXmw@stopregcluster.qojegqw.mongodb.net/stop_reg?appName=StopRegCluster";

async function checkExchanges() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');
        
        const MxMatch = mongoose.model('MxMatch', new mongoose.Schema({}, { strict: false }), 'mxmatches');
        
        const exchanges = ['mx00.mail.com', 'mx01.mail.com', 'mail.h-email.net', 'smtp.google.com', 'h-email.net', 'mail.com'];
        
        for (const ex of exchanges) {
            console.log(`\n--- Checking exchange ${ex} ---`);
            const found = await MxMatch.find({
                exchange_domains: { $in: [ex, ex.split('.').slice(-2).join('.')] }
            });
            console.log(`MxMatch: ${found.length > 0 ? 'Found ' + found.length + ' matches' : 'Not Found'}`);
            if (found.length > 0) console.log(JSON.stringify(found, null, 2));
        }
        
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkExchanges();
