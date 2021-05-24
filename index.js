require('dotenv').config();
import fs from "fs";
import cron from "node-cron";
import puppeteer from "puppeteer";
import { format } from "date-fns";


async function getGymNumber() {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('https://www.puregym.com/login/');
        
        await page.type('.form__input[name="username"]', process.env.EMAIL);
        await page.type('.form__input[name="password"]', process.env.PIN);
        await page.keyboard.press('Enter');
    
        await page.waitForNavigation();
    
    
        await page.waitForSelector('#people_in_gym span');
        let element = await page.$('#people_in_gym span');
        let value = await page.evaluate(el => el.textContent, element);
    
        const howManyPeopleInTheGym = value.substring(0,2);
        console.log(`There are currently ${howManyPeopleInTheGym} people in the gym`);
        await browser.close();
        return howManyPeopleInTheGym;
}

function writeJsonFiles(gymNumbers, currentTime) {
    fs.readFile('./gym.json', 'utf-8', (err, jsonString) => {
        if (err) {
            console.log(err);
        } else {
            try {
                const data = JSON.parse(jsonString);
                data['times'].push({ "Time": currentTime, "people ": gymNumbers });
                fs.writeFile('./gym.json', JSON.stringify(data, null, 3), err => {
                    if (err) {
                        console.log(err);
                    }
                });
                console.log('Added Gym time');
            } catch(err) {
                console.log(`Error parsing JSON: ${err}`);
            }
        }
    });
}


cron.schedule('15 5-22 * * *', () => {
    console.log("Cron as started");
    const gymCount = getGymNumber();
    
    gymCount.then((currentNumber) => {
        const now = format(new Date(), 'EEEE do MMMM yyyy - HH:m');
        writeJsonFiles(currentNumber, now);
    });
    console.log("Cron as finished");
  });