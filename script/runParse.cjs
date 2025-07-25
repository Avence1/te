const fs = require("fs");
const path = require("path");
const LPSDocument = require("./lps-core/LPSDocument.cjs");

const lpsFilePath = path.join(__dirname, "../0000_core/pet/vup.lps");
const finalJsonPath = path.join(__dirname, "../0000_core/pet/vup2.json");

console.log(`Parsing LPS file: ${lpsFilePath}`);
const lpsContent = fs.readFileSync(lpsFilePath, "utf-8");

const doc = new LPSDocument();
doc.parse(lpsContent);

// 直接将解析后的根节点对象转换为 JSON
// 我们只关心 root 的子节点，所以是 doc.root
const finalJson = doc.root;

fs.writeFileSync(finalJsonPath, JSON.stringify(finalJson, null, 2));
console.log(`✅ Successfully parsed and saved to: ${finalJsonPath}`);
