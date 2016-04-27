var HTTPS = require('https');
var cool = require('cool-ascii-faces');
var moment = require('moment');
var jsonfile = require('jsonfile')
var util = require('util')
require('moment-duration-format');

var botID = process.env.BOT_ID;
var botData = loadFile();

function respond() {
    var request = JSON.parse(this.req.chunks[0]),
        botCommands = /^[\/!]commands$/i; // Prints a list of commands
        botCool = /^[\/!]cool$/i; // Prints a random face
        botSaveCC = /^[\/!]setcc/i; // Saves a ClashCaller link
        botPrintCC = /^[\/!]cc$/i; // Prints the ClashCaller link
        botSaveWS = /^[\/!]setws/i; // Saves a War Sheet
        botPrintWS = /^[\/!]ws$/i; // Prints the War Sheet
        botPrintCW = /^[\/!]cw$/i; // Prints the ClashCaller and WarSheet together
        botSetWarStart = /^[\/!]setwarstart/i; // Sets the time left until war starts
        botSetWarEnd = /^[\/!]setwarend/i; // Sets the time left until war ends
        botTimeLeft = /^[\/!]timeleft$/i; // Prints time left until war starts or ends

    console.log('---------Begin Message---------')
    console.log('Sender: "' + request.name + '"');
    console.log('Sender ID: "' + request.sender_id + '"');
    console.log('Message: "' + request.text + '"');

    if (request.sender_type === 'bot') {
        console.log('>Ignoring message sent by bot.');
        console.log('----------End Message----------\n')
        this.res.writeHead(200);
        this.res.end();
    } else {
//commands
        if (request.text && botCommands.test(request.text)) {
            this.res.writeHead(200);
            postMessage('List of commands: \n'
                    + '/commands - Prints this list \n'
                    + '/setcc - Sets the ClashCaller link \n'
                    + '/cc - Prints the ClashCaller link \n'
                    + '/setws - Sets the War Sheet \n'
                    + '/ws - Prints the War Sheet \n'
                    + '/cw - Prints the ClashCaller and War Sheet \n'
                    + '/setwarstart - Set the time left until the war starts \n'
                    + '/setwarend - Set the time left until the war ends \n'
                    + '/timeleft - Prints the time until war starts or ends');
            this.res.end();
        }
// cool
        if (request.text && botCool.test(request.text)) {
            this.res.writeHead(200);
            postMessage(cool());
            this.res.end();
// setcc
        } else if (request.text && botSaveCC.test(request.text)) {
            var someText = request.text.slice(7);
            this.res.writeHead(200);
            postMessage(checkccLink(someText));
            this.res.end();
// cc
        } else if (request.text && botPrintCC.test(request.text)) {
            this.res.writeHead(200);
            var botData = loadFile();
            postMessage(checkUndefinedLink(botData.clashcaller));
            this.res.end();
// setws
        } else if (request.text && botSaveWS.test(request.text)) {
            this.res.writeHead(200);
            postMessage(savewsImg(request.attachments, request.text));
            this.res.end();
// ws
        } else if (request.text && botPrintWS.test(request.text)) {
            this.res.writeHead(200);
            var botData = loadFile();
            postMessage(null, botData.warsheet);
            this.res.end();
// cw
        } else if (request.text && botPrintCW.test(request.text)) {
            this.res.writeHead(200);
            var botData = loadFile();
            postMessage(botData.clashcaller, botData.warsheet);
            this.res.end();
// setwarstart
        } else if (request.text && botSetWarStart.test(request.text)) {
            this.res.writeHead(200);
            var botData = loadFile();
            var someText = request.text.slice(13); // Remove the command from message text
            var currentTime = moment();
            // detects if there was no input
            if (isEmpty(someText) === true) {
                postMessage('No input detected!');
            // After we make sure the input is not empty, do this:  
            } else {
                var splitText = someText.split(" ", 2); // split input by spaces, limit to two values
                var firstValue = splitText[0]; // store first value             
                // Check to see if there were two inputs
                if (Object.keys(splitText).length === 2) {
                    var secondValue = splitText[1];
                    // checks if both first and second values don't contain the required inputs.
                    if (firstValue.search(/^\d{1,2}[h]$/i) === -1 && secondValue.search(/^\d{1,2}[m]$/i) === -1) { // Check if the first value is hours or minutes
                        postMessage('Sorry, "' + firstValue + '\" and \"' + secondValue + '\" are not valid inputs. Please make sure to enter time as \"xxH yyM\"'); // If neither post this message
                    // If at least one has required input figure out which one, starting with the first.
                    } else if (firstValue.search(/^\d{1,2}[h]/i) === -1) {
                        postMessage('Sorry, "' + firstValue + '" is not a valid input. Please make sure to enter the hours first as xxH.');
                    // Now check if the second value contains a correct input.
                    } else if (secondValue.search(/^\d{1,2}[m]/i) === -1) {
                        postMessage('Sorry, "' + secondValue + '" is not a valid input. Please make sure to enter minutes second as yyM"');
                    } else {
                        var timeHours = parseInt(firstValue.replace(/H/i, '')); // Remove the h and convert string to number
                        var timeMinutes = parseInt(secondValue.replace(/M/i, '')); // Remove the m and convert string to number
                    }
                // ends checking of 2 inputs
                } else {
                    if (firstValue.search(/^\d{1,2}[hm]$/i) === -1) {
                        postMessage('Sorry, "' + firstValue + '" is not a valid input. Please make sure to enter time as xxH or yyM.');
                    } else {
                        if (firstValue.search(/^\d{1,2}[h]$/i) != -1) {
                            var timeHours = parseInt(firstValue.replace(/H/i, ''));
                        } else {
                            var timeMinutes = parseInt(firstValue.replace(/M/i, ''));
                        }
                    }
                }
                if (isEmpty(timeHours) === false && isEmpty(timeMinutes) === false) {
                    var newTime = moment().add(1, 'days').add(timeHours, 'hours').add(timeMinutes, 'minutes');
                    console.log(botData);
                    console.log(typeof botData);
                    botData.time = newTime;
                    saveFile(botData);
                    postMessage('You have set the war to start in "' + timeHours + '" Hours, and "' + timeMinutes + '" Minutes.');
                }
                if (isEmpty(timeHours) === false && isEmpty(timeMinutes) === true) {
                    var newTime = moment().add(1, 'days').add(timeHours, 'hours');
                    botData.time = newTime;
                    saveFile(botData);
                    postMessage('You have set the war to start in "' + timeHours + '" Hours.');
                }
                if (isEmpty(timeHours) === true && isEmpty(timeMinutes) === false) {
                    var newTime = moment().add(1, 'days').add(timeMinutes, 'minutes');
                    botData.time = newTime;
                    saveFile(botData);
                    postMessage('You have set the war to start in "' + timeMinutes + '" Minutes.');
                }
            }
            this.res.end();
//setwarend
        } else if (request.text && botSetWarEnd.test(request.text)) {
            this.res.writeHead(200);
            var botData = loadFile();
            var someText = request.text.slice(11); // Remove the command from message text
            var currentTime = moment();
            // detects if there was no input
            if (isEmpty(someText) === true) {
                postMessage('No input detected!');
            // After we make sure the input is not empty, do this:  
            } else {
                var splitText = someText.split(" ", 2); // split input by spaces, limit to two values
                var firstValue = splitText[0]; // store first value             
                // Check to see if there were two inputs
                if (Object.keys(splitText).length === 2) {
                    var secondValue = splitText[1];
                    // checks if both first and second values don't contain the required inputs.
                    if (firstValue.search(/^\d{1,2}[h]$/i) === -1 && secondValue.search(/^\d{1,2}[m]$/i) === -1) { // Check if the first value is hours or minutes
                        postMessage('Sorry, "' + firstValue + '\" and \"' + secondValue + '\" are not valid inputs. Please make sure to enter time as \"xxH yyM\"'); // If neither post this message
                    // If at least one has required input figure out which one, starting with the first.
                    } else if (firstValue.search(/^\d{1,2}[h]/i) === -1) {
                        postMessage('Sorry, "' + firstValue + '" is not a valid input. Please make sure to enter the hours first as xxH.');
                    // Now check if the second value contains a correct input.
                    } else if (secondValue.search(/^\d{1,2}[m]/i) === -1) {
                        postMessage('Sorry, "' + secondValue + '" is not a valid input. Please make sure to enter minutes second as yyM"');
                    } else {
                        var timeHours = parseInt(firstValue.replace(/H/i, '')); // Remove the h and convert string to number
                        var timeMinutes = parseInt(secondValue.replace(/M/i, '')); // Remove the m and convert string to number
                    }
                // ends checking of 2 inputs
                } else {
                    if (firstValue.search(/^\d{1,2}[hm]$/i) === -1) {
                        postMessage('Sorry, "' + firstValue + '" is not a valid input. Please make sure to enter time as xxH or yyM.');
                    } else {
                        if (firstValue.search(/^\d{1,2}[h]$/i) != -1) {
                            var timeHours = parseInt(firstValue.replace(/H/i, ''));
                        } else {
                            var timeMinutes = parseInt(firstValue.replace(/M/i, ''));
                        }
                    }
                }
                if (isEmpty(timeHours) === false && isEmpty(timeMinutes) === false) {
                    var newTime = moment().add(timeHours, 'hours').add(timeMinutes, 'minutes');
                    console.log(botData);
                    console.log(typeof botData);
                    botData.time = newTime;
                    saveFile(botData);
                    postMessage('You have set the war to end in "' + timeHours + '" Hours, and "' + timeMinutes + '" Minutes.');
                }
                if (isEmpty(timeHours) === false && isEmpty(timeMinutes) === true) {
                    var newTime = moment().add(timeHours, 'hours');
                    botData.time = newTime;
                    saveFile(botData);
                    postMessage('You have set the war to end in "' + timeHours + '" Hours.');
                }
                if (isEmpty(timeHours) === true && isEmpty(timeMinutes) === false) {
                    var newTime = moment().add(timeMinutes, 'minutes');
                    botData.time = newTime;
                    saveFile(botData);
                    postMessage('You have set the war to end in "' + timeMinutes + '" Minutes.');
                }
            }
            this.res.end();
// timeleft
        } else if (request.text && botTimeLeft.test(request.text)) {
            this.res.writeHead(200);
            var botData = loadFile();
            var currentTime = moment();
            var endTime = moment(botData.time);
            var timeDiff = endTime.diff(currentTime, 'seconds');
            if (timeDiff <= 169200 && timeDiff >= 86401) {
                var newTime = endTime.subtract(1, 'days');
                postMessage('The war will start in ' + moment.duration(newTime.diff(moment())).format('h [hours] m [minutes] s [seconds]') + '.');
            } else if (timeDiff > 0 && timeDiff <= 86400) {
                postMessage('The war will end in ' + moment.duration(endTime.diff(moment())).format('h [hours] m [minutes] s [seconds]') + '.');
            } else {
                postMessage('There is currently no valid time set.');
            }
            this.res.end();
// end of commands
        } else {
            console.log('>No command detected.');
            console.log('----------End Message----------\n')
            this.res.writeHead(200);
            this.res.end();
        }
    }
}

