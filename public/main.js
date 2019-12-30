process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

const {
    app,
    BrowserWindow,
    Menu,
    MenuItem,
    ipcMain
}                        = require('electron');
const WindowStateManager = require('electron-window-state-manager');
const IN_DEVELOPMENT     = require('electron-is-dev');
// const { 
//     default: installExtension,
//     REACT_DEVELOPER_TOOLS,
//     REDUX_DEVTOOLS
// } = require('electron-devtools-installer');
// const path = require('path');
// const os = require('os');
// const fs = require('fs');


global.IN_DEVELOPMENT = IN_DEVELOPMENT;
global.APP_PATH       = app.getAppPath();
global.APP_NAME       = app.name;
global.APP_VERSION    = app.getVersion();

class MainProcess
{
    constructor()
    {
        this.DIMENSIONS = { width: 1000, height: 800, minWidth: 400, minHeight: 300 };

        this.zone_editor_window               = null;
        this.zone_editor_window_state_manager = null;
        this.zone_editor_menu                 = null;
    }

    Start()
    {
        app.on('ready', () => {

            // if (IN_DEVELOPMENT)
            // {
            //     installExtension(REACT_DEVELOPER_TOOLS)
            //         .then((name) => console.log(`Added Extension:  ${name}`))
            //         .catch((err) => console.log('An error occurred: ', err));

            //     installExtension(REDUX_DEVTOOLS)
            //         .then((name) => console.log(`Added Extension:  ${name}`))
            //         .catch((err) => console.log('An error occurred: ', err));
            // }

            this.CreateZoneEditorWindow();
            this.Listen();
        });

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') { app.quit(); }
        });

        app.on('activate', () => {
            if (this.zone_editor_window === null) { this.CreateZoneEditorWindow(); }
        });

        app.on('quit', () => {
            process.exit(); // Leave the npm script
        });
    }

    Listen()
    {
      
    }

    CreateZoneEditorWindow()
    {
        this.zone_editor_window_state_manager = new WindowStateManager("zone_editor", {
            defaultWidth:  this.DIMENSIONS.width,
            defaultHeight: this.DIMENSIONS.height
        });
    
        this.zone_editor_window = new BrowserWindow({
            show:                   false,
            frame:                  true,
            title:                  global.APP_NAME,
            autoHideMenuBar:        false,
            backgroundColor:        "#FFFFFF",
            minWidth:               this.DIMENSIONS.minWidth,
            minHeight:              this.DIMENSIONS.minHeight,
            width:                  this.zone_editor_window_state_manager.width,
            height:                 this.zone_editor_window_state_manager.height,
            resizable:              true,
            center:                 true,
            movable:                true,
            maximized:              true,
            maximizable:            true,
            minimizable:            true,
            closable:               true,
            focusable:              true,
            alwaysOnTop:            false,
            fullscreen:             false,
            fullscreenable:         false,
            skipTaskbar:            false,
            kiosk:                  false,
            webPreferences: {
                devTools:           true,
                nodeIntegration:    true,
                enableRemoteModule: true
            }
        });

        const menu_template = [{
            label: 'File',
            submenu: [{
                id: 'open',
                label: 'Open Zone...',
                type: 'normal',
                accelerator: 'CmdOrCtrl+O',
                click: () => { this.HandleOpenZone(); }
            }, {
                type: 'separator'
            }, {
                id: 'reload',
                label: 'Reload from Database',
                type: 'normal',
                enabled: true,
                click: () => { this.HandleReloadFromDatabase(); }
            }, {
                id: 'close',
                label: 'Close Zone',
                type: 'normal',
                accelerator: 'CmdOrCtrl+W',
                enabled: false,
                // click: () => { this.HandleCloseZone(); }
            }, {
                type: 'separator'
            }, {
                role: 'quit'
            }]
        }, { 
            role: 'editMenu'
        }, {
            label: 'View',
            submenu: [{
                id: 'doors',
                label: 'Doors',
                type: 'submenu',
                submenu: [{
                    label: 'Doors',
                    type: 'checkbox',
                    checked: true,
                    click: (menuItem) => { this.ToggleEntityVisibility('Doors', menuItem.checked); }
                }, {
                    label: 'Door Labels',
                    type: 'checkbox',
                    checked: true,
                    click: (menuItem) => { this.ToggleEntityVisibility('Door Labels', menuItem.checked); }
                }]
            }, {
                id: 'spawns',
                label: 'Spawns',
                type: 'submenu',
                submenu: [{
                    label: 'Spawns',
                    type: 'checkbox',
                    checked: true,
                    click: (menuItem) => { this.ToggleEntityVisibility('Spawns', menuItem.checked); }
                }, {
                    label: 'Spawn Labels',
                    type: 'checkbox',
                    checked: true,
                    click: (menuItem) => { this.ToggleEntityVisibility('Spawn Labels', menuItem.checked); }
                }, {
                    label: 'Show Respawn Time on Labels',
                    type: 'checkbox',
                    checked: false,
                    click: (menuItem) => { this.ToggleRespawnLabels(menuItem.checked); }
                }]
            }, {
                id: 'traps',
                label: 'Traps',
                type: 'submenu',
                submenu: [{
                    label: 'Traps',
                    type: 'checkbox',
                    checked: true,
                    click: (menuItem) => { this.ToggleEntityVisibility('Traps', menuItem.checked); }
                }, {
                    label: 'Trap Labels',
                    type: 'checkbox',
                    checked: true,
                    click: (menuItem) => { this.ToggleEntityVisibility('Trap Labels', menuItem.checked); }
                }]
            }]
        }];

        this.zone_editor_menu = Menu.buildFromTemplate(menu_template);

        if (IN_DEVELOPMENT)
        {
            this.zone_editor_menu.append(new MenuItem({
                id: 'debug',
                label: 'Debug',
                submenu: [{
                    role: 'reload'
                }, {
                    role: 'forceReload'
                }, {
                    role: 'toggleDevTools'
                }]
            }));
        }

        this.zone_editor_window.setMenu(this.zone_editor_menu);

        if (this.zone_editor_window_state_manager.maximized)
        {
            this.zone_editor_window.maximize();
        }
    
        this.zone_editor_window.on('close',  () => this.zone_editor_window_state_manager.saveState(this.zone_editor_window));
        this.zone_editor_window.on('move',   () => this.zone_editor_window_state_manager.saveState(this.zone_editor_window));
        this.zone_editor_window.on('resize', () => this.zone_editor_window_state_manager.saveState(this.zone_editor_window));

        this.zone_editor_window.loadURL(
            IN_DEVELOPMENT
                ? 'http://localhost:3000#/zone_editor'
                : `file://${__dirname}/index.html#/zone_editor`
        );

        if (IN_DEVELOPMENT)
        {
            this.zone_editor_window.webContents.openDevTools();
        }

        this.zone_editor_window.once('ready-to-show', () => {
            this.zone_editor_window.show();
        });
    
        this.zone_editor_window.on('closed', () => {
            this.zone_editor_window = null;
            this.zone_editor_menu   = null;
        });
    }

    // File Menu
    HandleOpenZone() { this.zone_editor_window.webContents.send('open-zone'); }
    HandleReloadFromDatabase() { this.zone_editor_window.webContents.send('reload-from-database'); }

    // View Menu
    ToggleEntityVisibility(entity_type, value)
    {
        this.zone_editor_window.webContents.send('toggle-entity-visibility', entity_type, value);
    }

    ToggleRespawnLabels(value) { this.zone_editor_window.webContents.send('toggle-spawn-respawnlabels', value); }
}

(() => {
    const main_process = new MainProcess();

    main_process.Start();
})();
