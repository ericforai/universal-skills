/**
 * Universal Skills Extension for Gemini CLI
 *
 * This extension provides access to the universal-skills repository
 * containing coding standards, debugging workflows, and best practices.
 */

const path = require('path');
const fs = require('fs');

// Path to universal skills
const UNIVERSAL_SKILLS_PATH = path.join(process.env.HOME, 'universal-skills', 'categories');

/**
 * Get skill content by category and name
 */
function getSkill(category, skillName) {
  const skillPath = path.join(UNIVERSAL_SKILLS_PATH, category, skillName);

  if (!fs.existsSync(skillPath)) {
    return null;
  }

  // Try to read SKILL.md first
  const skillMd = path.join(skillPath, 'SKILL.md');
  if (fs.existsSync(skillMd)) {
    return fs.readFileSync(skillMd, 'utf-8');
  }

  // Check if it's a markdown file
  if (skillPath.endsWith('.md') && fs.existsSync(skillPath)) {
    return fs.readFileSync(skillPath, 'utf-8');
  }

  return null;
}

/**
 * List all available skills
 */
function listSkills() {
  const skills = {};

  if (!fs.existsSync(UNIVERSAL_SKILLS_PATH)) {
    return skills;
  }

  const categories = fs.readdirSync(UNIVERSAL_SKILLS_PATH, { withFileTypes: true });

  for (const category of categories) {
    if (!category.isDirectory()) continue;

    const categoryPath = path.join(UNIVERSAL_SKILLS_PATH, category.name);
    const items = fs.readdirSync(categoryPath);

    skills[category.name] = items.filter(item => {
      const itemPath = path.join(categoryPath, item);
      const stat = fs.statSync(itemPath);
      return stat.isDirectory() || item.endsWith('.md');
    });
  }

  return skills;
}

/**
 * Format skills for display in chat
 */
function formatSkillsForChat(skills) {
  let output = '\n## 📚 Universal Skills\n\n';

  for (const [category, items] of Object.entries(skills)) {
    if (items.length === 0) continue;
    output += `### ${category}\n`;
    for (const item of items) {
      const name = item.replace('.md', '').replace(/-/g, ' ');
      output += `- ${name}\n`;
    }
    output += '\n';
  }

  return output;
}

/**
 * Extension activation
 */
function activate(context) {
  console.log('Universal Skills extension activated!');

  // Register command to list skills
  context.registerCommand('universal-skills.list', () => {
    const skills = listSkills();
    return formatSkillsForChat(skills);
  });

  // Register command to get skill content
  context.registerCommand('universal-skills.get', (category, skillName) => {
    const content = getSkill(category, skillName);
    if (content) {
      return `\n## 📖 ${skillName}\n\n${content}`;
    }
    return `Skill not found: ${category}/${skillName}`;
  });

  // Register command to search skills
  context.registerCommand('universal-skills.search', (query) => {
    const skills = listSkills();
    const results = [];

    for (const [category, items] of Object.entries(skills)) {
      for (const item of items) {
        const content = getSkill(category, item);
        if (content && content.toLowerCase().includes(query.toLowerCase())) {
          results.push({ category, item, preview: content.slice(0, 200) });
        }
      }
    }

    if (results.length === 0) {
      return `No skills found matching: ${query}`;
    }

    let output = `\n## 🔍 Search results for "${query}"\n\n`;
    for (const result of results) {
      output += `### ${result.category}/${result.item}\n`;
      output += `${result.preview}...\n\n`;
    }
    return output;
  });
}

function deactivate() {
  console.log('Universal Skills extension deactivated!');
}

module.exports = { activate, deactivate };
