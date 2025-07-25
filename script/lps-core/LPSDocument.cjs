const Line = require("./Line.cjs");

class LPSDocument {
  constructor() {
    /** @type {Line[]} A flat list of all lines in the document. */
    this.lines = [];
    /** @type {Line} The root line that contains all top-level lines. */
    this.root = new Line("root", "", -1); // Root level is -1
  }

  /**
   * Parses the given LPS text content.
   * @param {string} lpsContent The string content of the .lps file.
   */
  parse(lpsContent) {
    const textLines = lpsContent.split(/\r?\n/);
    const parentStack = [this.root]; // 使用栈来管理父节点

    for (const textLine of textLines) {
      let trimmedLine = textLine.trim();
      if (
        trimmedLine === "" ||
        trimmedLine.startsWith("//") ||
        trimmedLine.startsWith("///")
      ) {
        continue;
      }

      let currentParent = parentStack[parentStack.length - 1];

      // 检查是否是块的结束
      if (trimmedLine === "}") {
        parentStack.pop();
        continue;
      }

      // 检查是否是块的开始
      let isBlock = false;
      if (trimmedLine.endsWith("{")) {
        isBlock = true;
        trimmedLine = trimmedLine.slice(0, -1); // 去掉末尾的 '{'
      }

      // --- 使用我们之前最健壮的解析逻辑 ---
      let name,
        info,
        metadata = {};
      const parts = trimmedLine.split("=");
      const nameAndMetaPart = parts[0];
      const rawInfoAfterEquals = parts.slice(1).join("=");

      if (nameAndMetaPart.includes(":|")) {
        const metaParts = nameAndMetaPart.split(":|");
        const nameAndInfoBlock = metaParts[0];
        for (let j = 1; j < metaParts.length; j++) {
          const metaItem = metaParts[j];
          if (metaItem) {
            const [metaKey, metaValue] = metaItem.split("#");
            if (metaKey && metaValue !== undefined) {
              metadata[metaKey] = metaValue;
            }
          }
        }
        const nameInfoParts = nameAndInfoBlock.split("#");
        name = nameInfoParts[0].trim();
        const infoFromBlock = nameInfoParts.slice(1).join("#");
        info = infoFromBlock || rawInfoAfterEquals;
      } else if (nameAndMetaPart.includes("#")) {
        const nameParts = nameAndMetaPart.split("#");
        name = nameParts[0].trim();
        info = nameParts.slice(1).join("#") || rawInfoAfterEquals;
      } else {
        name = nameAndMetaPart.trim();
        info = rawInfoAfterEquals;
      }

      const newLine = new Line(name, info); // Level 不再需要了
      newLine.metadata = metadata;
      // --- 解析结束 ---

      currentParent.add(newLine);

      // 如果是块，将新行推入栈，成为新的父节点
      if (isBlock) {
        parentStack.push(newLine);
      }
    }
  }

  /**
   * Calculates the indentation level of a line based on leading tabs.
   * @private
   */
  _calculateLevel(textLine) {
    let level = 0;
    let spaceCount = 0;
    // 通常一个 Tab 等于 4 个或 2 个空格，我们先按 4 个来
    const SPACES_PER_LEVEL = 4;
    for (const char of textLine) {
      if (char === "\t") {
        level++;
        spaceCount = 0; // Tab 优先，重置空格计数
      } else if (char === " ") {
        spaceCount++;
        if (spaceCount >= SPACES_PER_LEVEL) {
          level++;
          spaceCount = 0; // 重置
        }
      } else {
        // 遇到任何非空白字符，立刻停止计算
        break;
      }
    }
    return level;
  }

  // --- Document-level Query API ---
  find(name) {
    return this.root.find(name);
  }
  findAll(name) {
    return this.root.findAll(name);
  }
  get(name, defaultValue) {
    return this.root.get(name, defaultValue);
  }

  /**
   * Converts the entire document back to LPS string format.
   * @returns {string}
   */
  toString() {
    return this.root.subs.map((sub) => sub.toString(0)).join("");
  }
}

module.exports = LPSDocument;
