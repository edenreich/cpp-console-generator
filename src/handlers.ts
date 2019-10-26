import { workspace, InputBoxOptions, window } from 'vscode';
import { writeFile, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { execSync, exec } from 'child_process';


export class Handlers {

    /**
     * Make the the files necessary for the command.
     * 
     * @return Promise<void>
     */
    public static async makeCommand(): Promise<void> {

        if (workspace.rootPath === undefined) {
            window.showErrorMessage('A working-space must be opened first.');
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

        let definitionFile: string = readFileSync(resolve(__dirname, '..', 'src', 'templates', 'commands', 'command_definition.h.stub'), { encoding: 'utf8' });
        let implementionFile: string = readFileSync(resolve(__dirname,  '..', 'src', 'templates', 'commands', 'command_implemention.cpp.stub'), { encoding: 'utf8' });

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

    /**
     * Create a new console project.
     * 
     * @return Promise<void>
     */
    public static async makeProject(): Promise<void> {

        const templatePath: string = resolve(__dirname, '..', 'src', 'templates', 'project');
        const projectPath: string | undefined = workspace.rootPath;

        if (!projectPath) {
            window.showErrorMessage('A working-space must be opened first.');
            return;
        }

        const optionApplicationName: InputBoxOptions = {
            value: 'app',
            prompt: 'Name of the application'
        };

        const optionApplicationBinaryName: InputBoxOptions = {
            value: 'app',
            prompt: 'The name of the output binary'
        };

        const optionApplicationDescription: InputBoxOptions = {
            value: 'default description',
            prompt: 'Description of the command'
        };

        const applicationName: string | undefined = await window.showInputBox(optionApplicationName);
        const applicationBinaryName: string | undefined = await window.showInputBox(optionApplicationBinaryName);
        const applicationDescription: string | undefined = await window.showInputBox(optionApplicationDescription);
    
        if (!applicationName) {
            window.showErrorMessage('An application name is required');
            return;
        }

        if (!applicationBinaryName) {
            window.showErrorMessage('An application binary name is required');
            return;
        }

        if (!applicationDescription) {
            window.showErrorMessage('An application description is required');
            return;
        }

        const cmakeFileStub: string = resolve(projectPath, 'CMakeLists.txt.stub');
        const mainFileStub: string = resolve(projectPath, 'main.cpp.stub');

        execSync(`cp -R ${templatePath}/* ${projectPath}`);

        let cmakeFile: string = readFileSync(cmakeFileStub, { encoding: 'utf8' });
        let mainFile: string = readFileSync(mainFileStub, { encoding: 'utf8' });

        cmakeFile = replaceAll(cmakeFile, {
            __APPLICATION_NAME__: applicationName
        });

        mainFile = replaceAll(mainFile, {
            __APPLICATION_NAME__: applicationName,
            __APPLICATION_BINARY_NAME__: applicationBinaryName,
            __APPLICATION_DESCRIPTION__: applicationDescription
        });

        const writeResult: Promise<string|void> = new Promise((resolve, reject) => {
            writeFile(join(projectPath, 'CMakeLists.txt'), cmakeFile, (err) => {
                if (err) {
                    reject('Could not create a cmake file.');
                }

                resolve();
            });

            writeFile(join(projectPath, 'main.cpp'), mainFile, (err) => {
                if (err) {
                    console.error(err);
                    reject('Could not create the main cpp file.');
                }

                resolve();
            });
        });
        
        writeResult.then(() => {
            execSync(`rm -rf ${cmakeFileStub} ${mainFileStub}`);
            window.showInformationMessage('Project created successfully. Just run \'cd build && cmake .. && cmake --build .\' to build the project.');
        });
        
        writeResult.catch((err) => {
            window.showErrorMessage(err);
            window.showErrorMessage('Something went wrong, please make sure the current folder has write permissions.');
        });
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
