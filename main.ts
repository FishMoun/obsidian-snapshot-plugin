import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import TurndownService from 'turndown';  // 引入 turndown 库
// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		//新增测试dataview
		// ✅ 新增命令：调用 Dataview API
		this.addCommand({
			id: 'test-dataview-api',
			name: 'Test Dataview API',
			callback: () => {
				// this.generateStaticMarkdown();
				// this.getReadingViewDom()
				// this.getEditingViewDom()
				this.copyAndSaveRenderedText();
			}
		});


		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (_evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, _view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}
	//新增测试dataview
	// ✅ 新增：测试 Dataview API
	testDataview() {
		// 获取 dataview 插件实例
		const dataview: any = this.app.plugins.getPlugin("dataview");
		if (!dataview) {
			new Notice("Dataview plugin is not enabled!");
			return;
		}

		if (!dataview.api) {
			new Notice("Dataview API not available!");
			return;
		}

		// 测试：获取当前活动文件的 dataview 数据
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) {
			new Notice("No active file!");
			return;
		}

		const page = dataview.api.page(activeFile.path);
		console.log("Dataview page object:", page);
		new Notice("Dataview API called, check console (F12).");
	}
	//测试生成静态md
	async generateStaticMarkdown() {
		const dv = this.app.plugins.getPlugin("dataview");
		if (!dv || !dv.api) {
			new Notice("Dataview not available!");
			return;
		}

		// 运行查询
		const query = ``;

		const result = await dv.api.query(query);
		if (!result.successful) {
			console.error(result.error);
			return;
		}
		console.log(result);
		// result.value.rows 就是表格的行
		const headers = result.value.headers;
		const rows = result.value.values;

		// 转成 Markdown 表格
		let table = `| ${headers.join(" | ")} |\n`;
		table += `| ${headers.map(() => "---").join(" | ")} |\n`;
		for (let row of rows) {
			table += `| ${row.map(cell => cell?.toString() ?? "").join(" | ")} |\n`;
		}

		// 写成新文件
		await this.app.vault.create("static_output.md", table);
		new Notice("Static markdown generated: static_output.md");
	}
	//测试内联代码
	async testInlineCode() {
		const dv = this.app.plugins.getPlugin("dataview");
		const activeFile = this.app.workspace.getActiveFile();
		const page = dv.api.page(activeFile.path);

		// 计算内联表达式
		const value = dv.api.evaluate("this.signals.air_ground_status.chinese_name", { this: page });
		console.log(value);

	}
	//获取阅读视图的dom
	async getReadingViewDom() {
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (markdownView && markdownView.getMode() === 'preview') {
			const previewEl = markdownView.contentEl; // 获取阅读视图的 DOM 元素
			console.log(previewEl); // 打印出来查看
			if (previewEl) {
				// 选择所有父元素是 span 的 span
				const nestedSpans = previewEl.querySelectorAll("span > span");
				const filteredSpans = Array.from(nestedSpans).filter(span => {
					// 检查子元素是否只有文本节点
					return span.childNodes.length === 1 && span.firstChild.nodeType === Node.TEXT_NODE;
				});
				console.log("嵌套 span 的数量:", nestedSpans.length);
			}
		}

	}
	//获取编辑视图的dom
	async getEditingViewDom() {
		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (markdownView && markdownView.getMode() === 'source') {
			const editorEl = markdownView.contentEl; // 获取编辑视图的 DOM 元素
			console.log(editorEl); // 打印出来查看
			if (editorEl) {


				const inlineCodeElements = editorEl.querySelectorAll('.cm-inline-code');
				console.log("编辑模式中 'cm-inline-code' 的元素个数:", inlineCodeElements.length);
				const count = Array.from(inlineCodeElements).filter(el =>
					el.textContent.trim().startsWith("$=")
				).length;
				console.log("编辑模式中以 '$=' 开头的内联代码元素个数:", count);
			}
		}
	}
	//复制渲染模式下的文本1

	async copyRenderedTextToFile() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

		if (activeView && activeView.getMode() === 'preview') {
			const renderedText = activeView.contentEl.textContent;  // 获取渲染后的文本

			//   // 复制文本到剪贴板
			//   await navigator.clipboard.writeText(renderedText);
			//   new Notice("渲染模式文本已复制到剪贴板！");

			// 将渲染文本写入到 output.md 文件
			const outputPath = 'output.md';
			const existingFile = this.app.vault.getAbstractFileByPath(outputPath);

			if (existingFile) {
				// 如果文件存在，读取并追加文本
				const currentContent = await this.app.vault.read(existingFile);
				const newContent = currentContent + `\n\n# Copied Text\n${renderedText}`;
				await this.app.vault.modify(existingFile, newContent);
				new Notice("渲染模式文本已追加到 output.md！");
			} else {
				// 如果文件不存在，则创建新文件
				const content = `# Copied Text\n${renderedText}`;
				await this.app.vault.create(outputPath, content);
				new Notice("渲染模式文本已保存到 output.md！");
			}
		} else {
			new Notice("当前视图不是渲染模式，无法复制文本！");
		}
	}
	//复制渲染模式下的文本2
	async copyAndSaveRenderedText() {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

		if (activeView && activeView.getMode() === 'preview') {

			//获取类名为markdown-preview-section的元素的innerHTML
			const sectionEl = activeView.contentEl.querySelector('.markdown-preview-section')
			// 删除mod-header
			const header = sectionEl?.querySelector('.mod-header');
			if (header) {
				header.remove();
			}
			const innerHtml = sectionEl?.innerHTML;
			// 创建一个 TurndownService 实例
			const turndownService = new TurndownService();
			turndownService.addRule('robust-table', {
				filter: (node) => node.nodeName === 'TABLE',
				replacement: (_content, node) => {
					const table = node as HTMLTableElement;

					// 收集每一行的单元格（th/td）
					const rows: string[][] = Array.from(table.querySelectorAll('tr')).map(tr => {
						const cells = Array.from(tr.querySelectorAll('th,td'));
						return cells.map(cell => {
							// 先用 turndown 把 cell 的 HTML -> MD，再做清洗
							const raw = turndownService.turndown((cell as HTMLElement).innerHTML);
							// 单行化 + 逃逸竖线 + 去空白
							const cleaned = raw
								.replace(/\n+/g, ' ')    // 多行并为一行
								.replace(/\s+/g, ' ')    // 连续空白压成一个空格
								.replace(/\|/g, '\\|')   // 逃逸竖线，防止破坏表格
								.trim();
							return cleaned;
						});
					}).filter(r => r.length > 0);

					if (rows.length === 0) return '';

					// 判断是否存在表头（是否出现 th）
					const hasHeader = table.querySelector('th') !== null;

					// 如果没有 th，则把第一行当表头
					const header = rows[0];
					const body = hasHeader ? rows.slice(1) : rows.slice(1);

					const colCount = header.length;
					const sep = Array(colCount).fill('---');

					// 组装 Markdown 表格
					const md = [
						`| ${header.join(' | ')} |`,
						`| ${sep.join(' | ')} |`,
						...body.map(r => {
							// 不足的列补空串，超出的列原样保留（也可截断）
							const row = r.length < colCount ? r.concat(Array(colCount - r.length).fill('')) : r;
							return `| ${row.join(' | ')} |`;
						})
					].join('\n');

					return `\n${md}\n`;
				}
			});

			const renderedMarkdown = turndownService.turndown(innerHtml); // 将 HTML 转换为 Markdown
			console.log(renderedMarkdown);
			// 1. 保存 Markdown 格式内容到 output.md 文件
			const outputPath = 'output.md';

			await this.app.vault.create(outputPath, renderedMarkdown);
			new Notice('渲染模式文本已保存到 output.md 文件！');
		} else {
			new Notice('当前视图不是渲染模式，无法复制文本！');
		}
	}
	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
