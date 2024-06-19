require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs').promises;

// Signup and get $10 credit in: https://brdta.com/LucasMontano
/* const AUTH = process.env.AUTH;
const SBR_WS_ENDPOINT = `wss://${AUTH}@brd.superproxy.io:9222`; */

const websiteConfigs = {
    'Indeed': {        
        baseUrl: 'https://www.indeed.com.br/empregos?q=',
        jobCountSelector: '.jobsearch-JobCountAndSortPane-jobCount',
        screenshotFolderName: 'indeed'
    },
    'Glassdoor': {                                
        baseUrl: 'https://www.glassdoor.com.br/Vaga/vagas.htm?sc.keyword=',
        jobCountSelector: '.SearchResultsHeader_jobCount__eHngv',
        screenshotFolderName: 'glassdoor'
    }
};

const JOBS = [
    'Técnico/a de Produção e Tecnologias da Música',
    /* 'Frontend Developer',
    'Full Stack Developer',
    'Node.js Developer',
    'React Developer',
    'Angular Developer',
    'Vue.js Developer',
    'UI/UX Developer',
    'Python Developer',
    'Data Scientist',
    'Machine Learning Engineer',
    'Java Developer',
    'Android Developer',
    'iOS Developer',
    '.NET Developer',
    'C# Developer',
    'PHP Developer',
    'Ruby on Rails Developer',
    'Ruby Developer',
    'Go Developer',
    'C++ Developer',
    'Game Developer',
    'TypeScript Developer',
    'Database Administrator',
    'Database Developer',
    'SQL Developer' */
];

async function scrapeWebsite(jobTitle, websiteName, config) {
  /*   const browser = await puppeteer.connect({
        browserWSEndpoint: SBR_WS_ENDPOINT,            
        headless: false,               
        timeout: 0
    }); */
    const browser = await puppeteer.launch(
        {headless:true}
    );

    try {                
        const page = await browser.newPage();              
        await prepareScreenshotFolder(jobTitle, config);
        await goToPage(page, jobTitle, config);
        await waitForPageLoad(page, jobTitle, config);
        const jobCount = await scrapeJobCount(page, config);
        console.log(`${websiteName} - ${jobTitle}:`, jobCount); 
        return { websiteName, jobTitle, jobCount };
    } catch (error) {
        console.error('Error:', error);
        return { websiteName, jobTitle, jobCount: 0 };
    } finally {
        await browser.close();
    }
}

async function prepareScreenshotFolder(jobTitle, config) {
    const folderPath = `./jobs/${config.screenshotFolderName}/${jobTitle}`;
    try {
        await fs.mkdir(folderPath, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            throw error;
        }
    }
}

async function goToPage(page, jobTitle, config) {
    const url = `${config.baseUrl}${encodeURIComponent(jobTitle)}&l=remote`;
    await page.goto(url);
    await page.screenshot({ path: `./jobs/${config.screenshotFolderName}/${jobTitle}/1-GoTo.png` });
}

async function waitForPageLoad(page, jobTitle, config) {
    let contentLoaded = false;
    let screenshotCount = 1;
    while (!contentLoaded) {
        try {
            await page.waitForSelector(config.jobCountSelector, { timeout: 10000 });
            contentLoaded = true;
            await page.screenshot({ path: `./jobs/${config.screenshotFolderName}/${jobTitle}/2-PageLoaded.png` });
        } catch (error) {
            await page.screenshot({ path: `./jobs/${config.screenshotFolderName}/${jobTitle}/2-CloudFlare-${screenshotCount}.png` });
            screenshotCount++;
            if (screenshotCount > 5) {
                throw error;
            }
        }
    }
}

async function scrapeJobCount(page, config) {
    await page.waitForSelector(config.jobCountSelector);

    const jobCountElement = await page.$(config.jobCountSelector);
    const jobCountText = await page.evaluate(element => element.textContent, jobCountElement);
    const cleanedJobCountText = jobCountText.replace(/,/g, '');
    const jobCount = parseInt(cleanedJobCountText.match(/\d+/)[0]);

    return jobCount;
}

let jobTitle = process.argv[2];

(async () => {        
    let scrapingTasks = [];
    for (const [websiteName, config] of Object.entries(websiteConfigs)) {
        if (jobTitle) {
            scrapingTasks.push(scrapeWebsite(jobTitle, websiteName, config));
            continue;
        }
        for (const jobTitle of JOBS) {                
            scrapingTasks.push(scrapeWebsite(jobTitle, websiteName, config));            
            await new Promise(resolve => setTimeout(resolve, 1000));            
        }
    }

    try {
        let results = await Promise.all(scrapingTasks);

        // group results by job title
        results = results.reduce((acc, result) => {
            if (!acc[result.jobTitle]) {
                acc[result.jobTitle] = { jobTitle: result.jobTitle, jobCount: 0 };
            }
            acc[result.jobTitle].jobCount += result.jobCount;
            return acc;
        }, {});
        // sort results by job count
        results = Object.values(results).sort((a, b) => b.jobCount - a.jobCount);
            
        console.log("--------------------");
        console.log("Jobs Sorted:");
        console.log("--------------------");
        
        results.forEach(result => {
            console.log(`${result.jobTitle}:`, result.jobCount);
        });
    } catch (error) {
        console.error('Error scraping job counts:', error);
    }
})().catch(error => {
    console.error('Unhandled promise rejection:', error);
});
