const admin = require('firebase-admin');
const serviceAccount = {
    projectId: "ataelqui-cfc94",
    clientEmail: "firebase-adminsdk-fbsvc@ataelqui-cfc94.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQClkmmCK2RYnI78\nn0OOtYXqCtikFMrijO5/RzvJK4dpuEwFdMQMgXbdgU69GUZ4NyQ9AvNF4/XO6I9a\nGpdbjAYdXBg+qJZZMo65N6byxtKacAb/P0zArimJMiXhHRFjFXbMmzZge6sEdKYb\nnRQiGbbOSF2mAznU0VrYUtf1CHAjQpsOg480KyfIBadV0MLkinznsJ8rK7TzTsll\naOy5kOaVKb9gunN/4EdczDwbKg53mUNED9PVyKnwhw4lDQSzN9oxKw/WJXKZHg/p\ni0NQmZiSIL67prm+0NyW9UHaQK4X7IXNTjiv0T7DHHN87bMQB6jk624DKWoqz+nJ\nAE1bEobPAgMBAAECggEARhAlRph/D4I8fYkViOumfcnWL+S+j8ysVb66fV/GnwWG\nYd6t4U7dklEYFSv/ZnqLAqhfcmlLCKHfm3TaLLqdkcn5VnZ3nMoonBcBNgXNc93J\nEDTkkTqByBUo81AeHewkx+M8SOq8DRghfFjlfqKb+UGlI02FKNnok9bGnOFTto9X\nhUGgJirOLoz5oVQ/p3Vn7eIVs+0jwq0jQWEflfJ8sym8f5GB4FGQxGvb44YR2Z7C\nbQViQ2/Q/XsA3YCXbWSRUz5rEH4nFxxC0B7icSunqTvfs2rHBujjeb5TSU4xtbTB\nOBTr17RBoqeiEtpb8M6R608KeHKruZxvl7kyTbVxzQKBgQDfVdoOlKwxId48B72x\nBaRZnxk3yxMsx+aIKQan4kLjWBaMvHxjKsBmkHDMx9McLaumuiz7tTp2OOvI/31m\nHG9XXGolVHo4KLx9SWBhiAQKEzNiwCWwGNLS5Orie80PWeUmaCuToo3x98oQll9v\nqrXy6+d5SacLucHLLZp4r1jD2wKBgQC9ycZu870otwbh9nDPrXT5t9WqmuA/nX/S\ng5DKAejzJcDa+xHR5TQHWOTh3Y51YIsQpOXdYsrIDFRB0HN/bNUydnOaagaxfnW5\njwYMrNIo9b6JEZzUCZGDni+2O11XP68M+PlPDeFloGZLq7oUkK1kOUOPVeZ8vD2U\nQCj5jeg1HQKBgGKLyVohtBFB9oPajpMsACcjkscRrnZWBp0SLUOrDQSv+9NB4EkJ\ntjgLiBp0Ge0XIeTBxdOTViaQW0onojeKWH7d4mBydDOPlgxaclLW56Fic4whaP/Z\nFD3GkPY61nLtobVexcuxMJ0ST3EeSSJG215DRbI5E6KS5rY2ezDBfpN9AoGBALmx\nggkvTKZYplBS60AX7HslBtc9YCp+NQHJntI4GjBFgTQBMgdXppeFv7TLLcbk5kwr\nu4joT5Z6kbovdcJ4vwT35tZv5QqnvBIJwZaHRb2z7HB6niLNFeZc0TwRS5vBgMpF\nlNFnuGDSFyT06kWS5URJzzOgjbsAB5RVToIV+dx1AoGAM6Fdd2OsqOHFmzAYT0JK\n9WU1/AezOWQqPuTKhG1BpvlmcUyMjiBu4OdLpjBUrM6/q5OpqQaxiK5HBss3+KY2\neACxapl0W9fEJU2ib6uatG7+vJ2o5/dIU0h2Pgm+oLusHuIduRcmcHlzrlwUiYpg\nXMFj6C6ehga8fVoLFvejmXI=\n-----END PRIVATE KEY-----\n"
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function inspectCounts() {
    console.log(`Fetching last 5 counts...`);

    const countsRef = db.collection('counts');
    const snapshot = await countsRef.orderBy('date', 'desc').limit(5).get();

    if (snapshot.empty) {
        console.log('No counts found.');
        return;
    }

    snapshot.forEach(doc => {
        console.log('\n=======================================');
        console.log('Count ID:', doc.id);
        const data = doc.data();
        console.log('Keys:', Object.keys(data).join(', '));

        if (data.items) {
            console.log(`[items] is present. Type: ${typeof data.items}, IsArray: ${Array.isArray(data.items)}`);
            if (Array.isArray(data.items)) {
                console.log(`[items] length: ${data.items.length}`);
                if (data.items.length > 0) {
                    console.log('First item sample:', data.items[0]);
                }
            }
        } else {
            console.log('[items] field is MISSING or undefined');
        }

        if (data.scannedItems) {
            console.log(`[scannedItems] found. Length: ${Array.isArray(data.scannedItems) ? data.scannedItems.length : 'N/A'}`);
        }
        if (data.products) {
            console.log(`[products] found. Length: ${Array.isArray(data.products) ? data.products.length : 'N/A'}`);
        }
    });
}

inspectCounts();
