# Titan Reactor Plugins

Your plugin is **NOT** required to be in this repository. You are free to publish your plugin to `npm` without prior approval. However since these plugins are not technically stand alone javascript packages it is recommended to publish via this repository in order to stay in a private npm repository specifically for Titan Reactor. Note: Plugins must match an acceptable level of quality in order to be accepted into this repository.

## Adding your plugin

1) Create a **Pull Request**
2) Make sure your plugin lives in their own unique directory and that it follows the standards found in the [CREATING PLUGINS](https://github.com/imbateam-gg/titan-reactor/blob/dev/CREATING_PLUGINS.md) documentation. Make sure your plugin name follows the template: `@titan-reactor-plugins/your-plugin-name`.
3) If you wish to have your own repository, simply have a package.json with the repository field pointing towards your repository.
4) Once approved, your plugin will be published to npm under the **@titan-reactor-plugins** scope.

## Running these plugins

These plugins are not meant to run in an isolated node or web environment, but within Titan Reactor. You'll need to use the Plugin Manager and install the plugin from the Community tab in order to run any plugin here.
