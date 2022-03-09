# Community Approved Plugins

This repository serves as a plugin respository for Titan Reactor. It provides a place for us to approve plugins for a certain level of quality for the community.

Code for the plugins does not need to live in this repository although that is an option that is available to developers.

## Adding your plugin

1) Create a **Pull Request**
2) If including your files in this repository, make sure they live in their own unique directory and that it follows the standards found in the [CREATING PLUGINS](https://github.com/imbateam-gg/titan-reactor/blob/dev/CREATING_PLUGINS.md) documentation.
3) If your plugin lives elsewhere, Titan Reactor supports the same repositories that NPM does, including github / gitlab repos and npm packages.
4) In the PR make sure to include your plugin repository url to `plugins.json`

## Running these plugins

These plugins are not meant to run in an isolated node or web environment, but within Titan Reactor. You'll need to use the Plugin Manager and install the plugin from the Community tab in order to run any plugin here.