function postMessage(response, img, mention) {
    var botResponse, options, body, botReq, botUrl;

    botResponse = response;
    botUrl = img;

    if (typeof img === 'undefined') {
        attachment = [];
    } else {
        var attachment = [{
            "type": "image",
            "url": botUrl
        }]
    };

    options = {
        hostname: 'api.groupme.com',
        path: '/v3/bots/post',
        method: 'POST'
    };
    body = {
        "bot_id": botID,
        "text": botResponse,
        "attachments": attachment,
    };

    console.log('sending "' + botResponse + '" to  "' + botID + '"');
    console.log('contents of body: ' + JSON.stringify(body));
    console.log('----------End Message----------\n');

    botReq = HTTPS.request(options, function(res) {
        if (res.statusCode == 202) {
            //neat
        } else {
            console.log('rejecting bad status code ' + res.statusCode);
        }
    });

    botReq.on('error', function(err) {
        console.log('error posting message ' + JSON.stringify(err));
    });

    botReq.on('timeout', function(err) {
        console.log('timeout posting message ' + JSON.stringify(err));
    });
    botReq.end(JSON.stringify(body));
}

// Checks if a string is empty, null, or undefined
function isEmpty(str) {
    return (!str || 0 === str.length);
}

// Saves a war sheet image by attachment or as a link
function savewsImg(attachment, linkText) {
    substring = 'https://i.groupme.com/';
    if (attachment.length === 0 && linkText.indexOf(substring) === -1) {
        postMessage('Sorry, did not detect a valid image. Make sure you have attached an image, or linked an image already uploaded to GroupMe.');
    } else if (attachment.length != 0 || linkText.indexOf(substring) > -1) {
        if (attachment.length === 0 && linkText.indexOf(substring) > -1) {
            var someText = linkText.slice(7);
            botData.warsheet = someText;
            saveFile(botData);
            return 'Image saved!';
        } else {
            var imageLink = attachment[0].url;
            botData.warsheet = imageLink;
            saveFile(botData);
            return 'Image saved!';
        }
    }
}

// Checks if the ClashCaller link is valid
function checkccLink(linkText) {
    substring = '//clashcaller.com/war';
    if (linkText.indexOf(substring) > -1) {
        botData.clashcaller = linkText;
        saveFile(botData);
        return 'ClashCaller Link Saved!';
    } else {
        return 'Sorry, "' + linkText + '" is not a valid clashcaller link.';
    }
}

// Saves data to .json file
function saveFile (dataObj) {
    jsonfile.writeFileSync('./bot_data.json', dataObj);
}

// Loads data from .json file
function loadFile() {
    var dataFile = './bot_data.json';
    var fileData = jsonfile.readFileSync(dataFile);
    return fileData;
}

// Checks if a link has been set
function checkUndefinedLink(someText) {
    if (typeof someText === 'undefined') {
        return 'No link has been set!';
    } else {
        return someText;
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

exports.respond = respond;
Status API Training Shop Blog About
© 2016 GitHub, Inc. Terms Privacy Security Conta
