import * as vscode from 'vscode';
import { writeFile, write } from 'fs';
import { join } from 'path';


export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('extension.makeCommand', async () => {

		if (vscode.workspace.rootPath === undefined) {
			vscode.window.showErrorMessage('A working-space first must be opened');
			return;
		}

		const path = join(vscode.workspace.rootPath, 'commands');

		const optionName: vscode.InputBoxOptions = {
			value: 'default',
			prompt: 'Name of the command'
		};

		const optionDescription: vscode.InputBoxOptions = {
			value: 'default description',
			prompt: 'Description of the command'
		};

		const name: string | undefined = await vscode.window.showInputBox(optionName);
		const description: string | undefined = await vscode.window.showInputBox(optionDescription);
	
		if (!name) {
			vscode.window.showErrorMessage('A command name is required');
			return;
		}

		const capitalCase: string = name;
		const snakeCaseName: string = name.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).slice(1);
		const colonCaseName: string = name.replace(/[A-Z]/g, letter => `:${letter.toLowerCase()}`).slice(1);

		const definitionFile = getRenderedDefinitionFile(capitalCase, colonCaseName);
		const implementionFile = getRenderedImplementionFile(capitalCase, colonCaseName, snakeCaseName, description);

		const writeResult: Promise<string|void> = new Promise((resolve, reject) => {
			writeFile(join(path, snakeCaseName + '.cpp'), definitionFile, (err) => {
				if (err) {
					reject('Could not create cpp definition file.');
				}

				resolve();
			});

			writeFile(join(path, snakeCaseName + '.h'), implementionFile, (err) => {
				if (err) {
					reject('Could not create cpp implemention file.');
				}

				resolve();
			});
		});
		
		writeResult.then(() => {
			vscode.window.showInformationMessage('Command created successfully and placed in commands directory.');
		});
		
		writeResult.catch((err) => {
			vscode.window.showErrorMessage(err);
			vscode.window.showErrorMessage('Please make sure a commands directory is available and that the folder has write permissions.');
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {
	// cleanup
}

/**
 * Render a definition file.
 * 
 * @param capitalCase 
 * @param colonCaseName 
 * @return string
 */
function getRenderedDefinitionFile(capitalCase: string, colonCaseName: string): string {

	return `#pragma once

#include <console/interfaces/command_interface.h>
#include <console/types/collections.h>

namespace Interfaces = Console::Interfaces;
namespace Types = Console::Types;


/**
 * @name ${colonCaseName}
 */
class ${capitalCase} : public Interfaces::CommandInterface
{

public:

    /**
     * Retrieve the name of the command.
     *
     * @return std::string
     */
    std::string getName() override;

    /**
     * Retrieve the description of the command.
     *
     * @return std::string
     */
    std::string getDescription() override;

    /**
     * Retrieve the command options.
     *
     * @return Types::AvailableOptions
     */
    Types::AvailableOptions getOptions() override;

    /**
     * Handle the command.
     *
     * @param InputInterface * input
     * @param OutputInterface * output
     * @return ExitCode
     */
    ExitCode handle(Interfaces::InputInterface * input, Interfaces::OutputInterface * output) override;

};`;

}

/**
 * Render a Implemention file.
 * 
 * @param capitalCase 
 * @param colonCaseName 
 * @param snakeCaseName 
 * @param description 
 * @return Promise<string>
 */
function getRenderedImplementionFile(capitalCase: string, colonCaseName: string, snakeCaseName: string, description: string): string {
	
	return `#include "${snakeCaseName}.h"


/**
 * Retrieve the name of the command.
 *
 * @return std::string
 */
std::string ${capitalCase}::getName()
{
    return "${colonCaseName}";
}

/**
 * Retrieve the description of the command.
 *
 * @return std::string
 */
std::string ${capitalCase}::getDescription()
{
    return "${description}";
}

/**
 * Retrieve the command options.
 *
 * @return Types::AvailableOptions
 */
Types::AvailableOptions ${capitalCase}::getOptions()
{
    Types::AvailableOptions options;

    return options;
}

/**
 * Handle the command.
 *
 * @param InputInterface * input
 * @param OutputInterface * output
 * @return ExitCode
 */
ExitCode ${capitalCase}::handle(Interfaces::InputInterface * input, Interfaces::OutputInterface * output)
{
    if (input->wantsHelp()) {
        output->printCommandHelp(this);
        return ExitCode::NeedHelp;
    }

	// Implement something

    return ExitCode::Ok;
}`;

}