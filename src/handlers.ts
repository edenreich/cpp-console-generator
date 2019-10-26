import { workspace, InputBoxOptions, window } from 'vscode';
import { writeFile, readFileSync } from 'fs';
import { join, resolve } from 'path';


export class Handlers {

    /**
     * Make the the files necessary for the command.
     * 
     * @return Promise<void>
     */
    public static async makeCommand(): Promise<void> {

        if (workspace.rootPath === undefined) {
            window.showErrorMessage('A working-space first must be opened');
            return;
        }

        const path: string = join(workspace.rootPath, 'commands');

        const optionName: InputBoxOptions = {
            value: 'default',
            prompt: 'Name of the command'
        };

        const optionDescription: InputBoxOptions = {
            value: 'default description',
            prompt: 'Description of the command'
        };

        const name: string | undefined = await window.showInputBox(optionName);
        const description: string | undefined = await window.showInputBox(optionDescription);
    
        if (!name) {
            window.showErrorMessage('A command name is required');
            return;
        }

        if (!description) {
            window.showErrorMessage('A command description is required');
            return;
        }

        const capitalCaseName: string = name;
        const snakeCaseName: string = name.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).slice(1);
        const colonCaseName: string = name.replace(/[A-Z]/g, letter => `:${letter.toLowerCase()}`).slice(1);

        let definitionFile: string = readFileSync(join(resolve(__dirname), '..', 'src', 'templates', 'commands', 'command_definition.h.stub'), { encoding: 'utf8' });
        let implementionFile: string = readFileSync(join(resolve(__dirname), '..', 'src', 'templates', 'commands', 'command_implemention.cpp.stub'), { encoding: 'utf8' });

        definitionFile = replaceAll(definitionFile, {
            __COLON_CASE_NAME__: colonCaseName,
            __CAPITAL_CASE_NAME__: capitalCaseName
        });
        
        implementionFile = replaceAll(implementionFile, {
            __SNAKE_CASE_NAME__: snakeCaseName,
            __COLON_CASE_NAME__: colonCaseName,
            __DESCRIPTION__: description,
            __CAPITAL_CASE_NAME__: capitalCaseName
        });

        const writeResult: Promise<string|void> = new Promise((resolve, reject) => {
            writeFile(join(path, snakeCaseName + '.h'), definitionFile, (err) => {
                if (err) {
                    reject('Could not create cpp definition file.');
                }

                resolve();
            });

            writeFile(join(path, snakeCaseName + '.cpp'), implementionFile, (err) => {
                if (err) {
                    reject('Could not create cpp implemention file.');
                }

                resolve();
            });
        });
        
        writeResult.then(() => {
            window.showInformationMessage('Command created successfully and placed in commands directory.');
        });
        
        writeResult.catch((err) => {
            window.showErrorMessage(err);
            window.showErrorMessage('Please make sure a commands directory is available and that the folder has write permissions.');
        });
    }

    public static async makeProject(): Promise<void> {

        // @todo generate a console project
    }
}


/**
 * Simple util to replace all tokens with another.
 * 
 * @param str
 * @param replacements
 * @return string
 */
function replaceAll(str: string, replacements: {[key: string]: string}): string {
    const pattern = new RegExp(Object.keys(replacements).join('|'), 'gi');

    return str.replace(pattern, (match: string) => {
        return replacements[match];
    });
}
