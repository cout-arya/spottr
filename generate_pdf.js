const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
    try {
        // Detect Chrome Path
        let chromePath = '';
        if (fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')) {
            chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
        } else if (fs.existsSync('C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe')) {
            chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
        } else {
            console.error('❌ Google Chrome not found on system.');
            process.exit(1);
        }

        console.log(`🚀 Launching Puppeteer Core with: ${chromePath}`);
        const browser = await puppeteer.launch({
            executablePath: chromePath,
            headless: 'new'
        });

        const page = await browser.newPage();
        const htmlPath = path.join(__dirname, 'project_report.html');

        if (!fs.existsSync(htmlPath)) {
            console.error('❌ HTML file not found:', htmlPath);
            process.exit(1);
        }

        console.log(`📄 Loading File: ${htmlPath}`);
        await page.goto(`file://${htmlPath.replace(/\\/g, '/')}`, {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        console.log('🖨️  Generating PDF...');
        await page.pdf({
            path: 'project_report.pdf',
            format: 'A4',
            printBackground: true,
            margin: { top: '30px', right: '30px', bottom: '30px', left: '30px' },
            displayHeaderFooter: true,
            footerTemplate: '<div style="font-size:10px; margin-left:30px; color:#888;">Spottr Documentation - Page <span class="pageNumber"></span></div>',
            headerTemplate: '<div></div>'
        });

        await browser.close();
        console.log('✅ PDF Created Successfully: project_report.pdf');

    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        process.exit(1);
    }
})();
