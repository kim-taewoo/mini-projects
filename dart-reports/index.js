const puppeteer = require('puppeteer');

const log = console.log;

const scrapePosts = async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://dart.fss.or.kr/dsab002/main.do');

  await page.waitForSelector('#startDate', {
    visible: true,
  });
  await page.click('#startDate', { clickCount: 3 });
  await page.type('[name=startDate]', '20160101');
  await page.click('#endDate', { clickCount: 3 });
  await page.type('[name=endDate]', '20200406');

  await page.type('#reportName', '유상증자결정');

  // await page.select('#maxResultsCb', '100')
  // await page.click('#maxResultsCb')
  // await page.click('#maxResultsCb :nth-child(4)')
  // await page.screenshot({ path: '1.png' });
  await page.click('#searchpng');
  // 여기까지가 기본검색

  await page.waitForSelector('.page_list', {
    visible: true,
  });


  const result = { 'rcps': Array(), 'rcps2': Array(), 'ps': Array() };

  for (let index = 1; index <= 280; index++) {

    await page.waitForSelector('.page_list', {
      visible: true,
    });
    await page.waitFor(Math.floor((Math.random() * 2000) + 1000));
    const data = await page.evaluate(async () => {
      const companies = document.querySelectorAll('tr td:nth-child(2)');
      const links = document.querySelectorAll('tr td:nth-child(3) a');

      const companyList = Array.from(companies).slice(0, 15).map(company => company.textContent.strip());
      const linkList = Array.from(links).slice(0, 15).map(link => link.href);

      const list = [];
      for (let index = 0; index < companyList.length; index++) {
        const element = { 'company': companyList[index], 'link': linkList[index] };
        list.push(element);
      }
      return list;
    })


    for (const element of data) {
      console.log(element)
      const tmpPage = await browser.newPage();
      await tmpPage.goto(element.link);
      await tmpPage.waitForSelector('#ifrm', {
        visible: true,
      });

      // await tmpPage.screenshot({ path: '4.png' });

      const iframeEval = await tmpPage.evaluate(async () => {
        const ifrm = document.querySelector('#ifrm');
        const found = ifrm.contentWindow.find('상환전환우선주')
        const found2 = ifrm.contentWindow.find('전환상환우선주')
        const found3 = ifrm.contentWindow.find('우선주')
        return {
          found,
          found2,
          found3
        }
      });
      if (iframeEval.found) {
        result.rcps.push(element)
      } else if (iframeEval.found2) {
        result.rcps2.push(element)
      } else if (iframeEval.found3) {
        result.ps.push(element)
      }
      await tmpPage.close();
    }

    // await page.screenshot({ path: `${index}.png` });
    console.log(index)
    if ((index % 10) === 0) {
      await page.click(`.page_list :nth-child(13)`)
    } else {
      await page.click(`.page_list :nth-child(${index % 10 + 3})`);
    }

  }

  await browser.close();
  return result;

}

var fs = require('fs');

const logging = async () => {
  const finalResult = { 'rcps': [], 'rcps2': [], 'ps': [] };
  const result = await scrapePosts();
  finalResult.rcps = [...finalResult.rcps, ...result.rcps]
  finalResult.rcps2 = [...finalResult.rcps2, ...result.rcps2]
  finalResult.ps = [...finalResult.ps, ...result.ps]
  log(finalResult)
  fs.writeFile("test.txt", JSON.stringify(finalResult), function (err) {
    if (err) {
      console.log(err);
    }
  });
}
logging();