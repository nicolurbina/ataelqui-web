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
    console.log(`Fetching latest count...`);

    const countsRef = db.collection('counts');
    // Get the most recent one
    const snapshot = await countsRef.orderBy('date', 'desc').limit(1).get();

    if (snapshot.empty) {
        console.log('No counts found.');
        return;
    }

    snapshot.forEach(doc => {
        console.log('Count ID:', doc.id);
        const data = doc.data();
        // Print keys to see structure
        console.log('Keys:', Object.keys(data));

        // Check for common array names
        if (data.items) console.log('Found "items" array with length:', data.items.length);
        if (data.products) console.log('Found "products" array with length:', data.products.length);
        if (data.scannedItems) console.log('Found "scannedItems" array with length:', data.scannedItems.length);

        // Print full data for deep inspection if needed
        console.log(JSON.stringify(data, null, 2));
    });
}

inspectCounts();
