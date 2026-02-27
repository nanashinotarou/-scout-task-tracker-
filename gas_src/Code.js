const LINE_ACCESS_TOKEN = "7f2Mmly0nNGzfbtTrFLRYzqD4MqmfMScYn2Pt9hWEV874TaXhAjGR0lE8A51V5ZtaT58ozdG5zEMcnsu3KWj/qeqI2+4RGB9LpluFeWwt89bqs47Qxr/2NACYlKnC5eRqHHH+BNOHXHYnxHBNb7v1AdB04t89/1O/w1cDnyilFU=";
const LINE_USER_ID = "U7df40d603279ca7bd29349a2d0deb78d";
const NOTIFY_EMAIL = "hkcxsmdg7@gmail.com";

function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);

        // 1. スプレッドシートへの記録
        recordToSheet(data);

        // 2. メッセージ文字列の生成
        const message = generateReportMessage(data);

        // 3. 通知の送信
        sendLineNotify(message);
        sendEmailNotify(message);

        return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

// CORS対応のためのOPTIONSリクエストハンドラ
function doOptions(e) {
    return ContentService.createTextOutput("")
        .setMimeType(ContentService.MimeType.JSON);
}

function recordToSheet(data) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("業務記録");

    if (!sheet) {
        sheet = ss.insertSheet("業務記録");
        // ヘッダー行の作成
        sheet.appendRow([
            "記録日時",
            "20代評価", "20代送付", "20代稼働時間",
            "30代評価", "30代送付", "30代稼働時間",
            "総評価件数", "総送付件数", "全体稼働時間"
        ]);
        sheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#f3f4f6");
        sheet.setFrozenRows(1);
    }

    const timestamp = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss");

    sheet.appendRow([
        timestamp,
        data.evalTwenties,
        data.sendTwenties,
        data.timeTwentiesFormatted,
        data.evalThirties,
        data.sendThirties,
        data.timeThirtiesFormatted,
        data.totalEval,
        data.totalSend,
        data.totalTimeFormatted
    ]);
}

function generateReportMessage(data) {
    return `📋 【ヤギオファー】業務完了報告

■ 本日の総計
総計評価: ${data.totalEval}件
総計送付: ${data.totalSend}件
全体稼働: ${data.totalTimeFormatted}

■ 内訳（20代）
評価: ${data.evalTwenties}件
送付: ${data.sendTwenties}件
稼働: ${data.timeTwentiesFormatted}

■ 内訳（30代）
評価: ${data.evalThirties}件
送付: ${data.sendThirties}件
稼働: ${data.timeThirtiesFormatted}

お疲れ様でした！スプレッドシートへの記録も完了しています。`;
}

function sendLineNotify(text) {
    const url = "https://api.line.me/v2/bot/message/push";
    const payload = {
        to: LINE_USER_ID,
        messages: [
            {
                type: "text",
                text: text
            }
        ]
    };

    const options = {
        method: "post",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + LINE_ACCESS_TOKEN
        },
        payload: JSON.stringify(payload)
    };

    try {
        UrlFetchApp.fetch(url, options);
    } catch (e) {
        console.error("LINE送付エラー:", e);
    }
}

function sendEmailNotify(text) {
    const subject = "【自動通知】ヤギオファー業務完了報告";
    try {
        MailApp.sendEmail(NOTIFY_EMAIL, subject, text);
    } catch (e) {
        console.error("Email送付エラー:", e);
    }
}
