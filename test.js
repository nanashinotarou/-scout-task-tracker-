const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = `<!DOCTYPE html>
<html>
<body>
  <div class="radio-group">
    <label class="radio-label">
      <input type="radio" name="eval-twenties" value="pass" checked>
      <span class="radio-custom pass">適合</span>
    </label>
    <label class="radio-label">
      <input type="radio" name="eval-twenties" value="fail">
      <span class="radio-custom fail">不適合</span>
    </label>
  </div>
  <button class="btn btn-eval" onclick="evaluate('twenties')">評価OK</button>
</body>
</html>`;

const dom = new JSDOM(html, { runScripts: "dangerously" });
const document = dom.window.document;

function evaluate(group) {
    try {
        const selected = document.querySelector(`input[name="eval-${group}"]:checked`).value;
        console.log("Selected value:", selected);
    } catch (error) {
        console.error("Error in evaluate:", error.message);
    }
}

evaluate('twenties');
