import * as core from '@actions/core';
import { ToolsDirectory } from './toolsDirectory';
import { CakeToolSettings } from './cakeToolSettings';
import { isError, isString } from './guards';
import * as dotnet from './dotnet';
import * as cake from './cake';
import * as action from './action';

export async function run() {
  try {
    const inputs = action.getInputs();
    const scriptPath = inputs.scriptPath;
    const version = inputs.cakeVersion;
    const bootstrap = inputs.cakeBootstrap;

    const toolsDir = new ToolsDirectory();
    toolsDir.create();

    const cakeToolSettings = new CakeToolSettings(toolsDir, version?.version === 'tool-manifest');

    dotnet.disableTelemetry();
    dotnet.disableWelcomeMessage();

    if (cakeToolSettings.useToolManifest) {
      await dotnet.restoreTool();
    } else {
      if (version?.version === 'latest') {
        await dotnet.installLocalCakeTool(toolsDir);
      } else {
        await dotnet.installLocalCakeTool(toolsDir, version?.version);
      }
    }

    if (bootstrap) {
      await cake.bootstrapScript(scriptPath, cakeToolSettings);
    }

    await cake.runScript(scriptPath, cakeToolSettings, ...inputs.scriptArguments);
  } catch (error) {
    if (isError(error)) {
      core.setFailed(error.message);
    } else if (isString(error)) {
      core.setFailed(error);
    }
  }
}

run();
