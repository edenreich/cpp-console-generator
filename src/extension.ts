import * as vscode from 'vscode';
import { Handlers } from './handlers';


export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(vscode.commands.registerCommand('extension.makeCommand', Handlers.makeCommand));
	context.subscriptions.push(vscode.commands.registerCommand('extension.makeProject', Handlers.makeProject));
}

export function deactivate() {
	// cleanup
}
