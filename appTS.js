var fs = require("fs");
var es = require("event-stream");
var stream = fs.createWriteStream("fixed-feed.xml");
var linecount = 0;
var pausedCount = 0;
var activeCount = 0;
fs.createReadStream("feed_sample.xml")
    // fs.createReadStream("feed.xml")
    .pipe(es.split())
    .pipe(es
    .mapSync(function (line) {
    linecount++;
    // if <opening_times> line, determin active or not and add <isActiv> node in new xml file
    if (line.includes("opening_time")) {
        var findJson = /\{(.*)\}/g;
        var extractedJson = line.match(findJson).toString();
        var parsedJson = JSON.parse(extractedJson);
        var today = new Date().getDay();
        // to match data in feed
        today = today === 0 ? 7 : today;
        //   const today = 2;
        var yesterday = today === 1 ? 7 : today - 1;
        var date = new Date();
        var fixedHours = (date.getUTCHours() < 10 ? "0" : "") + date.getUTCHours();
        var fixedMinutes = (date.getMinutes() < 10 ? "0" : "") + date.getMinutes();
        // 10:00 - 15:00 UTC =
        // 12:00 - 17:00 Warszawa
        var currentUTCHour = fixedHours + ":" + fixedMinutes;
        // const currentUTCHour = `18:46`;
        var isActive = void 0;
        if (
        // if opening times empty [], offer paused, eg. lines 301 and 881
        parsedJson["" + today] === undefined ||
            parsedJson["" + today][0] === undefined) {
            // but still the prev day might end after midnight and set offer active
            // ...as long as prev day is not [] as well
            if (parsedJson["" + yesterday] === undefined ||
                parsedJson["" + yesterday][0] === undefined) {
                isActive = false;
                pausedCount++;
                console.log("case1.pausing line " + linecount + ". Opening hours undefined and prev day undefined");
            }
            else {
                var openingHourForPrevDay = parsedJson["" + yesterday][0].opening;
                var closingHourForPrevDay = parsedJson["" + yesterday][0].closing;
                if (closingHourForPrevDay < openingHourForPrevDay &&
                    currentUTCHour < closingHourForPrevDay) {
                    isActive = true;
                    activeCount++;
                    console.log("case2.adding line: " + linecount + " this day is undefined but prev day saved the day!");
                }
                else {
                    isActive = false;
                    pausedCount++;
                    console.log("case3.pausing line " + linecount + ". Opening hours undefined. Prev. day hours defined and closing before midnight or before now");
                }
            }
            stream.write(line + "\n" + ("\t<is_active><![CDATA[" + isActive + "]]></is_active>\n"));
        }
        else {
            var openingHourForCurrentDay = parsedJson["" + today][0].opening;
            var closingHourForCurrentDay = parsedJson["" + today][0].closing;
            // in line 	<opening_times><![CDATA[{"1":[{"opening":"18:00","closing":"02:30"},{"opening":"18:00","closing":"02:00"}],"2":[],"3":[{"opening":"18:00","closing":"02:30"},{"opening":"18:00","closing":"03:00"}],"4":[{"opening":"18:00","closing":"02:30"},{"opening":"18:00","closing":"03:00"}],"5":[{"opening":"18:00","closing":"02:30"},{"opening":"18:00","closing":"03:00"}],"6":[{"opening":"18:00","closing":"02:30"},{"opening":"18:00","closing":"04:00"}],"7":[{"opening":"18:00","closing":"02:30"},{"opening":"18:00","closing":"03:00"}],"timezone":"Europe/Warsaw"}]]></opening_times>
            // there' re two {opening-closing} objects, I pick first one
            // change 00:00 format for calculation, eg. line 551
            // I assume opening:00:00 closing:00:00 = active 24h not never
            if (closingHourForCurrentDay === "00:00") {
                console.log("changing format", linecount);
                closingHourForCurrentDay = "24:00";
            }
            // for eg. line 281 day 5, closing hours after midnight(opening:11:00, closing:03:00)
            // I assume 02:00-03:00 = active for 1h (not 25)
            // and 11:00-03:00 = active for 16h, 3h after midnight
            if (closingHourForCurrentDay < openingHourForCurrentDay) {
                // in such weird case, just check opening hours FOR THIS DAY
                if (openingHourForCurrentDay < currentUTCHour) {
                    isActive = true;
                    activeCount++;
                    console.log("case4.adding line: " + linecount + " closingHour < openingHour and now is after opening");
                }
                else {
                    // but still PREV. DAY closing might end after midnight and set this day to active
                    // ...unless it's not undefined
                    if (parsedJson["" + yesterday] === undefined ||
                        parsedJson["" + yesterday][0] === undefined) {
                        isActive = false;
                        pausedCount++;
                        console.log("case5.pausing line " + linecount + ". closingHour < openingHour and prev day undefined");
                    }
                    else {
                        var openingHourForPrevDay = parsedJson["" + yesterday][0].opening;
                        var closingHourForPrevDay = parsedJson["" + yesterday][0].closing;
                        // but we need to check if closing:03:00 means after midnight next day
                        // opening:02:00 - closing 03:00 I assume = same day 1h
                        // but opening:11:00 - closing 03:00 I assume 3h next day
                        if (closingHourForPrevDay < openingHourForPrevDay &&
                            currentUTCHour < closingHourForPrevDay) {
                            // eg day 2, 01:00 = active in line <opening_times><![CDATA[{"1":[{"opening":"20:00","closing":"02:45"}],"2":[{"opening":"20:00","closing":"02:45"}],"3":[{"opening":"20:00","closing":"02:45"}],"4":[{"opening":"20:00","closing":"02:45"}],"5":[{"opening":"20:00","closing":"03:45"}],"6":[{"opening":"20:00","closing":"03:45"}],"7":[{"opening":"20:00","closing":"02:45"}],"timezone":"Europe/Warsaw"}]]></opening_times>
                            isActive = true;
                            activeCount++;
                            console.log("case6.adding line: " + linecount + " prev day hours saves the day!");
                        }
                        else {
                            isActive = false;
                            pausedCount++;
                            console.log("case7.pausing line1: " + linecount + " openingHour < closingHour and now is before opening and prev day not saves");
                        }
                    }
                }
            }
            // in other "normal" cases
            // now is between opening and closing hours
            else if (openingHourForCurrentDay < currentUTCHour &&
                closingHourForCurrentDay > currentUTCHour) {
                activeCount++;
                isActive = true;
                console.log("case11.adding line:", linecount);
            }
            else {
                // now is not between opening and closing hours
                // but still if closing FOR PREVIOUS DAY is after midnight, it might change status to active
                // ...as long as prev day is not []
                if (parsedJson["" + yesterday] === undefined ||
                    parsedJson["" + yesterday][0] === undefined) {
                    isActive = false;
                    pausedCount++;
                    console.log("case8.pausing line: " + linecount + " not between opening hours and prev day is empty");
                }
                else {
                    var openingHourForPrevDay = parsedJson["" + yesterday][0].opening;
                    var closingHourForPrevDay = parsedJson["" + yesterday][0].closing;
                    if (closingHourForPrevDay < openingHourForPrevDay &&
                        currentUTCHour < closingHourForPrevDay) {
                        isActive = true;
                        activeCount++;
                        console.log("case9.adding line: " + linecount + " prev day hours saves the day!");
                    }
                    else {
                        isActive = false;
                        pausedCount++;
                        console.log("case10.pausing line: " + linecount + "  openingHour < closingHour and now is not between opening-closing and prev. day defined but doesn't activate the offer");
                    }
                }
            }
            stream.write(line + "\n" + ("\t<is_active><![CDATA[" + isActive + "]]></is_active>\n"));
        }
    }
    // if last line, fix it, it needs / in <offers>
    else if (line.includes("offers") && linecount > 2) {
        stream.write("</offers>");
    }
    // if any other line, rewrite
    else {
        stream.write(line + "\n");
    }
})
    .on("end", function () {
    console.log("line count: " + linecount);
    console.log("this many paused: " + pausedCount + " and this many active: " + activeCount);
}));
