#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';

class CodeReviewer {
  private apiKey: string;
  private baseUrl = 'https://api.siliconflow.cn/v1/chat/completions';

  constructor() {
    this.apiKey = process.env.SILICONFLOW_API_KEY || '';

    if (!this.apiKey) {
      throw new Error('SILICONFLOW_API_KEY environment variable is required');
    }
  }

  async reviewCode(prNumber: string, baseSha: string, headSha: string): Promise<string> {
    console.log(`🔍 开始审查 PR #${prNumber}...`);

    // 获取变更的文件
    const changedFiles = this.getChangedFiles(baseSha, headSha);
    console.log(`📁 发现 ${changedFiles.length} 个变更文件`);

    if (changedFiles.length === 0) {
      return `## 🤖 AI 代码审查报告

### 📊 总体评估
没有发现需要审查的代码变更

### 📝 总结
PR 中没有包含需要审查的代码文件

---
*此评论由 DeepSeek AI 自动生成*`;
    }

    // 获取代码差异
    const diff = this.getDiff(baseSha, headSha);
    console.log(`📝 获取到 ${diff.length} 行代码差异`);

    // 分析代码
    const analysis = await this.analyzeCode(changedFiles, diff);
    console.log(`✅ 代码分析完成`);

    return analysis;
  }

