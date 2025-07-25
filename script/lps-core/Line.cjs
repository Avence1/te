// scripts/lps-core/Line.js

class Line {
  /**
   * @param {string} name The name of the line (text before '=')
   * @param {string} info The info of the line (text after '=')
   * @param {number} level The indentation level (number of tabs)
   */
  constructor(name = "", info = "", level = 0) {
    this.name = name;
    this.info = info;
    this.level = level;
    this.parent = null;
    this.subs = [];
    this.metadata = {};
  }

  /**
   * Adds a child line to this line.
   * @param {Line} sub The child line to add.
   */
  add(sub) {
    sub.parent = this;
    this.subs.push(sub);
  }

  // --- Query API ---

  /**
   * Finds the first child line with the specified name.
   * @param {string} name The name to search for.
   * @returns {Line | undefined}
   */
  find(name) {
    return this.subs.find((sub) => sub.name === name);
  }

  /**
   * Finds all child lines with the specified name.
   * @param {string} name The name to search for.
   * @returns {Line[]}
   */
  findAll(name) {
    return this.subs.filter((sub) => sub.name === name);
  }

  /**
   * Gets the info of the first child line with the specified name.
   * @param {string} name The name to search for.
   * @param {string} [defaultValue] The value to return if not found.
   * @returns {string | undefined}
   */
  get(name, defaultValue) {
    const line = this.find(name);
    return line ? line.info : defaultValue;
  }

  /**
   * Converts this line and its children back to LPS string format.
   * @param {number} currentLevel The current indentation level for formatting.
   * @returns {string}
   */
  toString(currentLevel = 0) {
    const indentation = "\t".repeat(currentLevel);
    let output = `${indentation}${this.name}=${this.info}\n`;
    for (const sub of this.subs) {
      output += sub.toString(currentLevel + 1);
    }
    return output;
  }
  toJSON() {
    return {
      name: this.name,
      info: this.info,
      metadata: this.metadata,
      subs: this.subs, // subs 数组里的每个 Line 对象也会被递归调用 toJSON
    };
  }
}

module.exports = Line;