  private getChangedFiles(baseSha: string, headSha: string): string[] {
    try {
      console.log(`🔍 检查 git 状态...`);
      console.log(
        `📋 当前分支: ${execSync('git branch --show-current', { encoding: 'utf-8' }).trim()}`,
      );
      console.log(`📋 当前提交: ${execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim()}`);
      console.log(`📋 基础提交: ${baseSha}`);
      console.log(`📋 头部提交: ${headSha}`);

      // 首先尝试获取分支与主分支的差异
      let command: string;
      let output: string;

      try {
        // 尝试获取与主分支的差异（包含所有提交）
        command = `git diff --name-only origin/main...HEAD`;
        console.log(`🔍 执行命令: ${command}`);
        output = execSync(command, { encoding: 'utf-8' });
        console.log(`📋 分支差异输出: ${output}`);
      } catch (branchError) {
        console.log(`⚠️ 无法获取分支差异，回退到提交差异`);
        // 如果无法获取分支差异，回退到原来的方法
        command = `git diff --name-only ${baseSha} ${headSha}`;
        console.log(`🔍 执行命令: ${command}`);
        output = execSync(command, { encoding: 'utf-8' });
        console.log(`📋 提交差异输出: ${output}`);
      }

      const allFiles = output.split('\n').filter((file) => file.trim());

      console.log(`📁 所有变更文件: ${allFiles.join(', ')}`);

      const filteredFiles = allFiles.filter((file) => {
        // 只忽略 pnpm-lock.yaml 文件，其他文件都进行审查
        if (file === 'pnpm-lock.yaml') {
          console.log(`🚫 忽略文件: ${file}`);
          return false;
        }

        return true; // 审查所有其他文件
      });

      console.log(`📁 过滤后的文件: ${filteredFiles.join(', ')}`);

      return filteredFiles;
    } catch (error) {
      console.error('获取变更文件失败:', error);
      console.error('错误详情:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  private getDiff(baseSha: string, headSha: string): string {
    try {
      let command: string;

      try {
        // 首先尝试获取与主分支的差异（包含所有提交）
        command = `git diff origin/main...HEAD`;
        console.log(`🔍 获取分支差异: ${command}`);
        return execSync(command, { encoding: 'utf-8' });
      } catch (branchError) {
        console.log(`⚠️ 无法获取分支差异，回退到提交差异`);
        // 如果无法获取分支差异，回退到原来的方法
        command = `git diff ${baseSha} ${headSha}`;
        console.log(`🔍 获取提交差异: ${command}`);
        return execSync(command, { encoding: 'utf-8' });
      }
    } catch (error) {
      console.error('获取代码差异失败:', error);
      console.error('错误详情:', error instanceof Error ? error.message : String(error));
      return '';
    }
  }

  private async analyzeCode(files: string[], diff: string): Promise<string> {
    const prompt = this.buildPrompt(files, diff);

    try {
      const response = await this.callDeepSeekAPI(prompt);
      return response;
    } catch (error) {
      console.error('AI 分析失败:', error);
      return `## 🤖 AI 代码审查报告

### 📊 总体评估
代码审查过程中发生错误，请检查配置

### ⚠️ 需要关注的问题

#### 🟠 一般问题
- **系统错误**: 无法完成 AI 代码审查
  - 💡 建议: 请检查 SILICONFLOW_API_KEY 配置

### 📝 总结
审查失败，请重试

---
*此评论由 DeepSeek AI 自动生成*`;
    }
  }

  private buildPrompt(files: string[], diff: string): string {
    return `你是一位资深的代码审查专家，具有丰富的 TypeScript、React、Electron 和 Monorepo 开发经验。

请对以下代码变更进行专业的代码审查，重点关注：

## 审查重点

### 1. 代码质量
- 命名规范和代码风格
- 代码复杂度和可读性
- 函数和类的设计合理性
- 注释完整性和准确性
- 错误处理是否完善

### 2. 安全性
- 敏感信息泄露风险
- 输入验证和输出编码
- 权限控制和访问控制
- 依赖安全漏洞
- API 安全最佳实践

### 3. 性能
- 内存泄漏风险检查
- 性能瓶颈识别
- 异步操作优化
- 重复计算检查
- 资源使用效率

### 4. 架构设计
- 模块耦合度检查
- 设计模式使用
- 可扩展性评估
- 可测试性检查
- Monorepo 规范遵循

### 5. TypeScript 最佳实践
- 类型安全检查和严格模式
- 接口设计合理性
- 泛型使用规范
- 类型定义完整性
- 类型推断优化

### 6. React 最佳实践
- Hooks 使用规范
- 组件设计合理性
- 状态管理最佳实践
- 渲染性能优化
- 副作用处理

### 7. Electron 最佳实践
- 主进程安全实践
- 渲染进程隔离
- IPC 通信安全
- 资源加载安全
- 权限管理

## 审查格式

请直接返回 Markdown 格式的代码审查报告，包含以下结构：

## 🤖 AI 代码审查报告

### 📊 总体评估
[整体评价和建议]

### ⚠️ 需要关注的问题

#### 🔴 严重问题
- [问题描述] (优先级: 高)

#### 🟡 重要问题  
- [问题描述] (优先级: 中)

#### 🟠 一般问题
- [问题描述] (优先级: 低)

#### 🟢 轻微问题
- [问题描述] (优先级: 低)

#### 💡 改进建议
- [具体建议]

### ✅ 代码亮点
- [值得表扬的地方]

### 📝 总结
[总结和建议]

---

*此评论由 DeepSeek AI 自动生成*

## 代码变更

**变更文件：**
${files.join('\n')}

**代码差异：**
\`\`\`diff
${diff}
\`\`\`

请进行专业、详细的代码审查，提供具体的改进建议和代码示例。`;
  }

  private async callDeepSeekAPI(prompt: string): Promise<string> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-ai/DeepSeek-R1',
          messages: [
            {
              role: 'system',
              content: '你是一位专业的代码审查专家，请严格按照要求的 JSON 格式返回审查结果。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 4000,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}\n${errorText}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{
          message?: {
            content?: string;
          };
        }>;
      };

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('API 响应格式错误');
      }

      return data.choices[0].message.content || '';
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`DeepSeek API 调用失败: ${error.message}`);
      }
      throw new Error('DeepSeek API 调用失败: 未知错误');
    }
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error('用法: tsx code-review.ts <PR_NUMBER> <BASE_SHA> <HEAD_SHA>');
    process.exit(1);
  }

  const [prNumber, baseSha, headSha] = args;

  try {
    const reviewer = new CodeReviewer();
    const markdown = await reviewer.reviewCode(prNumber, baseSha, headSha);

    // 保存报告到文件
    const reportPath = join(process.cwd(), 'code-review-report.md');
    writeFileSync(reportPath, markdown);

    console.log('✅ 代码审查完成');
    console.log(`📄 报告已保存到: ${reportPath}`);

    // 输出到标准输出，供 GitHub Actions 使用
    console.log('\n---REPORT_START---');
    console.log(markdown);
    console.log('---REPORT_END---');
  } catch (error) {
    console.error('❌ 代码审查失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

export { CodeReviewer };
